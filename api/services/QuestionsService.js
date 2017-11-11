/**
 * Created by MyPC on 7/17/2017.
 */
var Promise = require('bluebird'),
  bcrypt = require('bcrypt-nodejs'),
  randToken = require('rand-token'),
  _ = require('lodash'),
  httpCode = require('http-codes');

var domain = sails.config.security.server.domain;

// mapCompentencies = function (listOfCompentencies){
//   return _.map(listOfCompentencies, function (com) {
//     return {
//       id: com.id,
//       name: com.name
//     };
//   });
// };
// mapIssueDetail = function (feedbackItem, listCom) {
//
// }
module.exports = {
  createMeaningKey: function (data, context) {
    if (data && data.name && data.description) {
      return API.Model(MeaningKeys).create({
        name: data.name,
        description: data.description
      }).then(function (meaningKey) {
        return {
          status: httpCode.OK,
          data: meaningKey
        };
      })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data meaning key'
      }
    }
  },
  getAllMeaningKeys: function (data, context) {
    return API.Model(MeaningKeys).find({}).then(function (meaningkeys) {
      return {
        status: httpCode.OK,
        list: meaningkeys
      }
    });
  },
  updateMeaningKeys: function (data, context) {
    if (data && data.code && data.name && data.description) {
      return API.Model(MeaningKeys).update({
        code: data.code
      }, {
        name: data.name,
        description: data.description
      }).then(function (meaningKey) {
        if(meaningKey.length === 0){
          return {
            status: httpCode.NOT_FOUND,
            message: "Meaning key is not found"
          };
        }
        return {
          status: httpCode.OK,
          data: meaningKey[0]
        };
      })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data meaning key'
      }
    }
  },
  createTypeInput: function (data, context) {
    if (data && data.name && data.codename) {
      return API.Model(TypeInputs).create({
        name: data.name,
        codename: data.codename
      }).then(function (typeInput) {
        return {
          status: httpCode.OK,
          data: typeInput
        };
      })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data type inputs'
      }
    }
  },
  getAllTypeInput: function (data, context) {
    return API.Model(TypeInputs).find({}).then(function (typeInput) {
      return {
        status: httpCode.OK,
        list: typeInput
      }
    });
  },
  updateTypeInput: function (data, context) {
    if (data && data.code && data.name && data.codename) {
      return API.Model(TypeInputs).update({
        code: data.code
      }, {
        name: data.name,
        codename: data.codename
      }).then(function (typeInputs) {
        if(typeInputs.length === 0){
          return {
            status: httpCode.NOT_FOUND,
            message: "Type input is not found"
          };
        }
        return {
          status: httpCode.OK,
          data: typeInputs[0]
        };
      })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data type inputs'
      }
    }
  },
  createQuestion: function (data, context) {
    var clientId = context.identity.client_id;
    if (data && data.isRequireAnswer && data.type && data.meaningKey && data.text && data.content) {
      return API.Model(Teams).findOne({client_id: clientId}).then(function (teams) {
        data.team = teams.id;
        return API.Model(Questions).create(data).then(function (question) {
          return {
            status: httpCode.OK,
            data: question
          };
        })
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data question'
      }
    }
  },
  getAllQuestionByTeam: function (data, context) {
    var clientId = context.identity.client_id;
    return API.Model(Teams).findOne({client_id: clientId}).then(function (teams) {
      data.team = teams.id;
      return API.Model(Questions).find({or : [
        {team:teams.id}, {team:null}]}).then(function (questions) {
        return {
          status: httpCode.OK,
          list: questions
        };
      })
    });
  },
  updateQuestionByTeam: function (data, context) {
    var clientId = context.identity.client_id;
    if (data && data.code && data.isRequireAnswer && data.type && data.meaningKey && data.text && data.content) {
      return API.Model(Teams).findOne({client_id: clientId}).then(function (teams) {
        data.team = teams.id;
        return API.Model(Questions).update({code: data.code, team: teams.id },data).then(function (question) {
          if(question.length>0) {
            return {
              status: httpCode.OK,
              data: question[0]
            };
          }
          return {
            status: httpCode.NOT_FOUND,
            message:"Question is not found"
          }
        })
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data question'
      }
    }
  }
};
