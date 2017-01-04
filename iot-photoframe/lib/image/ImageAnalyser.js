let exifInfo = require('./ExifInfo.js');
let visionInfo = require('./VisionInfo.js');

module.exports = (URL,callback) => {
    let imageData = {imageInfo: {}, visionInfo: {}, path: URL};
    let exifPromise = () => {
        return new Promise((resolve, reject) => {
            exifInfo(URL, (exifData) => {
                imageData.imageInfo = exifData;
                resolve(imageData);
            });
        });
    }

    let visionAPIPromise = () => {
        return new Promise((resolve, reject) => {
            visionInfo(URL, (error, response, body) => {
                imageData.visionInfo = body;
                resolve(imageData);
            });
        });

    }
    Promise.all([exifPromise(), visionAPIPromise()]).then((data) => {
        callback(imageData);
    });


}





