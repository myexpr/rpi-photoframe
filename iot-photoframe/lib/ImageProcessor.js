const analyser = require("./image/ImageAnalyser.js");
const solrClient = require('./SolrClient.js');
const awsUtil = require("./AWSUtil.js");
module.exports = {
    pipe: (URL) => {
        const analiseImage = (URL, callback) => {
            analyser(URL, callback);
        };

        const indexImage = (imageMetadata) => {
            solrClient(imageMetadata);
            awsUtil.upload(imageMetadata);

        };

        awsUtil.checkFileExist(URL, (error, data) => {
            if (error) {
                analiseImage(URL, indexImage);
            } else {
                indexImage(JSON.parse(data.Body.toString('utf-8')))
            }
        });

    }
}
