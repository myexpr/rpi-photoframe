const AWS = require('aws-sdk');
const config = require('./app-config.js');

const configPath = config.configPath;
const bucketName = config.bucket;
const prefix = config.prefix;
const timeout = config.timeout;

AWS.config.loadFromPath(configPath);
let s3 = new AWS.S3();
var bucketParams = {Bucket: bucketName, Prefix: prefix};
let counter = 0;
s3.listObjects(bucketParams, (err, data) => {

    let bucketContents = data.Contents || [];
    bucketContents.forEach(content => {
        const URL = `${s3.endpoint.href}${bucketName}/${content.Key}`;
        executeRequest(URL, counter++ );
    });
})

const executeRequest = (URL, timeCounter) => {
    if (!URL.endsWith("/")) {
        setTimeout(()=> {
            const request = require('request');
            console.log(URL);
            let options = {
                url: config.URL,
                headers: {
                    'url': URL
                },
                method: "POST"
            };
            request(options, (error, response, body) => {
                if (error) {
                    console.log(error);
                }
            });
        }, timeCounter * timeout);

    }
}