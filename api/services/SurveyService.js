var Promise = require('bluebird'),
  bcrypt = require('bcrypt-nodejs'),
  randToken = require('rand-token'),
  _ = require('lodash'),
  moment = require('moment'),
  httpCode = require('http-codes');
var domain = sails.config.security.server.domain;

checkArrayElementWithRoof = function (array, ceil, floor) {
  var bool = _.every(array, function (element) {
    if (!_.isNumber(element) || element > ceil || element < floor) {
      return false;
    }
    return true;
  });
  return bool;
};
checkScheduleValid = function (schedule) {
  var format = 'HH:mm:ss';
  if (schedule.hasOwnProperty('timeStart') &&
    schedule.hasOwnProperty('dayOfWeek') &&
    schedule.hasOwnProperty('weekOfMonth') &&
    schedule.hasOwnProperty('monthOfQuarter') &&
    schedule.hasOwnProperty('isRepeat') &&
    _.isBoolean(schedule.isRepeat)) {
    if (moment(schedule.timeStart, format, true).isValid()) {
      if (schedule.isRepeat) {
        if (_.isArray(schedule.dayOfWeek) &&
          _.isArray(schedule.weekOfMonth) &&
          _.isArray(schedule.monthOfQuarter)) {
          var dateLength = schedule.dayOfWeek.length,
            weekLength = schedule.weekOfMonth.length,
            monthLenght = schedule.monthOfQuarter.length;
          if ((dateLength > 0 && dateLength <= 7) && weekLength == 0 && monthLenght == 0) {
            return checkArrayElementWithRoof(schedule.dateOfWeek, 6, 0);
          } else if (dateLength == 1 && (weekLength > 0 && weekLength <= 4) && monthLenght == 0) {
            return checkArrayElementWithRoof(schedule.dateOfWeek, 6, 0) &&
              checkArrayElementWithRoof(schedule.weekOfMonth, 3, 0);
          } else if (dateLength == 1 && weekLength == 1 && (monthLenght > 0 && monthLenght <= 3)) {
            return checkArrayElementWithRoof(schedule.dateOfWeek, 6, 0) &&
              checkArrayElementWithRoof(schedule.weekOfMonth, 3, 0) &&
              checkArrayElementWithRoof(schedule.monthOfQuarter, 2, 0);
          }
          return false;
        }
      } else {
        return true;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
};
deleteAnswer = function (answer, language) {
  return API.Model(Answers)
    .delete({code: answer.code}, {})
    .then(function (answer) {
      return API.Model(AnswerContents)
        .delete({
          answer: answer[0].id,
          language: language
        }, {}).then(function (ans) {
          return ans;
        });
    })
};
updateAnswer = function (answer, language) {
  return API.Model(Answers).update({
    id: answer.id }, _.omit(answer, ['code', 'id', 'content'])
  ).then(function (answerRes) {
    var _answer = answerRes[0];
    var $AnswerContents = API.Model(AnswerContents);
    return $AnswerContents.findOne({
      answer: _answer.id,
      language: language
    }).then(function (item) {
      if(item) {
        // if exist
        return $AnswerContents.update({id: item.id}, {
          answer: _answer.id,
          content: answer.content
        }).then(function (r) {
          return r;
        });
      } else {
        // add new
        return $AnswerContents.create({
          answer: _answer.id,
          content: answer.content,
          language: language,
          isDelete: false
        }).then(function (r) {
          return r;
        });
      }
    });
  })
};
addAnswer = function (answer, language, questionId) {
  answer.questionId = questionId;
  return API.Model(Answers)
    .create(_.omit(answer, ['content']))
    .then(function (answerRes) {
      return API.Model(AnswerContents)
        .create({content: answer.content, language: language, answer: answerRes.id})
        .then(function (answer) {
          return answer;
        });
    });
};
deleteQuestion = function (question, language) {
  return API.Model(Questions).delete({code: question.code}, {}).then(function (questionRes) {
    return API.Model(QuestionContents).delete({questionId: questionRes.id}, {}).then(function () {
      var promise = _.map(question.answerList, function (answer) {
        return deleteAnswer(answer, language);
      });
      return Promise.all(promise);
    });
  });
};
updateQuestion = function (questionReq, language) {
  return API.Model(Questions).update({code: questionReq.code}, {
    meaningKey: questionReq.meaningKey,
    type: questionReq.type,
    orderInSample: questionReq.orderInSample,
    isRequireAnswer: questionReq.isRequireAnswer
  }).then(function (questions) {
    if(!questions || !questions.length) {
      return null;
    }
    var question = questions[0];
    var questionId = question.id;
    var $QuestionContents = API.Model(QuestionContents);

    // update, if not exist add new languages
    $QuestionContents.findOne({
      questionId: questionId,
      language: language
    }).then(function (item) {
      // if exist
      if(item) {
        return $QuestionContents.update({id: item.id}, {
          content: questionReq.content
        }).then(function (r) {
          return r;
        });
      }
      // add new
      return $QuestionContents.create({
        questionId: questionId,
        language: language,
        isDelete: false,
        content: questionReq.content
      }).then(function (r) {
        return r;
      });
    });

    return API.Model(Answers).find({questionId: questionId}).then(function (answers) {
      var _answersPartition = _.partition(questionReq.answerList, function(answer) {
        return answer.code && answer.code.length;
      });
      var promise1, promise2, promise3;

      // add new answer
      var answersAddNew = _answersPartition[1]
      if (answersAddNew.length > 0) {
        promise1 = _.map(answersAddNew, function (answer) {
          return addAnswer(answer, language, questionId);
        })
      }
      // update answer
      var answersUpdate = _answersPartition[0]

      if (answersUpdate.length > 0) {
        promise2 = _.map(answersUpdate, function(answer){
          var _dbAnswer =  _.find(answers, { code: answer.code });
          if(_dbAnswer && _dbAnswer.id) {
            answer.id = _dbAnswer.id;
          }
          return updateAnswer(answer, language);
        });
      }

      // delete answer
      var answersDelete = _.differenceBy(answers, questionReq.answerList, 'code');

      if (answersDelete.length > 0) {
        var answersDeleteWithId = _.intersectionBy(answers, answersDelete, 'code');
        promise3 = _.map(answersDeleteWithId, function (answer) {
          return deleteAnswer(answer, language);
        })
      }

      var promises = (promise1 || []).concat(promise2 || [], promise3 || []);
      return Promise.all(promises);
    });
  });
};
addQuestion = function (question, language, templateId) {
  question.feebackSamples = templateId;
  return API.Model(Questions).create(_.omit(question, ['content', 'answerList']))
    .then(function (questionRes) {
      _.forEach(question.answerList, function (answer) {
        addAnswer(answer, language, questionRes.id);
      });
      return API.Model(QuestionContents).create({
        content: question.content,
        language: language,
        questionId: questionRes.id
      }).then(function (question) {
        return question;
      });
    });
};
createSurveyItem = function (receivers, survey, surveyList) {
  var startTime = new Date(),
    timeStopInSchedule = moment(survey.schedule.timeStop, 'HH:mm:ss').toDate();
  var users = _.filter(receivers, function (user) {
    return user.email !== "tadaa@perkfec.com"
  });
  _.forEach(users, function (receiver) {
    API.Model(SurveyResponseItems).create({
      surveyResponseList: surveyList.id,
      respondent: receiver.id,
      template: survey.template
    }).then(function (surveyItem) {
    });
  });
  return true;
};
sendEmailNotiSurvey = function (data) {
  SurveyResponseLists
    .findOne({id: data.surveyResponseList})
    .populate('survey')
    .then(function (surveyResList) {
      return surveyResList.survey.code;
    })
    .then(function (surveyCode) {
      API.Model(Users)
        .findOne({id: data.respondent})
        .then(function (user) {
          API.Model(Teams)
            .findOne({client_id: user.client_id})
            .then(function (team) {
              var url = "https://" + team.subDomain + "." + domain + "/survey/" + surveyCode + "/answer";
              templateEmail = templateEmailsService({
                url: url,
                email: user.email
              }, 'surveyNoti');
              emailsService(templateEmail);
            });
        });
    });
};
module.exports = {
  addQuestion: addQuestion,
  updateQuestion: updateQuestion,
  deleteQuestion: deleteQuestion,
  createSurvey: function (data, context) {
    if (data) {
      var user = context.identity;
      return API.Model(Teams).findOne({client_id: user.client_id})
        .then(function (team) {
          data.creator = user.id;
          data.receiverTeam = team.id;
          return API.Model(Surveys).create(_.omit(data, 'status'))
            .then(function (Survey) {
              return {
                status: httpCode.OK,
                data: Survey
              }
            });
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data meaning key'
      }
    }
  },
  getMyCreatedSurvey: function (data, context) {
    if (!context || !context.identity) {
      return {
        status: httpCode.UNAUTHORIZED,
        message: "You don't have permission"
      };
    }
    var user = context.identity;
    return Surveys.find({creator: user.id, isDelete: false, status: {'!': ['deleted']}})
      .then(function (surveys) {
        return {
          status: httpCode.OK,
          list: surveys
        }
      });
  },
  getPresetSurvey: function (data, context) {
    if (!context || !context.identity) {
      return {
        status: httpCode.UNAUTHORIZED,
        message: "You don't have permission"
      };
    }
    var user = context.identity;
    return Surveys.find({typeSurvey:"presetSurvey", isDelete: false, status: "running"})
      .then(function (surveys) {
        return {
          status: httpCode.OK,
          list: surveys
        }
      });
  },
  getAllSurveyNeedToAsk: function (data, context) {
    var user = context.identity;
    return API.Model(SurveyResponseItems)
      .find({
        respondent: user.id,
        statusSurveyItem: 'running'
      })
      .then(function (surveyResItems) {
        var surveyItems = _.map(surveyResItems, function (surveyResItem) {
          return API.Model(SurveyResponseLists)
            .findOne({id: surveyResItem.surveyResponseList})
            .then(function (surveyResList) {
              return Surveys.findOne({id: surveyResList.survey})
                .then(function (surveys) {
                  return surveys;
                });
            });
        });
        return Promise.all(surveyItems).then(function (surveys) {
          return {
            status: httpCode.OK,
            list: surveys
          }
        });
      });
  },
  getSurveyById: function (data, context) {
    if (data.code) {
      var user = context.identity;
      return API.Model(Surveys).findOne({code: data.code, creator: user.id})
        .then(function (survey) {
          return {
            status: httpCode.OK,
            data: survey
          }
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data meaning key'
      }
    }
  },
  getSurveyByTemplateCode: function (data, context) {
    var templateCode = data.templateCode;
    if (templateCode) {
      // get survey
      return Surveys.findOne({templateCode: templateCode})
        .then(function (survey) {
          if (!survey) {
            return {
              status: httpCode.NOT_FOUND,
              message: 'Survey not found'
            }
          }
          // get survey questions
          return Questions.find({feebackSamples: survey.template, isDelete: false})
            .populate(['content', 'answerList'])
            .then(function (questions) {
              var sampleModel = {
                title: survey.title,
              };
              return FeedbackService.getListQuestionMultilanguage(questions, data.language, context.identity.client_id, sampleModel).then(function (_questions) {
                if (_questions && _questions.list) {
                  survey.questions = _questions.list;
                } else {
                  survey.questions = [];
                }
                return {
                  status: httpCode.OK,
                  data: survey
                }
              });
            })
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data meaning key'
      }
    }
  },
  submitSurveySetting: function (data, context) {
    if (data && data.templateCode && data.schedule && data.receivers && data.typeOfSchedule) {
      var user = context.identity;
      if (data.typeOfSchedule === 'monthly') {
        data.schedule.weekOfMonth = [0];
      }
      return Surveys.findOne({templateCode: data.templateCode, creator: user.id, isDelete: false})
        .populate(['receivers'])
        .then(function (survey) {
          if (survey) {
            // if (survey.status === "running") {
            //   return {
            //     status: httpCode.FORBIDDEN,
            //     message: "This Survey is running so you should stop survey before edit survey"
            //   }
            // } else {
            return Surveys.update({id: survey.id}, _.omit(data, ['id', 'status', 'receivers']))
              .then(function (survey) {
                var receiversId = _.map(survey[0].receivers, function (receiver) {
                  return receiver.id;
                });
                if (receiversId.length > 0) {
                  survey[0].receivers.remove(receiversId);
                  if (data.receivers.length > 0) {
                    survey[0].receivers.add(data.receivers);
                  }
                  survey[0].save();
                } else if (data.receivers.length === 0 && data.receivers.length > 0) {
                  survey[0].receivers.add(data.receivers);
                  survey[0].save();
                }
                return Surveys.findOne({id: survey[0].id}).populate('template').then(function (survey) {
                  survey.template = survey.template.code;
                  return {
                    status: httpCode.OK,
                    data: survey
                  }
                });
              });
            // }
          }
          else {
            return {
              status: httpCode.NOT_FOUND,
              message: 'Survey is not found'
            }
          }
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data meaning key'
      }
    }
  },
  publishSurvey: function (data, context) {
    if (data && data.templateCode) {
      var user = context.identity;
      return API.Model(Surveys).findOne({
        templateCode: data.templateCode,
        creator: user.id
      }).then(function (survey) {
        if (survey.template && survey.schedule) {
          if (checkScheduleValid(survey.schedule)) {
            return API.Model(Surveys).update({id: survey.id}, {status: 'running'}).then(function (survey) {
              survey[0].template = data.template;
              return {
                status: httpCode.OK,
                data: survey[0]
              }
            });
          } else {
            return {
              status: httpCode.FAILED_DEPENDENCY,
              message: "Can't run this survey because it not validate schedule in Survey model"
            };
          }
        } else {
          return {
            status: httpCode.FAILED_DEPENDENCY,
            message: "Can't run this survey because it not validate schedule"
          };
        }
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data code'
      }
    }
  },
  deleteSurvey: function (data, context) {
    if (!context || !context.identity) {
      return {
        status: httpCode.UNAUTHORIZED,
        message: "Unauthorized"
      }
    }
    if (data && data.code) {
      var user = context.identity;
      return API.Model(Surveys).findOne({code: data.code})
        .then(function (survey) {
          if (survey.creator === user.id) {
            if (survey.status === 'deleted') {
              return API.Model(Surveys).delete({code: data.code}, {})
                .then(function (surveys) {
                  return {
                    status: httpCode.OK,
                    data: surveys[0]
                  }
                });
            }
            return {
              status: httpCode.FORBIDDEN,
              message: "You must change survey status to deleted"
            }
          } else {
            return {
              status: httpCode.FORBIDDEN,
              message: "You don't have permission to delete this survey"
            }
          }
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data'
      }
    }
  },
  stopSurvey: function (data, context) {
    if (data && data.templateCode) {
      var user = context.identity;
      return API.Model(Surveys).findOne({
        templateCode: data.templateCode
      }).then(function (survey) {
        if (survey && survey.status === 'running' && (survey.creator === user.id || user.teamRole === 2 || user.teamRole === 3)) {
          return API.Model(Surveys).update({templateCode: data.templateCode}, {status: 'stopped'})
            .then(function (surveys) {
              return {
                status: httpCode.OK,
                data: surveys[0]
              }
            });
        } else {
          return {
            status: httpCode.FORBIDDEN,
            message: "You don't have permission to stop this survey or this survey isn't running"
          }
        }
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data code'
      }
    }
  },
  setSurveyInTrash: function (data, context) {
    if (data && data.templateCode) {
      var user = context.identity;
      return API.Model(Surveys).findOne({
        templateCode: data.templateCode,
        creator: user.id
      }).then(function (survey) {
        if (survey) {
          return API.Model(Surveys).update({templateCode: data.templateCode}, {status: 'deleted'})
            .then(function (surveys) {
              return {
                status: httpCode.OK,
                data: surveys[0]
              }
            });
        } else {
          return {
            status: httpCode.FORBIDDEN,
            message: "You don't have permission to delete this survey"
          }
        }
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data code'
      }
    }
  },
  submitSurveyContent: function (data, context) {
    if (!data) {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data'
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
    var $FeedBackItemSamples = API.Model(FeedBackItemSamples);
    var user = context.identity;

    // create new if template code null
    if (!data.templateCode || data.templateCode === "") {
      return API.Model(Teams).findOne({client_id: user.client_id})
        .then(function (team) {
          if(!team) {
            return {
              status: httpCode.NOT_FOUND,
              message: 'Team not found'
            }
          }
          data.creator = user.id;
          data.receiverTeam = team.id;
          data.surveyTitle = data.title;
          return API.Model(Surveys).create(_.omit(data, ['status', 'questions', 'language', 'id']))
            .then(function (Survey) {
              try {
                return API.Model(FeedBackItemSamples).create({title: data.title, cover: data.cover, type: "survey"})
                  .then(function (sample) {
                    var questionMap = _.map(data.questions, function (question) {
                      question.feebackSamples = sample.id;
                      return question
                    });
                    _.forEach(questionMap, function (question) {
                      var questionReq = _.omit(question, ['content', 'answerList']);
                      API.Model(Questions).create(questionReq)
                        .then(function (questionR) {
                          API.Model(QuestionContents).create({
                            content: question.content,
                            language: data.language,
                            questionId: questionR.id
                          }).then(function (content) {
                          });
                          _.forEach(question.answerList, function (answer) {
                            answer.questionId = questionR.id;
                            API.Model(Answers).create(_.omit(answer, ['content']))
                              .then(function (answerCreate) {
                                API.Model(AnswerContents).create({
                                  content: answer.content,
                                  answer: answerCreate.id,
                                  language: data.language
                                }).then(function (answerContent) {
                                });
                              });
                          });
                        })
                    });
                    return Surveys.update({id: Survey.id}, {template: sample.id, templateCode: sample.code})
                      .then(function (survey) {
                        return Surveys.findOne({id: survey[0].id})
                          .then(function (survey) {
                            return Questions.find({feebackSamples: sample.id, isDelete: false})
                              .populate(['content', 'answerList'])
                              .then(function (questions) {
                                var sampleModel = {
                                  title: sample.title
                                };
                                return FeedbackService.getListQuestionMultilanguage(questions, data.language, context.identity.client_id, sampleModel).then(function (_questions) {
                                  if (_questions && _questions.list) {
                                    survey.questions = _questions.list;
                                  } else {
                                    survey.questions = [];
                                  }
                                  return {
                                    status: httpCode.OK,
                                    data: survey
                                  }
                                });
                              });
                          });
                      });
                  });
              } catch (err) {
                return {
                  status: httpCode.FAILED_DEPENDENCY,
                  message: "Something wrong in here"
                }
              }
            });
        });
    }

    return Surveys.findOne({templateCode: data.templateCode, creator: user.id})
      .then(function (survey) {
        if(!survey) {
          return {
            status: httpCode.NOT_FOUND,
            message: 'Survey not found'
          }
        }
        API.Model(FeedBackItemSamples).update({id: survey.template}, {title: data.title});
        return API.Model(Surveys).update({code: data.code}, {surveyTitle: data.title}).then(function () {
          var promise = _.map(data.questions, function (question) {
            if (question.code) {
              if (question.isEdited) {
                return updateQuestion(question, data.language);
              } else if (question.isDelete) {
                return deleteQuestion(question, data.language);
              }
            } else {
              return addQuestion(question, data.language, survey.template);
            }
          });
          return Promise.all(promise).then(function () {
            return survey;
          })
        });
      })
      .then(function (survey) {
        var res_data = survey;
        return Questions.find({feebackSamples: res_data.template, isDelete: false})
          .populate(['content', 'answerList'])
          .then(function (questions) {
            var sampleModel = {
              title: data.title
            };
            return FeedbackService.getListQuestionMultilanguage(questions, data.language, context.identity.client_id, sampleModel)
              .then(function (_questions) {
                if (_questions && _questions.list) {
                  res_data.questions = _questions.list;
                } else {
                  res_data.questions = [];
                }
                return {
                  status: httpCode.OK,
                  data: res_data
                }
              });
          });
      });
  },
  createListSurveyResponsePerTime: function (data, context) {
    if (data && data.surveyCode) {
      return Surveys.findOne({code: data.surveyCode, isDelete: false})
        .populate(['receivers', 'surveyResponseList'])
        .then(function (survey) {
          if (survey) {
            var surveyListResponse = _.map(_.filter(survey.surveyResponseList, function (list) {
              return list.statusSurveyList === "running";
            }), function (surveyList) {
              return surveyList.id;
            });
            if(!survey.schedule.isRepeat){
              if(surveyListResponse.length === 0) {
                return API.Model(SurveyResponseLists)
                  .create({survey: survey.id})
                  .then(function (surveyList) {
                    if (survey.receivers.length > 0) {
                      createSurveyItem(survey.receivers, survey, surveyList);
                      return {
                        status: httpCode.OK,
                        message: "Create list survey items success"
                      }
                    } else {
                      return Teams.findOne({id: survey.receiverTeam, isDelete: false})
                        .populate('members')
                        .then(function (team) {
                          if (team) {
                            console.log(team);
                            createSurveyItem(team.members, survey, surveyList);
                            return {
                              status: httpCode.OK,
                              message: "Create list survey items success"
                            }
                          } else {
                            return {
                              status: httpCode.NOT_FOUND,
                              message: "Team is not found"
                            }
                          }
                        });
                    }
                  })
              } else {
                return {
                  status: httpCode.NOT_FOUND,
                  message: "Survey run just one time"
                }
              }
            } else {
              if(surveyListResponse.length > 0) {
                API.Model(SurveyResponseLists).update({id: surveyListResponse}, {statusSurveyList: 'stopped'})
                  .then(function (statusSurveyLists) {
                    _.forEach(statusSurveyLists, function (statusSurveyList) {
                      API.Model(SurveyResponseItems)
                        .update({surveyResponseList: statusSurveyList.id}, {statusSurveyItem: 'stopped'}).then(function () {
                      });
                    });
                  })
              }
              return API.Model(SurveyResponseLists)
                .create({survey: survey.id})
                .then(function (surveyList) {
                  if (survey.receivers.length > 0) {
                    createSurveyItem(survey.receivers, survey, surveyList);
                    return {
                      status: httpCode.OK,
                      message: "Create list survey items success"
                    }
                  } else {
                    return Teams.findOne({id: survey.receiverTeam, isDelete: false})
                      .populate('members')
                      .then(function (team) {
                        if (team) {
                          console.log(team);
                          createSurveyItem(team.members, survey, surveyList);
                          return {
                            status: httpCode.OK,
                            message: "Create list survey items success"
                          }
                        } else {
                          return {
                            status: httpCode.NOT_FOUND,
                            message: "Team is not found"
                          }
                        }
                      });
                  }
                })
            }

          } else {
            return {
              status: httpCode.NOT_FOUND,
              message: "Survey is not exist or deleted"
            }
          }
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data survey code'
      }
    }
  },
  getSurveyQuestionPerUser: function (data, context) {
    if (data && data.templateCode && data.language) {
      var user = context.identity;
      return API.Model(FeedBackItemSamples).findOne({code: data.templateCode}).then(function (sample) {
        var sampleTemplate = {
          title: sample.title
        };
        return Surveys.findOne({template: sample.id, isDelete: false})
          .populate('surveyResponseList')
          .then(function (survey) {
            var surveyListArray = _.filter(survey.surveyResponseList, function (surveyList) {
              return surveyList.statusSurveyList === "running";
            });
            if (surveyListArray.length > 0) {
              var surveyList = surveyListArray[0];
              return SurveyResponseItems
                .findOne({surveyResponseList: surveyList.id, respondent: user.id})
                .populate(['surveyResponseAnswer'])
                .then(function (surveyItem) {
                  if (surveyItem) {
                    return Questions.find({feebackSamples: surveyItem.template, isDelete: false})
                      .populate(['content', 'answerList'])
                      .then(function (questions) {
                        if (surveyItem.surveyResponseAnswer.length > 0) {
                          var questionIds = _.map(surveyItem.surveyResponseAnswer, function (answer) {
                            return answer.question;
                          });
                          var questionFilter = _.filter(questions, function (question) {
                            return _.indexOf(questionIds, question.id) === -1;
                          });
                          return FeedbackService.getListQuestionMultilanguage(questionFilter, data.language, user.client_id, sampleTemplate);
                        } else {
                          return FeedbackService.getListQuestionMultilanguage(questions, data.language, user.client_id, sampleTemplate);
                        }
                      });
                  } else {
                    return {
                      status: httpCode.NOT_FOUND,
                      message: "Survey is not found or you don't have permission for this survey"
                    };
                  }
                });
            } else {
              return {
                status: httpCode.NOT_FOUND,
                message: "Survey list is not found or you don't have permission for this survey"
              };
            }
          });
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data survey code'
      }
    }
  },
  createSurveyResponsePerQuestion: function (data, context) {
    if (data && data.templateCode && data.answers) {
      var user = context.identity;

      return API.Model(Surveys).findOne({templateCode: data.templateCode}).then(function (survey) {
        return API.Model(SurveyResponseLists).findOne({survey: survey.id})
          .then(function (surveyList) {
            return SurveyResponseItems
              .findOne({surveyResponseList: surveyList.id, respondent: user.id})
              .then(function (surveyItem) {
                _.forEach(data.answers, function (answer) {
                  API.Model(Questions).findOne({code: answer.questionCode})
                    .then(function (question) {
                      API.Model(SurveyResponseAnswers)
                        .create({
                          question: question.id,
                          answer: answer.answerList,
                          surveyResponseItem: surveyItem.id
                        })
                        .then(function (ans) {
                        });
                    });
                });
                return surveyItem;
              })
              .then(function (surveyItem) {
                return API.Model(SurveyResponseAnswers).find({surveyResponseItem: surveyItem.id})
                  .then(function (answers) {
                    return FeedBackItemSamples
                      .findOne({id: surveyItem.template})
                      .populate('questions')
                      .then(function (sample) {
                        if (sample.questions.length === answers.length) {
                          return API.Model(SurveyResponseItems)
                            .update({id: surveyItem.id}, {statusSurveyItem: 'completed'})
                            .then(function (surveyResItem) {
                              return {
                                status: httpCode.OK,
                                message: 'Thank you answer all question'
                              };
                            })
                        } else {
                          return {
                            status: httpCode.OK,
                            message: 'Create response for survey success'
                          };
                        }
                      })
                  });
              });
          });
      })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data survey code'
      }
    }
  },
  listAllUserWithAllSurveyNeedRun: function (data, context) {
    return Users.find({email: {'!': 'tadaa@perkfec.com'}})
      .populate('runningSurveys')
      .then(function (users) {
        var userRes = _.map(users, function (user) {
          user.runningSurveys = _.filter(user.runningSurveys, function (runningSurvey) {
            return runningSurvey.statusSurveyItem === 'running';
          });
          return user;
        });
        return userRes;
      })
  },
  analysisPresetSurvey: function (data, context) {
    var user = context.identity;
    return API.Model(Teams).findOne({ client_id: user.client_id })
      .then(function (team) {
        return Surveys.find({isDelete: false, typeSurvey: "presetSurvey", receiverTeam: team.id})
          .populate(["surveyResponseList"])
          .then(function (surveys) {
            return _.map(surveys,function (survey) {
              return {
                title: survey.surveyTitle,
                surveyResponseList: survey.surveyResponseList
              }
            })
          })
      })
      .then(function (surveys) {
        var surveyResponses = _.map(surveys, function (survey) {
          var surveyMap = {
            title: survey.title
          };
          var surveyList = _.map(survey.surveyResponseList, function (responseList) {
            return SurveyResponseItems
              .find({surveyResponseList: responseList.id})
              .populate(["surveyResponseAnswer"])
              .then(function (surveyResItems) {
                var surveyResItemMaps = _.map(surveyResItems, function (surveyResItem) {
                  var ansPromise = _.map(surveyResItem.surveyResponseAnswer, function (answer) {
                    return API.Model(Questions)
                      .findOne({id: answer.question})
                      .then(function (question) {
                        switch (question.type){
                          case 1: return Promise.resolve(answer.answer.content[0]);
                          case 4,5: return Answers.findOne({id: answer.answer.content[0]}).then(function (ans) {
                            return ans.weight
                          });
                          case 6: return Promise.resolve(answer.answer.content[0]);
                        }
                      });
                  });
                  return Promise.all(ansPromise).then(function (obj) {
                    var anonymous = AnonymousUserService.randoomUser();
                    return anonymous.then(function (anonymous) {
                      return {
                        userId: surveyResItem.respondent,
                        name: anonymous.name,
                        avatar: anonymous.avatar,
                        isAnonymous: true,
                        point:_.sum(obj)
                      };
                    })
                  });
                });
                return Promise.all(surveyResItemMaps).then(function (obj) {
                  return obj;
                });
              })
              .then(function (listItem) {
                return {
                  listItem: listItem,
                  time: responseList.createdAt
                }
              });
          });
          return Promise.all(surveyList).then(function (surveyList) {
            surveyMap.surveyList = surveyList;
            return surveyMap;
          });
        });
        return Promise.all(surveyResponses).then(function (surveyRes) {
          return {
            status: httpCode.OK,
            list: surveyRes
          };
        });
      });
  },
  analysisNormalSurvey: function (data, context) {
    var user = context.identity;
    if(data && data.surveyCode && data.language) {
      return Surveys.findOne({ code: data.surveyCode , creator: user.id,isDelete: false})
        .populate(["surveyResponseList"])
        .then(function (survey) {
          if(survey) {
            var surveyRes = {title: survey.surveyTitle};
            var surveyListMap = _.map(survey.surveyResponseList, function (surveyList) {
              return SurveyResponseItems
                .find({surveyResponseList: surveyList.id})
                .populate(["surveyResponseAnswer"])
                .then(function (surveyResItems) {
                  var surveyResItemMaps = _.map(surveyResItems, function (surveyResItem) {
                    var ansPromise = _.map(surveyResItem.surveyResponseAnswer, function (answer) {
                      return Questions.findOne({id: answer.question})
                        .populate(["content","answerList"])
                        .then(function (question) {
                          var content = _.filter(question.content, function (cont) {
                            return cont.language === data.language;
                          });
                          var answerListMap = _.map(question.answerList, function (answer) {
                            return Answers.findOne({id: answer.id})
                              .populate(["content"])
                              .then(function (ans) {
                                var ansContent = _.filter(ans.content, function (cont) {
                                  return cont.language === data.language;
                                })[0].content;
                                return ansContent
                              });
                          });
                          return Promise.all(answerListMap).then(function (ansList) {
                            switch (question.type){
                              case 1: return Promise.resolve({
                                question: {
                                  answerList:[],
                                  type: question.type,
                                  content:content[0].content
                                },
                                answer:answer.answer.content[0]
                              });
                              case 4,5: return Answers
                                .findOne({code: answer.answer.content[0]})
                                .populate(["content"])
                                .then(function (ans) {
                                  return {
                                    question: {
                                      answerList:ansList,
                                      content:content[0].content,
                                      type: question.type
                                    },
                                    answer:_.filter(ans.content, function (cont) {
                                      return cont.language === data.language;
                                    })[0].content
                                  };
                                });
                              case 6: return Promise.resolve({
                                question: {
                                  answerList:[],
                                  content:content[0].content,
                                  type: question.type
                                },
                                answer:answer.answer.content[0]
                              });
                            }
                          })
                        });
                    });
                    return Promise.all(ansPromise).then(function (obj) {
                      var anonymous = AnonymousUserService.randoomUser();
                      return anonymous.then(function (anonymous) {
                        return {
                          userId: surveyResItem.respondent,
                          name: anonymous.name,
                          avatar: anonymous.avatar,
                          isAnonymous: true,
                          questionList:obj
                        };
                      })

                    });
                  });
                  return Promise.all(surveyResItemMaps).then(function (obj) {
                    return obj;
                  });
                })
                .then(function (listItem) {
                  return {
                    listItem: listItem,
                    time: surveyList.createdAt
                  }
                });
            })
            return Promise.all(surveyListMap).then(function (surveyList) {
              surveyRes.surveyList = surveyList;
              return {
                status: httpCode.OK,
                data:surveyRes
              };
            });
          } else {
            return {
              status: httpCode.NOT_FOUND,
              message: "Survey is not found or you don't have permission for this survey"
            }
          }
        })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Missing data or survey code or language"
      };
    }
  }
};
