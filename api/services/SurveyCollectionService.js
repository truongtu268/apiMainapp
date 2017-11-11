var Promise = require('bluebird'),
  bcrypt = require('bcrypt-nodejs'),
  randToken = require('rand-token'),
  _ = require('lodash'),
  moment = require('moment'),
  httpCode = require('http-codes');
module.exports = {
  randomCheckPresetSurvey: function (data) {
    return SurveyCollections.findOne({id: data.id})
      .populate(['surveys'])
      .then(function (surveyCollection) {
        if (surveyCollection) {
          var surveyIds = _.map(surveyCollection.surveys, function (survey) {
            if (survey.status === 'running') {
              Surveys.findOne({id: survey.id, isDelete: false})
                .populate(['receivers', 'surveyResponseList'])
                .then(function (survey) {
                  if (survey) {
                    var surveyListResponse = _.map(_.filter(survey.surveyResponseList, function (list) {
                      return list.statusSurveyList === "running";
                    }), function (surveyList) {
                      return surveyList.id;
                    });
                    if (surveyListResponse.length > 0) {
                      API.Model(SurveyResponseLists).update({id: surveyListResponse}, {statusSurveyList: 'stopped'})
                        .then(function (statusSurveyLists) {
                          _.forEach(statusSurveyLists, function (statusSurveyList) {
                            API.Model(SurveyResponseItems)
                              .update({surveyResponseList: statusSurveyList.id}, {statusSurveyItem: 'stopped'}).then(function () {
                            });
                          });
                        })
                    }
                    return survey;
                  }
                  return null;
                })
                .then(function (survey) {
                  if (survey) {
                    var oldSurveys = surveyCollection.oldSurvey;
                    oldSurveys.push(survey.id);
                    API.Model(Surveys).update({id: survey.id}, {status: "stopped", schedule: {}}).then(function () {
                    });
                    if (surveyCollection.surveys.length === oldSurveys.length) {
                      API.Model(SurveyCollections)
                        .update({id: surveyCollection.id}, {oldSurvey: []})
                        .then(function () {
                        })
                    } else {
                      API.Model(SurveyCollections)
                        .update({id: surveyCollection.id}, {oldSurvey: oldSurveys})
                        .then(function () {
                        })
                    }

                  }
                });
            }
            return survey.id;
          });
          var surveyNeedAsk;
          if(surveyIds.length === surveyCollection.oldSurvey.length){
            surveyNeedAsk = _.sample(surveyIds);
          } else {
            surveyNeedAsk = _.sample(_.xor(surveyIds, surveyCollection.oldSurvey));
          }
          return API.Model(Surveys).update({id: surveyNeedAsk}, {
            status: "running",
            schedule: surveyCollection.schedule
          })
            .then(function (survey) {
              return {
                data: survey
              }
            });
        }
      });
  }
};
