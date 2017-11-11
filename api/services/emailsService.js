/**
 * Created by truongtu on 5/16/2017.
 */
var Promise = require('bluebird'),
  promisify = Promise.promisify,
  mailer = require('nodemailer'),
  aws = require('aws-sdk'),
  emailGeneratedCode,
  transporter;
var id = sails.config.security.admin.email.accessKeyId;
var accesskey = sails.config.security.admin.email.secretAccessKey;
var region = sails.config.security.admin.email.region;
aws.config.update({
  accessKeyId: id,
  secretAccessKey: accesskey,
  region: region
});
transporter = mailer.createTransport({
  SES: new aws.SES({
    apiVersion: '2010-12-01'
  })
});

// transporter = mailer.createTransport(sails.config.security.zoho);

emailGeneratedCode = function (options) {
  var email = options.email,
    message = options.message,
    subject = options.subject;
  transporter.sendMail({
    from: sails.config.security.admin.email.auth.user,
    to: email,
    subject: subject,
    html: message
  }, function (err, info) {
    if(err){
      console.error(err);
      return;
    }
  });

  return {
    status: "done"
  }
};

module.exports = emailGeneratedCode;
