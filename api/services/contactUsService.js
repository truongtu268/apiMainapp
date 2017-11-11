/**
 * Created by MyPC on 6/4/2017.
 */
var Promise = require('bluebird'),
  promisify = Promise.promisify,
  httpCode = require('http-codes');

module.exports = {
  postContactUs: function (data) {
    $ContactUs = API.Model(ContactUs);
    if(data && data.email && data.name && data.phoneNo){
      return $ContactUs.create(data, function (err, data) {
        if(err){
          return {
            status: httpCode.METHOD_FAILURE,
            message: err
          }
        } else {
          return data;
        }
      }).then( function (data) {
        templateForClientEmail = templateEmailsService(data, "emailForClient");
        return emailsService(templateForClientEmail);
      }).then(function () {
        templateForCEOEmail = templateEmailsService(data, "emailForCEO");
        emailsService(templateForCEOEmail);
        return {
          status: httpCode.OK,
          data: data
        }
      })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Missing data of contact"
      }
    }
  },
  getAllContact: function () {
    $ContactUs = API.Model(ContactUs);
    return $ContactUs.find({}).then(function (data) {
      return {
        status: httpCode.OK,
        list: data
      }
    });
  }
}
