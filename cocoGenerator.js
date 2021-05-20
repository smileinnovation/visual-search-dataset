function hash(str) {
    var hash = 5381,
        i = str.length;

    while(i) {
        hash = (hash * 33) ^ str.charCodeAt(--i);
    }

    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0;
}

class CocoImage {
    constructor({id, license, file_name, url, height, width}) {
        Object.assign(this, {id, license, file_name, url, height, width});
    }
}

class CocoCategory {
    constructor({supercategory, id , name}) {
        Object.assign(this, {supercategory, id , name});
    }

    static fromSynsetsByDataSource(synsetsByDataSource, superCategory) {
        return Object.keys(synsetsByDataSource).map((s, i) => {
            return new CocoCategory({superCategory, name:s, id:hash(s)});
        });
    }
}

class CocoLicense {
    constructor({id, url, name}) {
        Object.assign(this, {id, url, name});
    }
}

class CocoAnnotation {
    constructor({id, image_id, category_id, bbox, iscrowd= 0}) {
        Object.assign(this, {id, image_id, category_id, bbox, iscrowd, segmentation:[]});
    }
}

class CocoGenerator {
    constructor({description, version, year, date_created, images= [], annotations= [], categories = [], licenses = []}) {
        Object.assign(this, {info: {description, version, year, date_created}, images, annotations, categories, licenses})
    }

    static fromJson(json) {
        return new CocoGenerator({
            description:json.info.description,
            version:json.info.version,
            year:json.info.year,
            date_created:json.info.date_created,
            images:json.images,
            annotations:json.annotations,
            categories:json.categories,
            licenses:json.licenses
        });
    }
}

module.exports = {
    CocoAnnotation,
    CocoCategory,
    CocoGenerator,
    CocoImage,
    CocoLicense
}