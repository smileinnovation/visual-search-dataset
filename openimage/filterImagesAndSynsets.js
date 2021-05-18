const csv = require('csv-parser')
const fs = require('fs')

const { CocoLicense, CocoImage, CocoGenerator, CocoCategory, CocoAnnotation } = require('../cocoGenerator');

const FILE_SET = './metadata/oidv6-train-annotations-bbox.csv';
const SET_NAME = 'train'

// functions to read synsets dictionnary
const synsetsByDataSource = require('../classes2datasources_synsets.json');
const synsetsProvider = Object.values(synsetsByDataSource.openimage).flat();
const providerToNormalized = Object.entries(synsetsByDataSource.openimage).reduce((dict, [key, values]) => {
    for(const value of values) {
        dict[value] = key;
    }
    return dict;
}, {});

const cocoCategories = CocoCategory.fromSynsetsByDataSource(synsetsByDataSource.openimage, "tools");
const licenses = [new CocoLicense({id:2, url:'https://storage.googleapis.com/openimages/web/index.html', name:'imagenet'})]

// ImageID,Source,LabelName,Confidence,XMin,XMax,YMin,YMax,IsOccluded,IsTruncated,IsGroupOf,IsDepiction,IsInside

let objectId = 0;
const filteredSynset = [];
const filterSynset = (data) => {
    const { ImageID, LabelName, XMin, XMax, YMin, YMax, IsOccluded, IsTruncated, IsGroupOf, IsDepiction, IsInside } = data;
    if(synsetsProvider.includes(LabelName)) {
        const synsetId = providerToNormalized[LabelName] || LabelName;
        filteredSynset.push(new CocoAnnotation({
            id:++objectId,
            image_id:ImageID,
            category_id:cocoCategories.find(c => c.name === synsetId).id || synsetId,
            // The COCO bounding box format is [top left x position, top left y position, width, height].
            bbox:[parseFloat(XMin), parseFloat(YMin), XMax - XMin, YMax - YMin]
        }));
    }
};

fs.createReadStream(FILE_SET)
    .pipe(csv())
    .on('data', (data) => filterSynset(data))
    .on('end', () => {

        const images = filteredSynset.reduce((uniqueImages, a) => {
            if(uniqueImages.findIndex(i => i.id === a.image_id) < 0) {
                uniqueImages.push(new CocoImage({
                    id:a.image_id,
                    license:licenses[0].id,
                    file_name:`${a.image_id}.jpg`,
                    url:`${SET_NAME}/${a.image_id}.jpg`,
                    height:0,
                    width:0
                }))
            }
            return uniqueImages;
        }, []);

        const cocoDataset = new CocoGenerator({
            description:"ESP_VisualSearch_openimage", version:"1.0", year:2021, date_created:"2021/05/12", images, annotations:filteredSynset, licenses, categories:cocoCategories
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