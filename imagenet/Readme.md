## ImageNet

(https://www.kaggle.com/c/imagenet-object-localization-challenge/overview)

- metadata : contains objects definitions from this provider :
    - LOC_synset_mapping.csv : list of class Id / Human readle class
    - LOC_*_solution.csv : set of annotations (train / test / validation)
- filterImagesAndSynsets.js : script to build preliminary coco dataset based on the expected classes
- extractImages : script to extract images from the ImageNet archive (> 150Gb) available here : https://www.kaggle.com/c/imagenet-object-localization-challenge/data?select=imagenet_object_localization_patched2019.tar.gz