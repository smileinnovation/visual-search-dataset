const tar = require('tar-stream');
const fs = require('fs');
const path = require('path');
const gunzip = require('gunzip-maybe');
const { CocoGenerator } = require('../cocoGenerator');

// This file is built with filterImageAndSynsets.js
const cocoJson = require('./coco-dataset-train.json');
const cocoDataset = CocoGenerator.fromJson(cocoJson);

// This archive is from https://www.kaggle.com/c/imagenet-object-localization-challenge/overview
const IMAGE_NET_ARCHIVE = '/Volumes/SpeedyBackupARN/imagenet_object_localization_patched2019.tar.gz';
const IMAGE_FOLDER = './images'

const extract = tar.extract();

extract.on('entry', function(header, stream, next) {

    // Filename in ImageNet data ends with ".JPEG" extension
    if (header.name.endsWith('JPEG')) {
        // filename in archive is a path. So we extract the "file name" from this path
        const fileName = header.name.split('/').slice(-1).pop();
        if(!!fileName) {
            const image = cocoDataset.images.find(i => i.url === fileName);
            if(image) {
                console.log(`saving ${image.file_name}`);
                const folder = path.resolve(__dirname, IMAGE_FOLDER, image.file_name);
                const writer = fs.createWriteStream(folder);
                stream.pipe(writer);
            }
        }
    }

    stream.on('end', function() {
        next();
    });

    stream.resume();
});

fs.createReadStream(IMAGE_NET_ARCHIVE)
    .pipe(gunzip())
    .pipe(extract);



