'use strict';
console.log('Loading receive-email function');

var aws = require('aws-sdk');
var MailParser = require("mailparser").MailParser;
var fs = require("fs");
var path = require('path');
var jimp = require('jimp');
var piexif = require("piexifjs");

exports.handler = (event, context, callback) => {
    const messageId = event.Records[0].ses.mail.messageId;
    console.log('Reveived message ID: ', messageId);
    processEmail(messageId);
};

function processEmail(messageId) {
    var params = {
        Bucket: 'digital-photoframe-lib',
        Key: 'emails-received/'+messageId,
        ResponseCacheControl: 'no-cache'
    };
    
    var s3 = new aws.S3({signatureVersion: 'v4'});
    var mailparser = new MailParser({debug:false});

    s3.getObject(params, function(err, data) {
        if (err) {
            console.log(err);
            var message = "Error getting object  from bucket. Make sure they exist and your bucket is in the same region as this function.";
            console.log(message);
        } else {
            console.log(params);
            console.log('CONTENT TYPE getObject:', data.ContentType);
            console.log('Data:', data);
            mailparser.write(data.Body);
            mailparser.end();
        }
    });
    mailparser.on("end", function(mail){
        console.log('Email is from: ', mail.from); // object structure for parsed e-mail
        console.log('Email subject: ', mail.subject);
        console.log('Number of attachments: ', mail.attachments.length);
        mail.attachments.forEach(function(attachment) {
            console.log('Processing file: ',attachment.fileName);
            scaleDownContentAndSave(attachment);
        });
    });

}

function getEnhancedFileName(fileName) {
    var ext = path.extname(fileName);
    return path.basename(fileName, ext) + '_' + new Date().getTime() + ext;

}

function saveContent(attachment, bitmapFileContent) {
    var generatedFileName = getEnhancedFileName(attachment.fileName);
    console.log('Saving content with generated file name : ', generatedFileName);
    var params = {
        Bucket: 'digital-photoframe-lib',
        Key: 'uploads/'+generatedFileName,
        Body: bitmapFileContent,
        ContentDisposition: 'filename="'+generatedFileName+'"',
        StorageClass: 'STANDARD',
        ACL: 'public-read'
    };
    var s3 = new aws.S3({signatureVersion: 'v4'});
    s3.putObject(params, function(err, putResponseData) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(putResponseData);           // successful response
    });
}

function scaleDownContentAndSave(base64FileAttachment) {

    var bitmapFileContent = new Buffer(base64FileAttachment.content, 'base64');
    let attachmentSize = base64FileAttachment.length;

    console.log('Attachment size: ', attachmentSize);

    if(attachmentSize > 4194304) {
        console.log('Attachment size is greater than 4 MB. So scaling down.');
        
        let exifStr = getExifData(bitmapFileContent);
        
        jimp.read(bitmapFileContent, function(err, image) {
            console.log('Scaling down image ');

            let isPotrait = (image.bitmap.width < image.bitmap.height)? true : false;
            let desiredWidth;
            let desiredHeight;
            if(isPotrait) {
                desiredWidth = 720;
                desiredHeight = 1280;
            } else {
                desiredWidth = 1280;
                desiredHeight = 720;
            }

            image.resize(desiredWidth, desiredHeight, function(err, image) {
                console.log('processing scale down image by retrieving the bitmap buffer');
                var tempfilepath = '/tmp/' + getEnhancedFileName(base64FileAttachment.fileName);
                console.log('Saving file temporarily at ', tempfilepath);
                image.write(tempfilepath, function(result) {
                    console.log('Saving result buffer after scaling down the iamge.');
                    fs.readFile(tempfilepath , function(err, data) {
                        var newData = piexif.insert(exifStr, data.toString('binary'));
                        var newJpeg = new Buffer(newData, "binary");
                        
                        saveContent(base64FileAttachment, newJpeg);
                    });
                });
            });
        });
            
    } else {
        console.log('Saving non - scaled version of image into S3');
        save(base64FileAttachment, bitmapFileContent);
    }
}

function getExifData(imageData) {
    console.log('Extracting Exif Data');
    var pictureData = imageData.toString("binary");
    var exifObj = piexif.load(pictureData);
    var exifStr = piexif.dump(exifObj);
    return exifStr;
}

