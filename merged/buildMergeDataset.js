const fs = require('fs');
const { CocoLicense, CocoImage, CocoGenerator, CocoCategory, CocoAnnotation } = require('../cocoGenerator');

const datasets = [
    require('./datasets/imagenet_coco-dataset-validation.json'),
    require('./datasets/imagenet_coco-dataset-train.json'),
    require('./datasets/open-image_coco-dataset-test.json'),
    require('./datasets/open-image_coco-dataset-validation.json'),
    require('./datasets/open-image_coco-dataset-train.json'),
    require('./datasets/visualgenome_coco-dataset-train.json'),
];

const licenses = [datasets[0].licenses, datasets[2].licenses, ].flat()//datasets[5].licenses].flat();
const categoriesIds = {}
const newCategories = datasets[0].categories.map((category, index) => {
    categoriesIds[category.id] = index;
    return new CocoCategory({
        supercategory:category.supercategory,
        id:index,
        name:category.name
    });
});

const imagesToMerge = datasets.map(d => d.images).flat();
const annotationsToMerge = datasets.map(d => d.annotations).flat();

const imagesIds = {}
const newImages = imagesToMerge.map((image, index) => {
    imagesIds[image.id] = index;
    return new CocoImage({
        id:index,
        file_name:image.file_name,
        width:image.width,
        height:image.height,
        license:image.license,
        url:image.url
    });
});

const newAnnotations = annotationsToMerge.map((annotation, index) => {
   return new CocoAnnotation({
       id:index,
       image_id:imagesIds[annotation.image_id],
       category_id:categoriesIds[annotation.category_id],
       bbox:annotation.bbox,
       iscrowd:annotation.iscrowd
   });
});

const mergedDataset = new CocoGenerator({
    description:"ESP_VisualSearch",
    version:"1.0",
    year:2021,
    date_created:"2021/05/20",
    images:newImages,
    annotations:newAnnotations,
    licenses,
    categories:newCategories
});

console.log('Saving data...');
fs.writeFile('./coco-dataset.json', JSON.stringify(mergedDataset), err => {
    if (err) {
        console.log('Error writing file', err)
    } else {
        console.log('Successfully wrote file')
    }
})