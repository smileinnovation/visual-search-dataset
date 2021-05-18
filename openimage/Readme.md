## Open Image

(https://storage.googleapis.com/openimages/web/download.html)

- metadata : contains objects definitions from this provider :
    - class-descriptions-boxable.csv : list of class Id / Human readle class
    - *-annotations-bbox.csv : set of annotations (train / test / validation)
- filterImagesAndSynsets.js : script to build preliminary coco dataset based on the expected classes
- downloadImages : script to download related images from this provider (images are store in a public AWS S3 bucket)
