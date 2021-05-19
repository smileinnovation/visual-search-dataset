const fs = require('fs');
const sizeOf = require('image-size')
const { CocoGenerator } = require('../cocoGenerator');

const IMAGE_FOLDER = './images';
const DATASET_FILE = './coco-dataset-train.json';
const cocoJson = require(DATASET_FILE);
const cocoDataset = CocoGenerator.fromJson(cocoJson);

console.log(`INPUT IMAGES: ${cocoDataset.images.length}`);

const { newImages, errors } = cocoDataset.images.reduce((tuple, image) => {
    const imagePath = `${IMAGE_FOLDER}/${image.file_name}`;
    try {

        if(fs.existsSync(imagePath)) {
            const dimensions = sizeOf(imagePath);
            image.width = dimensions.width;
            image.height = dimensions.height;
            tuple.newImages.push(image);
        } else {
            tuple.errors.push(`${image.id} not found`);
        }

    } catch (err) {
        tuple.errors.push(`${image.id} error: ${err}`);
    }

    return tuple;
}, {newImages:[], errors:[]});

console.log(`OUTPUT IMAGES: ${newImages.length}`);
console.log(`IMAGES ERRORS: ${errors.length}`);

if(errors.length > 0) {
    console.log('Images errors: ')
    console.log(JSON.stringify(errors));
} else {
    cocoDataset.images = newImages;
    console.log('Saving updated data...');
    fs.writeFile(DATASET_FILE, JSON.stringify(cocoDataset), err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
        }
    });
}

