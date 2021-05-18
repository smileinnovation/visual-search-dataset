## Dataset

So far this data set is build on :

1) Well-know dataset with object detection annotation :

  - Google OpenImage
  - ImageNet (Standford)
  - VisualGenome
   
2) Other image databases, which will require human annotation (TBD)

As of today we have identified the following amount of annotations within these providers :

|classes / provider |visualgenome  | openimage | imagenet | total
--- | --- | --- | --- | ---
|hammer|35 | 139 | 427 | 601
|screwdriver | 29 | 85 | 479	| 593	
|paintbrush |  7  |  0  |  533 | 540	
|drill | 	0	| 203| 	421| 	624
|wheelbarrow	| 0| 	0| 	543	| 543
 | | 94 |   427	| 2403 |

                      

### file classes2datasources_synsets.json

This file define the categories classes we wants to target in each datasource provider.
So it contains a map of provider, and a dictionnary of common classes, with a mapping to each provider own class name

