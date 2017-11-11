var Promise = require('bluebird'),
  bcrypt = require('bcrypt-nodejs'),
  randToken = require('rand-token'),
  _ = require('lodash'),
  moment = require('moment'),
  httpCode = require('http-codes'); //https://www.npmjs.com/package/http-status-codes
var domain = sails.config.security.server.domain;

var superAdminPwd = process.env.SUPER_ADMIN_PASS;

module.exports = {
  submitSurveyContent: function (data, context) {
    if (!data.superadminpwd || data.superadminpwd !== superAdminPwd) {
      return {
        status: httpCode.UNAUTHORIZED,
        message: 'UNAUTHORIZED'
      }
    }
    if (!data.questions) {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing questions'
      }
    }
    if (!data.title) {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing title'
      }
    }
    if (!data.language) {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing language'
      }
    }
    if(!data.template || data.template === "") {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing templateCode'
      }
    }
    API.Model(FeedBackItemSamples).update({id: data.template}, {title: data.title});
    var promise = _.map(data.questions, function (question) {
      if(!question.code) {
        return SurveyService.addQuestion(question, data.language, data.template);
      }
      if (question.isEdited) {
        return SurveyService.updateQuestion(question, data.language);
      }
      if (question.isDelete) {
        return SurveyService.deleteQuestion(question, data.language);
      }
    });
    return Promise.all(promise);
  }
};
