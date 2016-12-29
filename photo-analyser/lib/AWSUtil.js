const AWS = require('aws-sdk');
let config = require('../Config').awsConfig;

AWS.config.loadFromPath(config.configPath);
const s3 = new AWS.S3();

module.exports = {

    upload: (data) => {
        let param = {
            Bucket: config.bucket,
            Key: `${config.prefix}${data.path.substring(data.path.lastIndexOf("/"))}.json`,
            Body: JSON.stringify(data)
        };

        s3.putObject(param, (err, sucess) => {
            if (err) {
                console.log('Error uploading data: ', sucess);
            } else {
                console.log('succesfully uploaded the json! - ',data.path);
            }
        });
    },
    checkFileExist: (filename, prefix, callback) => {
        let key = `${filename.substring(filename.lastIndexOf("/"))}.json`;

        if (typeof prefix === "function") {
            callback = prefix;
            prefix = null;
        }

        if (prefix === null) {
            prefix = config.prefix;
        }

        let param = {
            Bucket: config.bucket,
            Key: `${prefix}${key}`,
        };

        s3.getObject(param, (error, data) => {
            callback(error, data);
        });
    }
}