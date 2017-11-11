/**
 * Created by truongtu on 5/3/2017.
 */
var Promise = require('bluebird'),
  bcrypt = require('bcrypt-nodejs'),
  randToken = require('rand-token'),
  _ = require('lodash'),
  httpCode = require('http-codes');

var domain = sails.config.security.server.domain;

feedbackEmailInvite = function (data, template) {
  var $TokenAuths = API.Model(TokenAuths);
  var $Teams = API.Model(Teams);
  var $Users = API.Model(Users);
  var user = data;
  $TokenAuths.destroy({user_id: user.id}).then(function () {
    return TokenAuths.generateToken({
      userId: user.id,
      client_id: user.client_id
    }).then(function (token) {
      return $Teams.findOne({client_id: user.client_id}).then(function (team) {
        var passHash = bcrypt.hashSync(user.email, bcrypt.genSaltSync(10)).substring(0, 10);
        return $Users.update({id: user.id}, {password: passHash}).then(function () {
          var templateEmail = templateEmailsService({
            feedbackReceiverURL: "//" + team.subDomain + "." + domain + "/login/?email=" + user.email + "&accessToken=" + token.accessToken,
            email: user.email,
            password: passHash
          }, template);
          return emailsService(templateEmail);
        });
      })
    })
  })
};
getActivitiesUser = function (listCode) {
  var codes = _.map(listCode, function (act) {
    return act.code;
  });
  return Activities.find({code: codes}).populate('user').then(function (activities) {
    var activities = _.map(activities, function (activity) {
      return {
        code: activity.code,
        description: activity.data.text,
        avatar: activity.user.avatar,
        firstName: activity.user.firstName,
        lastName: activity.user.lastName,
        createdAt: activity.createdAt
      }
    });
    return activities;
  });
};
getListQuestionMultilanguageInternal = function (questions, language, client_id, sampleModel) {
  var contentQuestions = _.map(questions, function (question) {

    var promises = _.map(question.answerList, function (answer) {
      return Answers.findOne({id: answer.id, isDelete: false})
        .populate('content')
        .then(function (answer) {
          return answer
        })
    });

    return Promise.all(promises).then(function (answers) {

      var answersRes = _.map(_.filter(answers,function (answer) {
        if(answer) {
          return answer
        }
      }), function (answer) {
        if(answer){
          var contentFilter = _.filter(answer.content, {language: language});
          var content = "This answer doesn't support this language";
          if (contentFilter.length > 0) {
            content = contentFilter[0].content;
          }
          return {
            code: answer.code,
            icon: answer.icon,
            weight: answer.weight,
            orderInQuestion: answer.orderInQuestion,
            content: content,
            isDelete: false,
            isEdited: false
          };
        }
      });
      return answersRes;

    }).then(function (answers) {
      var contentFilter = _.filter(question.content, {language: language});
      var content = "This question doesn't support this language";
      if (contentFilter.length > 0) {
        content = contentFilter[0].content
      }
      return {
        code: question.code,
        meaningKey: question.meaningKey,
        type: question.type,
        orderInSample: question.orderInSample,
        isRequireAnswer: question.isRequireAnswer,
        content: content,
        answerList: _.sortBy(answers, ['orderInQuestion']),
        isDelete: false,
        isEdited: false
      };
    });

  });

  return Promise.all(contentQuestions).then(function (_questions) {

    var teamQueryPromise = Teams.findOne({client_id: client_id}).populate('members');
    var competencyPromise = Compentencies.find({ select: ['code','name','id'], where: {isDelete: false}});
    var questionPromise = _.map(_questions, function (question) {
      if (question.meaningKey === 2) {
        return teamQueryPromise;
      } else if (question.meaningKey === 3) {
        return competencyPromise;
      } else {
        return Promise.resolve()
      }
    })

    return Promise.all(questionPromise).then(function (results) {
      var questionsRes = _.map(_questions, function (question, index) {
        // if mention question
        if (question.meaningKey === 2) {
          var members = _.map(_.filter(results[index].members, function (member) {
            return member.email != 'tadaa@perkfec.com';
          }), function (member) {
            var fullName = '';
            if(member.firstName) {
              fullName = member.lastName + " " + member.firstName;
            } else {
              fullName = member.email;
            }
            return {
              code: member.code,
              avatar: member.avatar,
              fullName: fullName,
            }
          });
          question.answerList = members;
          return question;
        }
        // if competency
        if (question.meaningKey === 3) {
          question.answerList = results[index];
          return question;
        }
        return question;
      });

      if(questionsRes.length > 0) {
        return {
          status: httpCode.OK,
          title: sampleModel.title,
          list: _.sortBy(questionsRes, ['orderInSample'])
        };
      }

      var contentMessage = language === "vi" ? "Bạn đã hoàn thành bài khảo sát này rồi" : "You finished this survey";

      return {
        status: httpCode.OK,
        list: [{
          code: "survey_finished",
          content: contentMessage,
          type: 1,
          meaningKey: 1
        }]
      }

    })
  });
}
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
  //Other method
  verifyUrl: function (data) {
    var $FeedBackUrl = API.Model(FeedbackAnonymousUrls);
    if (data.code) {
      return $FeedBackUrl.findOne({code: data.code}).then(function (feedbacklink) {
        if (feedbacklink && (feedbacklink.expireTime && new Date() < feedbacklink.expireTime)) {
          return {
            status: httpCode.OK,
            data: feedbacklink
          };
        } else {
          return {
            status: httpCode.NOT_FOUND,
            message: "This feedback link doesn't exist or expired"
          }
        }
      });
    }
    return {
      status: httpCode.BAD_REQUEST,
      message: "Request is missing url verification"
    }
  },
  deletePublicIssue: function (data, context) {
    if (data && data.feedbackCode) {
      var user_id = context.identity.id;
      return FeedBackItemResponses.findOne({code: data.feedbackCode, isDelete: false})
        .then(function (feedbackItem) {
          if (feedbackItem && feedbackItem.giver === user_id) {
            return API.Model(FeedBackItemResponses).delete({id: feedbackItem.id}, {})
              .then(function (feedback) {
                return {
                  status: httpCode.OK,
                  data: feedback[0]
                }
              })
          }
          return {
            status: httpCode.NOT_FOUND,
            message: 'Feedback item is not found or not permission to update that feedback'
          };
        })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Request is missing data or data feedback"
      }
    }
  },
  sendUrlFeedbackListToEmail: function (data) {
    if (data.email && data.url) {
      var url = data.url;
      var template = templateEmailsService({email: data.email, url: url}, 'notificationFeedbackLink');
      emailsService(template);
      return data;
    }
    return {
      status: httpCode.BAD_REQUEST,
      message: "Request is missing email or url"
    };
  },
  //Update method
  ratingFeedback: function (data) {
    if (data.code && data.rating) {
      return FeedBackListResponses.findOne({
        code: data.code,
        isDelete: false
      }).populate('feedback').then(function (feedbackList) {
        if (feedbackList) {
          var feedbackItem = feedbackList.feedback;
          return API.Model(Activities).create({
            type_activity: 'rating',
            data: {
              number: data.rating
            },
            activity_object_type: 'feedback_item',
            activity_object_id: feedbackItem.id
          })
            .then(function (activity) {
              return API.Model(FeedBackItemResponses)
                .update({id: feedbackItem.id}, {rate: data.rating})
                .then(function (feedback) {
                  return {
                    status: httpCode.OK,
                    data: feedback
                  };
                })
            });
        } else {
          return {
            status: httpCode.NOT_FOUND,
            message: "FeedbackList is not found"
          };
        }
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Code or rating is missing"
      }
    }
  },
  ratingIssueAnonymous: function (data, context) {
    if (data.code && data.rating) {
      return API.Model(FeedBackItemResponses).findOne({
        code: data.code
      }).then(function (feedbackItem) {
        if (feedbackItem) {
          return API.Model(Activities).create({
            type_activity: 'rating',
            user: context.identity.id,
            data: {
              number: data.rating
            },
            activity_object_type: 'feedback_item',
            activity_object_id: feedbackItem.id
          })
            .then(function (activity) {
              var listActivities = feedbackItem.listOfActivities;
              listActivities.push(activity.id);
              return API.Model(FeedBackItemResponses)
                .update({id: feedbackItem.id}, {
                  rate: data.rating,
                  listOfActivities: listActivities
                })
                .then(function (feedback) {
                  return {
                    status: httpCode.OK,
                    data: feedback[0]
                  };
                })
            });
        } else {
          return {
            status: httpCode.NOT_FOUND,
            message: "FeedbackList is not found"
          };
        }
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Code or rating is missing"
      }
    }
  },
  updateStatusFeedback: function (data, context) {
    if (data.code && data.status) {
      return API.Model(FeedBackItemResponses).findOne({code: data.code}).then(function (feedback) {
        if (feedback) {
          var statusTmp = null;
          var status = _.forEach(feedback.status, function (stt) {
            if (stt.user == context.identity.id && stt.type_activity !== data.status) {
              stt.type_activity = data.status;
              statusTmp = stt;
            }
          });
          if (statusTmp) {
            statusTmp.activity_object_type = "feedback_item";
            statusTmp.activity_object_id = feedback.id;
            return API.Model(Activities).create(statusTmp)
              .then(function (activity) {
                var listActivity = feedback.listOfActivities;
                listActivity.push(activity.id);
                return API.Model(FeedBackItemResponses)
                  .update({id: feedback.id}, {
                    status: status,
                    listOfActivities: listActivity
                  })
                  .then(function (feedback) {
                    return {
                      status: httpCode.OK,
                      data: statusTmp
                    };
                  })
              });
          } else {
            return {
              status: httpCode.NO_CONTENT,
              message: "Status is not updated"
            };
          }
        } else {
          return {
            status: httpCode.NOT_FOUND,
            message: "Feedback is not found"
          };
        }
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Missing code or status"
      };
    }
  },
  //Create method
  ///Old method
  createNewUrl: function (data) {
    var $FeedBackUrl = API.Model(FeedbackAnonymousUrls),
      $Teams = API.Model(Teams);
    if (data.subDomain) {
      return $Teams.findOne({subDomain: data.subDomain}).then(function (team) {
        if (team) {
          return $FeedBackUrl.findOne({team: team.id}).then(function (feedbackurl) {
            var now = new Date();
            now.setHours(0, 0, 0, 0);
            if (!feedbackurl || (feedbackurl.expireTime && new Date() > feedbackurl.expireTime)) {
              now.setTime(now.getTime() + sails.config.security.urlToken.expiration * 1000 + 999);
              return $FeedBackUrl.create({team: team.id, expireTime: now}).then(function (feedbackurl) {
                return feedbackurl;
              });
            }
            return feedbackurl
          });
        } else {
          return {
            status: httpCode.NOT_FOUND,
            message: "This company doesn't exist"
          };
        }
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Request is missing domain name"
      }
    }
  },
  createFeedback: function (data) {
    var $FeedBackItemResponse = API.Model(FeedBackItemResponses),
      $Users = API.Model(Users),
      $FeedBackListResponse = API.Model(FeedBackListResponses);
    if (data.feedbackSample && data.receiver) {
      var now = new Date();
      return FeedbackAnonymousUrls.findOne({code: data.code}).populate('team')
        .then(function (feedbackLink) {
          return $Users.find({email: data.receiver, client_id: feedbackLink.team.client_id})
            .then(function (users) {
              var recieverIds = users.map(function (user) {
                return user.id;
              });
              return $FeedBackListResponse.create({})
                .then(function (feedback_list) {
                  data.content.push({
                    meaningKey: 'TYPE_OF_FEEDBACK',
                    title: "Type of feedback",
                    content: "Negative"
                  });
                  var status = users.map(function (user) {
                    return {
                      type_activity: 'status',
                      data: {
                        text: 'sent'
                      },
                      user: user.id,
                      activity_object_type: 'feedback_list',
                      activity_object_id: feedback_list.id
                    };
                  });
                  return $FeedBackItemResponse.create({
                    feedbackType: 'issue',
                    content: data.content,
                    feedbackSample: data.feedbackSample,
                    feedbackPage: feedback_list.id,
                    isAnonymous: true,
                    teamReceiver: feedbackLink.team,
                    status: status
                  }).then(function (feedbackItem) {
                    var url = "//" + feedbackLink.team.subDomain + '.' + domain + '/feedback/received/' + feedbackItem.code;
                    var options = _.filter(feedbackItem.content, function (con) {
                      if (con.title === "Feedback about") {
                        return con;
                      }
                    });
                    var optionString = _.join(options[0].content, ",");
                    for (var i = 0; i < users.length; i++) {
                      if (users[i].activeDate) {
                        var template = templateEmailsService({
                          feedbackReceiverURL: url,
                          email: users[i].email,
                          avatar: users[i].avatar,
                          options: optionString + "..."
                        }, 'notificationFeedbackLink');
                        emailsService(template);
                      } else {
                        feedbackEmailInvite(users[i], "feedbackInactiveUser");
                      }
                    }
                    feedbackItem.receiver.add(recieverIds);
                    feedbackItem.save(function (err) {
                    });
                    API.Model(Compentencies).find({name: options[0].content}).then(function (compentencies) {
                      _.forEach(compentencies, function (com) {
                        com.listOfFeedbacks.add(feedbackItem.id);
                        com.save();
                      });
                    });
                    return API.Model(Activities).create(status).then(function (activities) {
                      var actionList = _.map(activities, function (activity) {
                        return activity.id;
                      });
                      return $FeedBackListResponse.update({id: feedback_list.id}, {
                        listOfActivities: actionList,
                        feedback: feedbackItem.id
                      })
                        .then(function (feedback_list) {
                          return {
                            status: httpCode.OK,
                            data: feedback_list
                          }
                        });
                    });
                  });
                });
            });
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Request is missing feedback sample code or receiver or feedback status"
      }
    }
  },
  createFeedbackTakeAction: function (data, context) {
    var id = context.identity.id;
    var content = data.content, feedback_page = data.feedbackPage;
    if (content && feedback_page) {
      return API.Model(FeedBackListResponses).findOne({id: feedback_page}).then(function (feedbackList) {
        if (!feedbackList) {
          return {
            status: httpCode.NOT_FOUND,
            message: "Feedback list doesn't exist"
          }
        }
        var actionComment = {
          type_activity: 'comment',
          data: {
            text: content
          },
          user: id,
          activity_object_type: 'feedback_list',
          activity_object_id: feedback_page
        };
        return API.Model(Activities).create(actionComment).then(function (activities) {
          feedbackList.listOfActivities.push(activities.id);
          return API.Model(FeedBackListResponses).update({id: feedbackList.id}, {listOfActivities: feedbackList.listOfActivities}).then(function (feedback_list) {
            return {
              status: httpCode.OK,
              data: feedback_list
            };
          });
        });
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Request is missing feedback content or feedback page"
      }
    }

  },
  ///New method All in One
  createPublicIssue: function (data, context) {
    if (data && data.content && data.isAnonymous && data.content.compentencies && data.feedbackType) {
      var client_id = context.identity.client_id,
        user_id = context.identity.id;
      return Teams.findOne({client_id: client_id, isDelete: false}).populate('members')
        .then(function (team) {
          return API.Model(FeedBackItemResponses).create({
            content: data.content,
            giver: user_id,
            teamReceiver: team.id,
            feedbackType: data.feedbackType,
            isAnonymous: data.isAnonymous,
            feedbackState: 'open'
          }).then(function (feedback) {
            var createUser = _.filter(team.members, function (member) {
              return member.email === "tadaa@perkfec.com"
            });
            var id = createUser[0].id;
            if (!feedback.isAnonymous) {
              id = user_id;
            }
            NewsFeedsService.createNewsfeedByBot({
              createUser: createUser[0].id,
              subject: id,
              team: team.id,
              typeNewsfeed: 8,
              data: {
                model: "feedback",
                code: feedback.code
              }
            });
            return [feedback, team]
          })
        })
        .then(function (results) {
          var feedback = results[0];
          var team = results[1];
          return Answers.find({code: data.content.compentencies})
            .populate(['content'])
            .then(function (answers) {
              var listComName = _.map(answers, function (answer) {
                var comNames = _.filter(answer.content, {language: 'en'})[0];
                return comNames.content;
              });
              return [feedback, team, listComName];
            })
        })
        .then(function (results) {
          var feedback = results[0];
          var team = results[1];
          var comNames = results[2];
          return API.Model(Compentencies).find({name: comNames})
            .then(function (coms) {
              var comIds = _.map(coms, function (com) {
                return com.id
              });
              return [feedback, team, comIds, comNames];
            })
        })
        .then(function (results) {
          var feedback = results[0],
            team = results[1],
            comIds = results[2],
            comNames = results[3],
            listActivities = [],
            userReceiveCode = [];
          if (data.receiver && data.receiver.length > 0) {
            userReceiveCode = _.concat(userReceiveCode, data.receiver);
          } else {
            userReceiveCode = _.concat(userReceiveCode, _.map(team.members, function (member) {
              return member.code;
            }));
          }
          listActivities.push({
            type_activity: 'open',
            user: user_id,
            activity_object_type: 'feedback_item',
            activity_object_id: feedback.id
          });
          return API.Model(Users).find({code: userReceiveCode})
            .then(function (users) {
              var recieverIds = _.map(users, function (user) {
                return user.id;
              });
              var status = _.map(users, function (user) {
                return {
                  type_activity: 'receive',
                  user: user.id,
                  activity_object_type: 'feedback_item',
                  activity_object_id: feedback.id
                };
              });
              listActivities = _.concat(listActivities, status);
              var url = "//" + team.subDomain + '.' + domain + '/feedback/received/' + feedback.code;
              for (var i = 0; i < users.length; i++) {
                if (users[i].activeDate) {
                  var template = templateEmailsService({
                    feedbackReceiverURL: url,
                    email: users[i].email,
                    avatar: users[i].avatar,
                    options: comNames + "..."
                  }, 'notificationFeedbackLink');
                  emailsService(template);
                } else {
                  feedbackEmailInvite(users[i], "feedbackInactiveUser");
                }
              }
              return API.Model(Activities).create(listActivities).then(function (activities) {
                var activityIds = _.map(activities, function (activity) {
                  return activity.id
                });
                results[4] = activityIds;
                results[5] = recieverIds;
                results[6] = status;
                return results;
              });
            });
        })
        .then(function (results) {
          var feedback = results[0],
            team = results[1],
            comIds = results[2],
            comNames = results[3],
            activityIds = results[4],
            receiverIds = results[5],
            status = results[6];
          var statusMap = _.map(status, function (sta) {
            return {
              type_activity: sta.type_activity,
              user: sta.user
            };
          });
          data.receiver && data.receiver.length ? feedback.receiver.add(receiverIds) : null;
          feedback.content.competencies = comNames;
          feedback.listOfCompentencies.add(comIds);
          return feedback.save().then(function () {
            return API.Model(FeedBackItemResponses).update({id: feedback.id}, {
              listOfActivities: activityIds,
              status: statusMap
            })
              .then(function (feedback) {
                return {
                  status: httpCode.OK,
                  data: feedback[0]
                };
              });
          });
        });
    }
    else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data content'
      }
    }
  },
  //Get method
  getPublicIssue: function (data, context) {
    if (data && data.feedbackCode) {
      return FeedBackItemResponses.findOne({code: data.feedbackCode, isDelete: false})
        .populate(['listOfCompentencies', 'giver'])
        .then(function (feedbackItem) {
          if (feedbackItem) {
            var listOfCompentencies = _.map(feedbackItem.listOfCompentencies, function (com) {
              return {
                id: com.id,
                name: com.name
              };
            });
            return API.Model(Activities).find({
              user: context.identity.id,
              type_activity: 'vote',
              activity_object_type: "feedback_item",
              activity_object_id: feedbackItem.id
            })
              .then(function (activity) {
                return getActivitiesUser(feedbackItem.listCommentLatest).then(function (com) {
                  var result = {comment: [], vote: []};
                  result.comment = com;
                  return result
                })
                  .then(function (result) {
                    return getActivitiesUser(feedbackItem.listVoteLatest).then(function (votes) {
                      result.vote = votes;
                      return result;
                    });
                  })
                  .then(function (result) {
                    var feedbackItemFilter = {
                      code: feedbackItem.code,
                      status: feedbackItem.status,
                      state: feedbackItem.feedbackState,
                      type: feedbackItem.feedbackType,
                      isAnonymous: feedbackItem.isAnonymous,
                      competencies: listOfCompentencies,
                      createdAt: feedbackItem.createdAt,
                      commentCount: feedbackItem.commentCount,
                      voteCount: feedbackItem.voteCount,
                      title: feedbackItem.content.title,
                      content: feedbackItem.content.content,
                      listVoteLatest: result.vote,
                      isVoted: activity.length > 0
                    };
                    if (feedbackItem.isAnonymous) {
                      feedbackItemFilter.giver = {
                        email: null,
                        firstName: 'Anonymous',
                        lastName: null,
                        avatar: null,
                        code: null
                      }
                    } else {
                      feedbackItemFilter.giver = {
                        email: feedbackItem.giver.email,
                        firstName: feedbackItem.giver.firstName,
                        lastName: feedbackItem.giver.lastName,
                        avatar: feedbackItem.giver.avatar,
                        code: feedbackItem.giver.code
                      }
                    }
                    return ActivityService.getListActivities(feedbackItem.listOfActivities).then(function (activities) {
                      var latestActivities = _.slice(activities, 0, 10);
                      feedbackItemFilter.latestActivities = latestActivities;
                      return {
                        status: httpCode.OK,
                        data: feedbackItemFilter
                      }
                    });
                  });
              })
          }
          return {
            status: httpCode.NOT_FOUND,
            message: 'Feedback item is not found'
          };
        })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Request is missing data or data feedback"
      }
    }
  },
  getAllActivities: function (data, context) {
    if (data && data.feedbackCode) {
      return FeedBackItemResponses.findOne({code: data.feedbackCode, isDelete: false})
        .then(function (feedbackItem) {
          if (feedbackItem) {
            return Activities.find({id: feedbackItem.listOfActivities, isDelete: false}).populate('user')
              .then(function (activities) {
                var listActivities = _.map(activities, function (activity) {
                  return {
                    data: activity.data,
                    avatar: activity.user.avatar,
                    firstName: activity.user.firstName,
                    lastName: activity.user.lastName,
                    createdAt: activity.createdAt,
                    type: activity.type_activity
                  }
                });
                return {
                  status: httpCode.OK,
                  list: listActivities
                };
              });
          }
          return {
            status: httpCode.NOT_FOUND,
            message: 'Feedback item is not found'
          };
        })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Request is missing data or data feedback"
      }
    }
  },
  getStatOfAllIssue: function (data, context) {
    if (data.type) {
      switch (data.type) {
        case 'public':
          var client_id = context.identity.client_id;
          return API.Model(Teams).findOne({client_id: client_id}).then(function (team) {
            return API.Model(FeedBackItemResponses).find({teamReceiver: team.id})
              .then(function (feedbackItems) {
                var openIssue = _.filter(feedbackItems, function (feedbackItem) {
                  return (feedbackItem.feedbackType === "issue" && feedbackItem.feedbackState === "open" && feedbackItem.isAnonymous === false);
                }).length;
                var closeIssue = _.filter(feedbackItems, function (feedbackItem) {
                  return (feedbackItem.feedbackType === "issue" && feedbackItem.feedbackState === "close" && feedbackItem.isAnonymous === false);
                }).length;
                var privateIssue = _.filter(feedbackItems, function (feedbackItem) {
                  return (feedbackItem.isAnonymous === true);
                }).length;
                return {
                  status: httpCode.OK,
                  data: {
                    open: openIssue,
                    close: closeIssue,
                    anonymous: privateIssue
                  }
                };
              });
          });
        case 'give':
          var id = context.identity.id;
          return FeedBackItemResponses.find({giver: id}).then(function (feedbacks) {
            var openIssue = _.filter(feedbacks, function (feedbackItem) {
              return ((feedbackItem.feedbackType === "issue" || feedbackItem.feedbackType === "feedback") && feedbackItem.feedbackState === "open" && feedbackItem.isAnonymous === false);
            }).length;
            var closeIssue = _.filter(feedbacks, function (feedbackItem) {
              return ((feedbackItem.feedbackType === "issue" || feedbackItem.feedbackType === "feedback") && feedbackItem.feedbackState === "close" && feedbackItem.isAnonymous === false);
            }).length;
            var privateIssue = _.filter(feedbacks, function (feedbackItem) {
              return (feedbackItem.isAnonymous === true);
            }).length;
            return {
              status: httpCode.OK,
              data: {
                open: openIssue,
                close: closeIssue,
                anonymous: privateIssue
              }
            };
          });
        case 'received':
          var id = context.identity.id;
          return Users.findOne({id: id}).populate('receiverFeedback').then(function (users) {
            var feedbacks = users.receiverFeedback;
            var openIssue = _.filter(feedbacks, function (feedbackItem) {
              return ((feedbackItem.feedbackType === "issue" || feedbackItem.feedbackType === "feedback") && feedbackItem.feedbackState === "open" && feedbackItem.isAnonymous === false);
            }).length;
            var closeIssue = _.filter(feedbacks, function (feedbackItem) {
              return ((feedbackItem.feedbackType === "issue" || feedbackItem.feedbackType === "feedback") && feedbackItem.feedbackState === "close" && feedbackItem.isAnonymous === false);
            }).length;
            var privateIssue = _.filter(feedbacks, function (feedbackItem) {
              return (feedbackItem.isAnonymous === true);
            }).length;
            return {
              status: httpCode.OK,
              data: {
                open: openIssue,
                close: closeIssue,
                anonymous: privateIssue
              }
            };
          });
        default:
          return {
            status: httpCode.NOT_FOUND,
            message: "Not found type of request"
          }
      }
    }
    return {
      status: httpCode.BAD_REQUEST,
      message: "Missing type issue"
    }

  },
  //TODO Get feedback item by user
  getIssueByType: function (data, context) {
    if (data.type) {
      switch (data.type) {
        case 'public':
          var client_id = context.identity.client_id;
          return API.Model(Teams).findOne({client_id: client_id}).then(function (team) {
            return FeedBackItemResponses.find({teamReceiver: team.id, isDelete: false})
              .populate(['giver', 'listOfCompentencies', 'receiver'])
              .then(function (feedbackItems) {
                if (feedbackItems.length === 0) {
                  return {
                    status: httpCode.OK,
                    list: feedbackItems
                  };
                }
                var feedbackItemFilters = _.filter(feedbackItems, function (feedbackItem) {
                  if (feedbackItem.receiver.length === 0) {
                    return feedbackItem;
                  }
                });
                var feedbackItemMap = _.map(feedbackItemFilters, function (feedbackItem) {
                  var compentencies = _.map(feedbackItem.listOfCompentencies, function (com) {
                    return {
                      id: com.id,
                      name: com.name
                    };
                  });
                  var res = {
                    code: feedbackItem.code,
                    status: feedbackItem.status,
                    state: feedbackItem.feedbackState,
                    type: feedbackItem.feedbackType,
                    isAnonymous: feedbackItem.isAnonymous,
                    competencies: compentencies,
                    createdAt: feedbackItem.createdAt,
                    commentCount: feedbackItem.commentCount,
                    voteCount: feedbackItem.voteCount,
                    title: feedbackItem.content.title
                  }
                  if (feedbackItem.isAnonymous) {
                    res.giver = {
                      email: null,
                      firstName: 'Anonymous',
                      lastName: null,
                      avatar: null,
                      code: null
                    }
                    return res;
                  } else {
                    res.giver = {
                      email: feedbackItem.giver.email,
                      firstName: feedbackItem.giver.firstName,
                      lastName: feedbackItem.giver.lastName,
                      avatar: feedbackItem.giver.avatar,
                      code: feedbackItem.giver.code
                    }
                    return res;
                  }
                });
                return {
                  status: httpCode.OK,
                  list: feedbackItemMap
                };
              });
          });
        case 'give':
          var id = context.identity.id;
          return FeedBackItemResponses.find({giver: id}).populate(['listOfCompentencies', 'giver']).then(function (feedbacks) {
            if (feedbacks.length > 0) {
              var feedbackItemFilter = _.map(feedbacks, function (feedbackItem) {
                var compentencies = _.map(feedbackItem.listOfCompentencies, function (com) {
                  return {
                    id: com.id,
                    name: com.name
                  };
                });
                return {
                  code: feedbackItem.code,
                  status: feedbackItem.status,
                  state: feedbackItem.feedbackState,
                  type: feedbackItem.feedbackType,
                  isAnonymous: feedbackItem.isAnonymous,
                  competencies: compentencies,
                  createdAt: feedbackItem.createdAt,
                  commentCount: feedbackItem.commentCount,
                  voteCount: feedbackItem.voteCount,
                  title: feedbackItem.content.title,
                  giver: feedbackItem.isAnonymous ? {
                    email: null,
                    firstName: 'Anonymous',
                    lastName: null,
                    avatar: null,
                    code: null
                  } : {
                    email: feedbackItem.giver.email,
                    firstName: feedbackItem.giver.firstName,
                    lastName: feedbackItem.giver.lastName,
                    avatar: feedbackItem.giver.avatar,
                    code: feedbackItem.giver.code
                  }
                };
              });
              return {
                status: httpCode.OK,
                list: feedbackItemFilter
              };
            } else {
              return {
                status: httpCode.OK,
                list: feedbacks
              };
            }
          });
        case 'received':
          var id = context.identity.id;
          return Users.findOne({id: id}).populate('receiverFeedback').then(function (users) {
            if (users.receiverFeedback.length > 0) {
              var feedbackIds = _.map(users.receiverFeedback, function (feedback) {
                return feedback.id;
              });
              return FeedBackItemResponses.find({id: feedbackIds})
                .populate(['giver', 'listOfCompentencies'])
                .then(function (feedback) {
                  var feedbackItemFilter = _.map(feedback, function (feedbackItem) {
                    var compentencies = _.map(feedbackItem.listOfCompentencies, function (com) {
                      return {
                        id: com.id,
                        name: com.name
                      };
                    });
                    var status = feedbackItem.status.filter(function (status) {
                      if (status.user === id) {
                        return status;
                      }
                    })[0].type_activity;
                    var res = {
                      code: feedbackItem.code,
                      status: feedbackItem.status,
                      state: feedbackItem.feedbackState,
                      type: feedbackItem.feedbackType,
                      isAnonymous: feedbackItem.isAnonymous,
                      competencies: compentencies,
                      createdAt: feedbackItem.createdAt,
                      commentCount: feedbackItem.commentCount,
                      voteCount: feedbackItem.voteCount,
                      title: feedbackItem.content.title
                    }
                    if (feedbackItem.isAnonymous) {
                      res.giver = {
                        email: null,
                        firstName: 'Anonymous',
                        lastName: null,
                        avatar: null,
                        code: null
                      }
                      return res;
                    } else {
                      res.giver = {
                        email: feedbackItem.giver.email,
                        firstName: feedbackItem.giver.firstName,
                        lastName: feedbackItem.giver.lastName,
                        avatar: feedbackItem.giver.avatar,
                        code: feedbackItem.giver.code
                      }
                      return res;
                    }
                  });
                  return {
                    status: httpCode.OK,
                    list: feedbackItemFilter
                  };
                });
            } else {
              return {
                status: httpCode.OK,
                list: []
              }
            }
          });
        default:
          return {
            status: httpCode.NOT_FOUND,
            message: "Not found type of request"
          }
      }
    }
    return {
      status: httpCode.BAD_REQUEST,
      message: "Missing type issue"
    }
  },
  getListQuestionMultilanguage: function (questions, language, client_id, sampleModel) {
    return getListQuestionMultilanguageInternal(questions, language, client_id, sampleModel);
  },
  getFeedbackSampleUnAnonymous: function (data, context) {
    var client_id = context.identity.client_id;
    if (data && data.feedbackSample && data.language) {
      return API.Model(FeedBackItemSamples).findOne({title: data.feedbackSample, team: null, type: 'feedback'})
        .then(function (sample) {
          var id = sample.id;
          return Questions.find({feebackSamples: sample.id})
            .populate(['content', 'answerList'])
            .then(function (questions) {
              return [sample, questions];
            })
        })
        .then(function (result) {
          var sample = result[0], questions = result[1];
          var sampleModel = {
            title: sample.title,
          };
          return getListQuestionMultilanguageInternal(questions, data.language, client_id, sampleModel);
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Missing data'
      }
    }
  },
  getFeedbackSampleByCode: function (data, context) {
    if (!context) {
      return {
        status: httpCode.NOT_FOUND,
        message: "You don't have permission"
      }
    }
    var client_id = context.identity.client_id;
    if (data && data.feedbackSample && data.language) {
      return API.Model(FeedBackItemSamples).findOne({code: data.feedbackSample})
        .then(function (sample) {
          if (sample) {
            var id = sample.id;
            return Questions.find({feebackSamples: sample.id, isDelete: false})
              .populate(['content', 'answerList'])
              .then(function (questions) {
                return [sample, questions];
              })
          } else {
            return {
              status: httpCode.NOT_FOUND,
              message: 'Not found sample'
            }
          }
        })
        .then(function (result) {
          if (_.isArray(result)) {
            var sample = result[0], questions = result[1];
            var sampleModel = {
              title: sample.title
            };
            return getListQuestionMultilanguageInternal(questions, data.language, client_id, sampleModel);
          } else {
            return result;
          }
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Missing data'
      }
    }
  },
  getListAllFeedbackItemResponse: function (data, context) {
    var id = context.identity.client_id;
    return FeedBackItemResponses.find({}).populate(['receiver', 'listOfCompentencies']).then(function (feedbacks) {
      var feedbackFilter = _.filter(feedbacks, function (p) {
        return p.receiver[0] && p.receiver[0].client_id === id;
      });
      var feedback = _.map(feedbackFilter, function (p) {
        var recievers = _.map(p.receiver, function (recei) {
          return {email: recei.email, firstName: recei.firstName}
        });
        return {
          id: p.id,
          content: p.content,
          receiver: recievers,
          competencies: p.listOfCompentencies,
          createdAt: p.createdAt
        };
      });
      var feedbackSort = _.sortBy(feedback, [function (feedb) {
        return feedb.createdAt
      }]);
      return {
        status: httpCode.OK,
        listData: feedbackSort
      };
    });
  }
};
