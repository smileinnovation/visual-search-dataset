const {
    S3Client,
    GetObjectCommand,
} = require("@aws-sdk/client-s3");

const fs   = require('fs');
const path = require('path');

const pLimit = require('p-limit');
const { CocoGenerator } = require('../cocoGenerator');

const cocoJson = require('./coco-dataset-train.json');

const cocoDataset = CocoGenerator.fromJson(cocoJson);

// Open Images data (jpg files) are available in AWS S3 bucket "open-images-dataset" in us-east-1 zone
const BUCKET_NAME = 'open-images-dataset';
const IMAGE_FOLDER = './images'
const REGION = "us-east-1";
const DEFAULT_PARAMS = {
    Bucket: BUCKET_NAME
};

// Create an Amazon Simple Storage Service (Amazon S3) client service object.
const s3 = new S3Client({ region: REGION });

const downloadLimit = pLimit(5);

const downloadImage = async (key, fileName) => downloadLimit(async () => {
        // Create a helper function to convert a ReadableStream to a string.
        const streamToFile = (stream, fileName) => {

            const folder = path.resolve(__dirname, IMAGE_FOLDER, fileName);
            const writer = fs.createWriteStream(folder);
            stream.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        }

        // Get the object from the Amazon S3 bucket. It is returned as a ReadableStream.
        return s3
            .send(new GetObjectCommand({...DEFAULT_PARAMS, Key:key}))
            .then(data => {
                // Stream data to file
                return streamToFile(data.Body, fileName);
            });
});

Promise.all(cocoDataset.images.map(i => {
    return downloadImage(i.url, i.file_name)
        .then(_ => console.log(`- ${i.id} downloaded`))
        .catch(err => console.log(`Error while downloading image ${i.id} : ${err}`))
})).then(_ => {
    console.log("download done.");
});




