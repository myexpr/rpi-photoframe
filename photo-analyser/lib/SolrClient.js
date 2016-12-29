let config = require('../Config').solr;
module.exports = (imageData) => {
    let request = require('request');

    let indexData = [];
    let exif = imageData.imageInfo.exif || {};

    let data = {
            id: imageData.path,
            Make: imageData.imageInfo.image.Make,
            Model: imageData.imageInfo.image.Model,
            XResolution: imageData.imageInfo.image.imageInfoXResolution,
            YResolution: imageData.imageInfo.image.YResolution,
            DateTimeOriginal: exif.DateTimeOriginal,
            CreateDate: exif.CreateDate,
            width: imageData.visionInfo.metadata.width || imageData.imageInfo.exif.ExifImageWidth || 0,
            height: imageData.visionInfo.metadata.height || imageData.imageInfo.exif.ExifImageHeight || 0,
            format: imageData.visionInfo.metadata.format,
    };

   try {
        if (imageData.visionInfo.categories.length > 0) {
            data.categories = [];
            imageData.visionInfo.categories.forEach(category => {
                data.categories.push(category.name);
            });
        }
    } catch (error) {
        console.log('Fetch categories from vision api - ',error);
    }


    try {
        if (imageData.visionInfo.tags.length >= 0) {
            data.tags = [];
            imageData.visionInfo.tags.forEach(tag => {
                data.tags.push(tag.name);
            });
        }
    } catch (error) {
        console.log('Fetch tags from vision api - ',error);
    }


    try {
        if (Object.keys(imageData.imageInfo.exif.gps).length > 0) {
            data.gps = imageData.imageInfo.exif.gps;
        }
    } catch (error) {
        console.log("Fetch GPS info -",error);
    }

    let createdTime = data.DateTimeOriginal || `0`;

    data.photoCreatedYear = createdTime.split(':')[0];

    indexData.push(data);

    let options = {
        url: config.URL,
        headers: {
            'Content-Type': 'application/json'
        },
        method: "POST",
        json: indexData
    };
    request(options, (error, response, body) => {
        let message = body;
        if (error) {
            message = error;
        }
        console.log(JSON.stringify(indexData));
        console.log(imageData.path + " - Solr - " + JSON.stringify(message))
    });
}
