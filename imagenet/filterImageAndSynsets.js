const csv = require('csv-parser')
const fs = require('fs')

const { CocoLicense, CocoImage, CocoGenerator, CocoCategory, CocoAnnotation } = require('../cocoGenerator');

const FILE_SET = './metadata/LOC_train_solution.csv';
const SET_NAME = 'train'

// functions to read synsets dictionnary
const synsetsByDataSource = require('../classes2datasources_synsets.json');
const synsetsProvider = Object.values(synsetsByDataSource.imagenet).flat();
const providerToNormalized = Object.entries(synsetsByDataSource.imagenet).reduce((dict, [key, values]) => {
    for(const value of values) {
        dict[value] = key;
    }
    return dict;
}, {});

const cocoCategories = CocoCategory.fromSynsetsByDataSource(synsetsByDataSource.imagenet, "tools");
const licenses = [new CocoLicense({id:3, url:'https://image-net.org/download.php', name:'imagenet'})]

let objectId = 0;
const filteredSynset = [];
const filterSynsets = (synset) => {
    const { ImageId,PredictionString } = synset;
    const [ synsetLabel, xmin, ymin, xmax, ymax ] = PredictionString.split(' ');
    if(synsetsProvider.includes(synsetLabel)) {
        const synsetId = providerToNormalized[synsetLabel] || synsetLabel;
        filteredSynset.push(new CocoAnnotation({
            id:++objectId,
            image_id:ImageId,
            category_id:cocoCategories.find(c => c.name === synsetId).id || synsetId,
            // The COCO bounding box format is [top left x position, top left y position, width, height].
            bbox:[parseInt(xmin), parseInt(ymin), xmax - xmin, ymax - ymin]
        }));
    }
}

fs.createReadStream(FILE_SET)
    .pipe(csv())
    .on('data', (data) => filterSynsets(data))
    .on('end', () => {
        const images = filteredSynset.reduce((uniqueImages, a) => {
            if(uniqueImages.findIndex(i => i.id === a.image_id) < 0) {
                uniqueImages.push(new CocoImage({
                    id:a.image_id,
                    license:licenses[0].id,
                    file_name:`${a.image_id}.jpg`,
                    url:`${a.image_id}.JPEG`,
                    height:0,
                    width:0
                }))
            }
            return uniqueImages;
        }, []);

        const cocoDataset = new CocoGenerator({
            description:"ESP_VisualSearch_imagenet", version:"1.0", year:2021, date_created:"2021/05/12", images, annotations:filteredSynset, licenses, categories:cocoCategories
        });

        console.log('Saving data...');
        fs.writeFile(`./coco-dataset-${SET_NAME}.json`, JSON.stringify(cocoDataset), err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file')
            }
        });

    });