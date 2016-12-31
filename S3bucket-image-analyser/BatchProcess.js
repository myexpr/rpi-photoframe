const AWS = require('aws-sdk');
const config = require('./app-config.js');
const request = require('request');

const configPath = config.configPath;
const bucketName = config.bucket;
const prefix = config.prefix;
const timeout = config.timeout;

AWS.config.loadFromPath(configPath);
let s3 = new AWS.S3();
var bucketParams = {Bucket: bucketName, Prefix: prefix};

s3.listObjects(bucketParams, (err, data) => {
    let bucketContents = data.Contents || [];
    bucketContents.forEach(content => {
        const URL = `${s3.endpoint.href}${bucketName}/${content.Key}`;

        if (!URL.endsWith("/")) {

            let options = {
                url: config.URL,
                headers: {
                    'url': URL
                },
                method: "POST"
            };
            setTimeout(()=>{
                console.log(URL);
                request(options, (error, response, body) => {
                    if (error) {
                        console.log(error);
                    }
                });
            },timeout);

        }
    });

})