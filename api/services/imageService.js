/**
 * Created by MyPC on 6/1/2017.
 */
var AWS = require('aws-sdk'),
  s3 = new AWS.S3(),
  jdenticon = require("jdenticon"),
  identicon = require("identicon.js"),
  fs = require("fs"),
  md5 = require('md5');

module.exports = {
  createRandomImage: function (data) {
    var size = 100, hash = md5(data.hash), png = new identicon(hash,size).toString();
    buf = new Buffer(png,'base64')
    var params = {Bucket: sails.config.security.s3.bucket, Key: hash+'.png', Body:buf,ContentEncoding: 'base64', ContentType: 'image/png'};
    s3.upload(params, function(err, data) {
      if(err){
        console.log(err);
      }
    });
    return {
      url: sails.config.security.s3Bucket + hash + '.png'
    }
  }
}
