/**
 * Created by MyPC on 7/17/2017.
 */
var Promise = require('bluebird'),
  bcrypt = require('bcrypt-nodejs'),
  _ = require('lodash'),
  httpCode = require('http-codes');

module.exports = {
  createFeedbackSample: function (data, context) {
    var clientId = context.identity.client_id;
    if (data && data.questions && data.questionOrder && data.title) {
      return API.Model(Teams).findOne({client_id: clientId})
        .then(function (team) {
          data.team = team.id;
          return API.Model(FeedBackItemSamples).create(data).then(function (feedbackItemSample) {
            return {
              status: httpCode.OK,
              data: feedbackItemSample
            }
          });
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data feedback sample'
      }
    }
  },
  updateFeedbackSample: function (data, context) {
    var clientId = context.identity.client_id;
    if (data && data.code && data.questions && data.questionOrder && data.title) {
      return API.Model(Teams).findOne({client_id: clientId})
        .then(function (team) {
          data.team = team.id;
          return FeedBackItemSamples
            .findOne({code: data.code, team: team.id, isDelete: false})
            .then(function (feedbackItemSample) {
              if (!feedbackItemSample) {
                return {
                  status: httpCode.NOT_FOUND,
                  message: "Feedback sample is not found"
                };
              } else {
                return FeedBackItemSamples
                  .findOne({code: data.code})
                  .populate("questions")
                  .then(function (feedbackItemSample) {
                    var questionIds = _.map(feedbackItemSample.questions, function (question) {
                      return question.id;
                    });
                    feedbackItemSample.questions.remove(questionIds);
                    feedbackItemSample.save();
                    return API.Model(FeedBackItemSamples)
                      .update({code: data.code, team: team.id}, _.omit(data, ['code', 'questions']))
                      .then(function (feedback) {
                        feedback[0].questions.add(data.questions);
                        feedback[0].save();
                        return {
                          status: httpCode.OK,
                          data: feedback[0]
                        };
                      });
                  });
              }
            });
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data feedback sample'
      }
    }
  },
  deleteFeedbackSample: function (data, context) {
    var id = context.identity.client_id;
    if (data && data.code) {
      return API.Model(Teams).findOne({client_id: id}).then(function (teams) {
        return API.Model(FeedBackItemSamples).findOne({code: data.code, team: teams.id})
          .then(function (feedbackSample) {
            if (feedbackSample) {
              return API.Model(FeedBackItemSamples).delete({code: feedbackSample.code},{})
                .then(function (feedbackSample) {
                  return {
                    status: httpCode.OK,
                    data: feedbackSample[0]
                  };
                });
            }
            return {
              status: httpCode.NOT_FOUND,
              message: "feedback sample is not found"
            };
          })
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data feedback sample'
      }
    }
  },
  createFeedbackSampleByQuestion: function (data, context) {
    if (data && data.questions){
      _.forEach(data.questions, function (question) {
        API.Model(Questions).create()
      })
    }else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data question'
      }
    }
  },
  getAllFeedbackSample: function (data, context) {
    return API.Model(FeedBackItemSamples).find({team: null, isEditable: false, type: 'survey'}).then(function (feedbackSamples) {
      return {
        status: httpCode.OK,
        list: feedbackSamples
      }
    })
  },
  getAllFeedbackSampleSurveyTemplate: function (data, context) {
    return API.Model(FeedBackItemSamples).find({
      team: null,
      isEditable: false,
      isTemplate: true,
      type: 'survey'
    }).then(function (feedbackSamples) {
      return {
        status: httpCode.OK,
        list: feedbackSamples
      }
    })
  }
};
