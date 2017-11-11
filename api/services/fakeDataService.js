/**
 * Created by truongtu on 5/23/2017.
 */
var Promise = require('bluebird'),
  promisify = Promise.promisify,
  _ = require('lodash'),
  httpCode = require('http-codes');

module.exports = {
  register_team: function (data) {
    var $Users = API.Model(Users),
      $Teams = API.Model(Teams);
    var date = new Date();
    var teamTmp = data[0];
    $Teams.create({
      client_id: TokenAuths.generateTokenString(),
      client_sercret: TokenAuths.generateTokenString(),
      email: teamTmp.email,
      teamName: teamTmp.teamName,
      subDomain: teamTmp.subDomain,
      logo: teamTmp.logo,
      slackId: teamTmp.slackId,
      teamInfo: teamTmp.teamInfo,
      dateRegistered: date,
      dateVerified: date
    }).then(function (team) {
      for (var j = 0; j < teamTmp.members.length; j++) {
        var member = teamTmp.members[j];
        $Users.create({
          email: member.email,
          password: member.password,
          firstName: member.firstName,
          lastName: member.lastName,
          avatar: member.avatar,
          jobTitle: member.jobTitle,
          personalInfo: member.personalInfo,
          socialInfo: member.socialInfo,
          slackId: member.slackId,
          teamRole: member.teamRole,
          settings: member.settings,
          joinCompanyDate: member.joinCompanyDate,
          client_id: team.client_id,
          inviteDate: date,
          activeDate: date
        }).then(function (user) {
          return TokenAuths.generateToken({
            client_id: user.client_id,
            userId: user.id
          });
        }).then(function (token) {
          team.members.add(token.userId);
          team.save(function (err) {
          });
        });
      }
      // $Users.find({email:{'!': ['tadaa@perkfec.com']}}).then(function (users) {
      //   var ids = _.map(users, function (user) {
      //     return user.id;
      //   });
      //   (ids);
      //   team.members.add(ids);
      //
      // });
    });
  },
  create_chat_bot: function (data) {
    var $Users = API.Model(Users);
    var $Teams = API.Model(Teams);
    $Users.create(data).then(function (user) {
      $Teams.find({}).then(function (teams) {
        for (var i = 0; i < teams.length; i++) {
          teams[i].members.add(user.id);
          teams[i].save();
        }
      });
    })
  },
  create_compentencies: function (data) {
    var $Industries = API.Model(Industries),
      $Happiness = API.Model(Happiness),
      $Compentencies = API.Model(Compentencies),
      $Layers = API.Model(Layers);
    var layers = data.layers;
    var listOfHappiness = data.listOfHappiness;
    $Industries.create(_.omit(data, ['layers', 'listOfHappiness']))
      .then(function (industry) {
        $Happiness.create(listOfHappiness).then(function (happiness) {
          var ids = [0, 1, 2, 3, 4, 5, 6, 7, 8];
          industry.listOfHappiness.add(ids);
          industry.save(function (err) {
          })
        })
          .then(function () {
            _.forEach(layers, function (layer) {
              $Layers.create(_.omit(layer, ['listOfCompentencies']))
                .then(function (layerTmp) {
                  var listCompentencies = layer.listOfCompentencies;
                  _.forEach(listCompentencies, function (compentency) {
                    compentency.layer = layerTmp.id;
                    compentency.industry = industry.id;
                    if (compentency.parent) {
                      var children = _.map(compentency.parent, function (com) {
                        com.layer = layerTmp.id;
                        com.industry = industry.id;
                        return com;
                      });
                      $Compentencies.create(_.omit(compentency, ['parent', 'industry']))
                        .then(function (com) {
                          com.listOfIndustries.add(compentency.industry);
                          com.save();
                          return com;
                        })
                        .then(function (parentTmp) {
                          _.forEach(children, function (child) {
                            child.parent = parentTmp.id;
                            $Compentencies.create(_.omit(child, ['industry'])).then(function (com) {
                              com.listOfIndustries.add(child.industry);
                              com.save();
                            })
                          });
                        });
                    } else {
                      $Compentencies.create(_.omit(compentency, ['industry']))
                        .then(function (com) {
                          com.listOfIndustries.add(compentency.industry);
                          com.save();
                        });
                    }
                  });
                });
            });
          });
      });
  },
  create_feedback_sample: function (data) {
    var $FeedBackItemSamples = API.Model(FeedBackItemSamples);
    _.forEach(data, function (sample) {
      $FeedBackItemSamples.create(_.omit(sample, ['questions']))
        .then(function (feedbackItemSample) {
          var questions = _.map(sample.questions, function (question) {
            question.orderInSample = _.indexOf(sample.questions, question);
            question.feebackSamples = feedbackItemSample.id;
            return question;
          });
          _.forEach(questions, function (question) {
            API.Model(Questions).create(_.omit(question, ['contents', 'competency', 'answerList']))
              .then(function (questionRes) {
                var questionContents = _.map(question.contents, function (content) {
                  content.questionId = questionRes.id;
                  return content;
                });
                API.Model(QuestionContents).create(questionContents).then(function (contents) {
                });
                if (question.competency) {
                  API.Model(Compentencies).find({name: question.competency}).then(function (coms) {
                    var comIds = _.map(coms, function (com) {
                      return com.id;
                    })
                    questionRes.listOfCompentencies.add(comIds);
                    questionRes.save();
                  })
                }
                return questionRes;
              })
              .then(function (questionRes) {
                var answers = _.map(question.answerList, function (ans) {
                  ans.questionId = questionRes.id;
                  return ans;
                })
                _.forEach(answers, function (answer) {
                  API.Model(Answers).create(_.omit(answer, ['contents']))
                    .then(function (ans) {
                      var ansContent = _.map(answer.contents, function (content) {
                        content.answer = ans.id;
                        return content;
                      });
                      API.Model(AnswerContents).create(ansContent).then(function (content) {
                      });
                    });
                });
              });
          });
        })
    });
  },
  create_question: function (data) {
    var $Questions = API.Model(Questions),
      $Compentencies = API.Model(Compentencies);
    _.forEach(data, function (ques) {
      return $Questions.create(ques).then(function (question) {
        if (question.meaningKey === 3) {
          $Compentencies.find({}).then(function (compentencies) {
            var comIds = _.map(compentencies, function (com) {
              return com.id;
            });
            question.listOfCompentencies.add(comIds);
            question.save();
          })
        }
      });
    });
  },
  create_user_type: function (data) {
    var $TypeUsers = API.Model(TypeUsers);
    _.forEach(data, function (typeuser) {
      $TypeUsers.create(typeuser).then(function (type) {
      });
    })
  },
  create_survey: function (data) {
    var $Surveys = API.Model(Surveys),
      $FeedBackItemSamples = API.Model(FeedBackItemSamples);
    _.forEach(data, function (sample) {
      $FeedBackItemSamples.create(_.omit(sample, ['questions']))
        .then(function (feedbackItemSample) {
          var questions = _.map(sample.questions, function (question) {
            question.orderInSample = _.indexOf(sample.questions, question);
            question.feebackSamples = feedbackItemSample.id;
            return question;
          });
          _.forEach(questions, function (question) {
            API.Model(Questions).create(_.omit(question, ['contents', 'competency', 'answerList']))
              .then(function (questionRes) {
                var questionContents = _.map(question.contents, function (content) {
                  content.questionId = questionRes.id;
                  return content;
                });
                API.Model(QuestionContents).create(questionContents).then(function (contents) {
                });
                if (question.competency) {
                  API.Model(Compentencies).find({name: question.competency}).then(function (coms) {
                    var comIds = _.map(coms, function (com) {
                      return com.id;
                    })
                    questionRes.listOfCompentencies.add(comIds);
                    questionRes.save();
                  })
                }
                return questionRes;
              })
              .then(function (questionRes) {
                var answers = _.map(question.answerList, function (ans) {
                  ans.questionId = questionRes.id;
                  return ans;
                })
                _.forEach(answers, function (answer) {
                  API.Model(Answers).create(_.omit(answer, ['contents']))
                    .then(function (ans) {
                      var ansContent = _.map(answer.contents, function (content) {
                        content.answer = ans.id;
                        return content;
                      });
                      API.Model(AnswerContents).create(ansContent).then(function (content) {
                      });
                    });
                });
              });
          });
          return feedbackItemSample;
        })
        .then(function (sample) {
          $Surveys.create({
            surveyTitle: sample.title,
            template: sample.id,
            templateCode: sample.code,
            typeSurvey:"presetSurvey"
          }).then(function () {
          });
        })
    });
  },
  create_preset_survey: function () {
    var $SurveyCollections = API.Model(SurveyCollections),
      $Teams = API.Model(Teams),
      $Surveys = API.Model(Surveys);
    $Teams.find({}).then(function (teams) {
      _.forEach(teams, function (team) {
        $Surveys.find({}).then(function (surveys) {
          var surveyMaps = _.map(surveys, function (survey) {
            var surveyOmit = _.omit(survey,["id"]);
            surveyOmit.receiverTeam = team.id;
            return surveyOmit;
          });
          $Surveys.create(surveyMaps).then(function (surveys) {
            var surveyIds = _.map(surveys, function (survey) {
              return survey.id;
            });
            $SurveyCollections.create({team: team.id}).then(function (surveyCollection) {
              surveyCollection.surveys.add(surveyIds);
              surveyCollection.save();
            });
          });
        })
      })
    });
  }
};
