# rpi-photoframe

**Below are the list of AWS resources used for photo frame project and the regions they were created in.**

* SNS - NotifyMe - Region US East (N. Virginia) – us-east-1
* SES - Region US East (N. Virginia) – us-east-1
* Lamda for receiving emails - Region US East (N. Virginia) – us-east-1
* Lamda for picture analyzer - Region US East (Ohio) – us-east-2
* EC2 - Region US East (Ohio) – us-east-2
* S3 Bucket – Global But created under Region US East (Ohio) – us-east-2

#rpi-lambda#
Holds the event scripts for email receive and post image upload

#S3bucket-image-analyser#
Holds the batch script to list all the images from S3 bucket and index the EXIF and vision API data into Solr by connecting to photo-analyser script.

#photo-analyser#
Holds the scripts to get the EXIF information and connect with Vision API. This folder also contains the HTML to view the images in brower.
##Install##
execute `npm install` from `photo-analyser`

##Run##
'photo-analyser' can run in two modes, API or IOT subscribe mode.

####API mode####
use `node server.js <port number>`
<p>port number is optional. By default server runs on port 9000</p>

####IOT mode####
use `npm start`

##Brower URL##
http://hostname:port/index.html

By default server runs on port 9000.


##API to index the image into Solr##
* URL - http://hostname:port/analyse
<p>By default server runs on port 9000.</p>
* Header:
<p>url : image url</p>
* Method : POST

