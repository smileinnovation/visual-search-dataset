const fs   = require('fs');
const path = require('path');

const pLimit = require('p-limit');
const axios = require('axios');
const { CocoGenerator } = require('../cocoGenerator');

const IMAGE_FOLDER = './images';
const downloadLimit = pLimit(5);

const cocoJson = require('./coco-dataset.json');
const cocoDataset = CocoGenerator.fromJson(cocoJson);

const downloadImage = async (url, fileName) => downloadLimit( () => {
    const folder = path.resolve(__dirname, IMAGE_FOLDER, fileName);
    const writer = fs.createWriteStream(folder);
    return axios({
        url,
        method: 'GET',
        responseType: 'stream'
    }).then(response => {
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    });
});

fs.mkdir(path.resolve(__dirname, IMAGE_FOLDER), { recursive: true }, (err) => {
    if (err) throw err;
});

const imageDownloader = Promise.all(cocoDataset.images.map(i => {
    return downloadImage(i.url, i.file_name)
        .then(_ => console.log(`- ${i.id} downloaded`))
        .catch(err => console.log(`Error while downloading image ${i.id} : ${err}`))
}));

imageDownloader.then(_ => {
    console.log("download done.");
})
