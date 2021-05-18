const fs   = require('fs');
const pLimit = require('p-limit');
const { chain }  = require('stream-chain');
const { parser } = require('stream-json');
const { pick }   = require('stream-json/filters/Pick');
const { ignore } = require('stream-json/filters/Ignore');
const { streamValues } = require('stream-json/streamers/StreamValues');
const { streamArray } = require('stream-json/streamers/StreamArray');
const { disassembler } = require('stream-json/Disassembler');
const axios = require('axios');

const { CocoLicense, CocoImage, CocoGenerator, CocoCategory, CocoAnnotation } = require('../cocoGenerator');

// functions to read synsets dictionnary
const synsetsByDataSource = require('../classes2datasources_synsets.json');
const synsetsProvider = Object.values(synsetsByDataSource.visualgenome).flat();
const providerToNormalized = Object.entries(synsetsByDataSource.visualgenome).reduce((dict, [key, values]) => {
    for(const value of values) {
        dict[value] = key;
    }
    return dict;
}, {});

const cocoCategories = CocoCategory.fromSynsetsByDataSource(synsetsByDataSource.visualgenome, "tools");

// Visual Genome API call to retrieve Image URL
const imageUrlConfig = { headers: { 'Content-Type': 'application/json' }};

// We will limit imageUrl Api calls with 5 concurrent calls
const limitImageUrl = pLimit(5);
const retrieveImageUrl = async (id) => limitImageUrl(() => axios.get(`http://visualgenome.org/api/v0/images/${id}`, imageUrlConfig));
const retrieveImageUrls = async (objects) => Promise.all(
    objects.map(o =>
        retrieveImageUrl(o.imageId)
            .then(r => o.image = {url:r.data.url, height:r.data.height, width:r.data.width })
    )
);

const toCoco = (synsets) => {
    const licenses = [new CocoLicense({id:1, url:'https://creativecommons.org/licenses/by/4.0/', name:'visualgenome'})]
    const { images, annotations } = synsets.reduce((tuples, o) => {

        const { imageId, image, objects } = o;
        //const imageIdWithDSPrefix = `vg_${imageId}`
        const imageIdWithDSPrefix = imageId;

        if(tuples.images.findIndex((i) => imageIdWithDSPrefix === i.imageId) < 0) {
            tuples.images.push(new CocoImage({id:imageIdWithDSPrefix, license:1, file_name:`${imageIdWithDSPrefix}.jpg`, url:image.url, height:image.height, width:image.width}));
        }

        tuples.annotations.push(objects.map(o => new CocoAnnotation({
            id:o.object_id,
            image_id:imageIdWithDSPrefix,
            category_id:cocoCategories.find(c => c.name === o.synsets[0]).id || o.synsets[0],
            // The COCO bounding box format is [top left x position, top left y position, width, height].
            bbox:[o.x, o.y, o.w, o.h]
        })));

        return tuples;
    }, {images:[], annotations:[]});

    return new CocoGenerator({
        description:"ESP_VisualSearch_VisualGenome", version:"1.0", year:2021, date_created:"2021/05/12", images, annotations, licenses, categories:cocoCategories
    });
}

const pipeline = chain([
    fs.createReadStream('metadata/objects.json'),
    parser(),
    streamArray(),
    disassembler(),
    pick({filter: 'value'}),
    streamValues(),
    data => {

    /*
    * Data is a key value object, with :
    *   - key : index
    *   - value : object
    *
    * In our case an object is Visual Genome object :
    *
    *   {
          "image_id": 2409888,
          "objects": [
            {
              "synsets": ["brush.n.01"],
              "h": 39,
              "object_id": 1087772,
              "w": 68,
              "y": 294,
              "x": 74
            },
            {
              "synsets": ["screwdriver.n.01"],
              "h": 228,
              "object_id": 1087762,
              "w": 365,
              "y": 105,
              "x": 11
            },
            ...
          ]
        }
    *
    * */
    const { key, value } = data;
    if(!!value) {
        const { image_id, objects } = value;

        // Here we want to keep only objects that contains expected synsets
        const objectsWithExpectedSynsets = objects.reduce((filteredObjects, o) => {
            const { h, w, x, y, object_id, synsets } = o;
            const filteredSynsets = synsets.filter(ss => synsetsProvider.includes(ss)).map(p => providerToNormalized[p] || p);
            if(filteredSynsets.length > 0) filteredObjects.push({h, w, x, y, object_id, synsets:filteredSynsets })
            return filteredObjects;
        }, []);
        return objectsWithExpectedSynsets.length > 0 ? {key, value:{objects:objectsWithExpectedSynsets, imageId:image_id}} : null;
    } else return null;

    }
]);

const filteredObjects = [];
let objectCounter = 0;
pipeline.on('data', (data) => {
    ++objectCounter;
    filteredObjects.push(data.value);
});
pipeline.on('end', async () => {
    console.log(`Found ${objectCounter} images.`);
    console.log('Retrieving image URL...');
    await retrieveImageUrls(filteredObjects);
    const cocoDataset = toCoco(filteredObjects);

    console.log('Saving data...');
    fs.writeFile('./coco-dataset.json', JSON.stringify(cocoDataset), err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
        }
    })
});


