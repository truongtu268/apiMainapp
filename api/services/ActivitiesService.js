/**
 * Created by MyPC on 7/5/2017.
 */
var Promise = require('bluebird'),
  bcrypt = require('bcrypt-nodejs'),
  _ = require('lodash'),
  httpCode = require('http-codes');

var domain = sails.config.security.server.domain;
latestActivity = function (listOfActivities) {
  return Activities.find({id: listOfActivities, isDelete: false}).populate('user')
    .then(function (activities) {
      var latestComment = _.map(_.slice(_.orderBy(_.filter(activities, function (activity) {
        return activity.type_activity === "comment"
      }), ['createdAt'], ['desc']), 0, 3), function (com) {
        return {
          code: com.code
        }
      });
      var latestVote = _.map(_.slice(_.orderBy(_.filter(activities, function (activity) {
        return activity.type_activity === "vote"
      }), function (o) {
        return o.createdAt;
      }), 0, 3), function (com) {
        return {
          code: com.code
        }
      });
      return {
        latestComment: latestComment,
        latestVote: latestVote
      }
    });
};

module.exports = {
  //Get method
  getAllActivitiesPublicIssueByType: function (data, context) {
    if (data && data.feedbackCode && data.type) {
      return API.Model(FeedBackItemResponses).findOne({code: data.feedbackCode}).then(function (feedbackItem) {
        if (!feedbackItem) {
          return {
            status: httpCode.NOT_FOUND,
            message: 'issue not found'
          };
        }
        var query = {
          activity_object_id: feedbackItem.id,
          isDelete: false,
          activity_object_type: 'feedback_item'
        };
        if (data.type !== "all") {
          query.type_activity = data.type;
        }
        return Activities.find(query).populate('user').sort('createdAt DESC').then(function (activities) {
          if (activities.length > 0) {
            var activitiesRes = _.map(activities, function (activity) {
              return {
                type: activity.type_activity,
                code: activity.code,
                content: activity.data,
                userCode: activity.user.code,
                avatar: activity.user.avatar,
                firstName: activity.user.firstName,
                createdAt: activity.createdAt
              }
            });
            return {
              status: httpCode.OK,
              listData: activitiesRes
            };
          } else {
            return {
              "status": httpCode
            }
          }
        })
      })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data feedback item'
      }
    }
  },
  //Create method
  createCommentPublicIssue: function (data, context) {
    var user_id = context.identity.id,
      avatar = context.identity.avatar,
      firstName = context.identity.firstName,
      lastName = context.identity.lastName;
    if (data && data.feedbackCode && data.content) {
      return API.Model(FeedBackItemResponses).findOne({code: data.feedbackCode}).then(function (feedback_item) {
        if (feedback_item) {
          return API.Model(Activities).create({
            type_activity: 'comment',
            user: user_id,
            data: data.content,
            activity_object_type: 'feedback_item',
            activity_object_id: feedback_item.id
          }).then(function (activity) {
            var commentCount = feedback_item.commentCount + 1;
            var listActivities = feedback_item.listOfActivities;
            listActivities.push(activity.id);
            return latestActivity(listActivities).then(function (latestActivity) {
              return API.Model(FeedBackItemResponses).update({id: feedback_item.id}, {
                commentCount: commentCount,
                listOfActivities: listActivities,
                listCommentLatest: latestActivity.latestComment,
                listVoteLatest: latestActivity.latestVote
              }).then(function (feedbackItem) {
                return {
                  status: httpCode.OK,
                  commentCount: feedbackItem[0].commentCount,
                  data: {
                    code: activity.code,
                    type: activity.type_activity,
                    data: activity.data,
                    user: {
                      avatar: avatar,
                      firstName: firstName,
                      lastName: lastName
                    },
                    createdAt: activity.createdAt,
                  }
                }
              })
            });
          })
        } else {
          return {
            status: httpCode.NOT_FOUND,
            message: "Feedback Item is not found"
          };
        }
      })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data content'
      }
    }
  },
  createVotePublicIssue: function (data, context) {
    var user_id = context.identity.id;
    if (data && data.feedbackCode) {
      return API.Model(FeedBackItemResponses)
        .findOne({code: data.feedbackCode})
        .then(function (feedback_item) {
          if (feedback_item) {
            return API.Model(Activities).find({
              user: user_id,
              type_activity: 'vote',
              activity_object_type: "feedback_item",
              activity_object_id: feedback_item.id
            }).then(function (activity) {
              if (activity.length > 0) {
                return API.Model(Activities).destroy({
                  user: user_id,
                  type_activity: 'vote',
                  activity_object_type: "feedback_item",
                  activity_object_id: feedback_item.id
                })
                  .then(function (activity) {
                    var listActivity = feedback_item.listOfActivities;
                    var voteCount = feedback_item.voteCount - 1;
                    var actIds = _.map(activity, function (act) {
                      return act.id;
                    });
                    listActivity = _.difference(listActivity, actIds);
                    return latestActivity(listActivity).then(function (latestActivity) {
                      return API.Model(FeedBackItemResponses).update({id: feedback_item.id}, {
                        listOfActivities: listActivity,
                        voteCount: voteCount,
                        listCommentLatest: latestActivity.latestComment,
                        listVoteLatest: latestActivity.latestVote
                      }).then(function (feedback) {
                        return {
                          status: httpCode.OK,
                          data: {
                            voteCount: feedback[0].voteCount,
                            listVoteLatest: feedback[0].listVoteLatest ? feedback[0].listVoteLatest : 0
                          }
                        }
                      });
                    });
                  });
              } else {
                return API.Model(Activities).create({
                  type_activity: 'vote',
                  user: user_id,
                  activity_object_type: 'feedback_item',
                  activity_object_id: feedback_item.id
                })
                  .then(function (activity) {
                    var voteCount = feedback_item.voteCount + 1;
                    var listActivities = feedback_item.listOfActivities;
                    listActivities.push(activity.id);
                    return latestActivity(listActivities).then(function (latestActivity) {
                      return API.Model(FeedBackItemResponses).update({id: feedback_item.id}, {
                        voteCount: voteCount,
                        listOfActivities: listActivities,
                        listCommentLatest: latestActivity.latestComment,
                        listVoteLatest: latestActivity.latestVote
                      }).then(function (feedback_item) {
                        return {
                          status: httpCode.OK,
                          data: {
                            voteCount: feedback_item[0].voteCount,
                            listVoteLatest: feedback_item[0].listVoteLatest
                          }
                        };
                      });
                    });
                  })
              }
            });
          } else {
            return {
              status: httpCode.NOT_FOUND,
              message: "Feedback Item is not found"
            };
          }
        })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data content'
      }
    }
  },
  //Update method
  /// Todo check later
  updateStatePublicIssue: function (data, context) {
    var user_id = context.identity.id;
    if (data && data.feedbackCode && data.state) {
      return API.Model(FeedBackItemResponses)
        .findOne({code: data.feedbackCode})
        .then(function (feedback_item) {
          if (feedback_item && feedback_item.feedbackState !== data.state && (feedback_item.giver === user_id )) {
            var id = null;
            if (!feedback_item.isAnonymous) {
              id = user_id;
            }
            Users.findOne({email:'tadaa@perkfec.com'}).then(function (tada) {
              NewsFeedsService.createNewsfeedByBot({
                createUser: tada.id,
                subject: id,
                team: feedback_item.teamReceiver,
                typeNewsfeed: 9,
                data: {
                  model: "feedback",
                  code: feedback_item.code
                }
              });
            });
            return API.Model(Activities).create({
              user: user_id,
              type_activity: data.state,
              activity_object_type: "feedback_item",
              activity_object_id: feedback_item.id
            }).then(function (activity) {
              var listActivity = feedback_item.listOfActivities;
              listActivity.push(activity.id);
              return API.Model(FeedBackItemResponses)
                .update({id: feedback_item.id}, {feedbackState: data.state, listOfActivities: listActivity})
                .then(function (feedbackItem) {
                  return {
                    status: httpCode.OK,
                    data: {
                      feedbackState: feedbackItem[0].feedbackState,
                      activity: {
                        type: activity.type_activity,
                        code: activity.code,
                        content: activity.data,
                        avatar: context.identity.avatar,
                        firstName: context.identity.firstName,
                        userCode: context.identity.code,
                      }
                    }
                  };
                })
            });
          } else {
            return {
              status: httpCode.NOT_FOUND,
              message: "Feedback Item is not found or state is invalid"
            };
          }
        })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data content'
      }
    }
  },
  /*updateCompentenciesPublicIssue: function (data, context) {
   if (data && data.feedbackCode && data.compentencies&& data.compentencies.length !== 0) {
   var user_id = context.identity.id;
   return FeedBackItemResponses.findOne({code: data.feedbackCode, isDelete: false})
   .populate('listOfCompentencies')
   .then(function (feedbackItem) {
   if (feedbackItem && feedbackItem.giver === user_id) {
   var listCompentencies = _.map(feedbackItem.listOfCompentencies, function (com) {
   return com.id;
   });
   feedbackItem.listOfCompentencies.remove(listCompentencies);
   feedbackItem.save();
   return feedbackItem;
   }
   return {
   status: httpCode.NOT_FOUND,
   message: 'Feedback item is not found or not permission to update that feedback'
   };
   }).then(function (feedbackItem) {
   if (feedbackItem.status === 404) {
   return feedbackItem;
   }
   return API.Model(Compentencies).find({id: data.compentencies}).then(function (coms) {
   if(coms.length === 0){
   return {
   status: httpCode.NOT_FOUND,
   message: 'Compentencies is not found'
   };
   }
   feedbackItem.listOfCompentencies.add(data.compentencies);
   feedbackItem.save();
   return coms;
   }).then(function (coms) {
   var comsName = _.map(coms, function (com) {
   return com.name;
   });
   return API.Model(Activities).create({
   user: user_id,
   type_activity: 'compentencies',
   data: {
   'list': comsName
   },
   activity_object_type: "feedback_item",
   activity_object_id: feedbackItem.id
   }).then(function (activity) {
   var listActivities = feedbackItem.listOfActivities;
   var content = feedbackItem.content;
   content.compentencies = activity.data.list;
   listActivities.push(activity.id);
   return API.Model(FeedBackItemResponses).update({id: feedbackItem.id}, {
   listOfActivities: listActivities,
   content: content
   }).then(function (feedback) {
   return {
   status: httpCode.OK,
   list: coms
   }
   });
   });
   });
   });
   } else {
   return {
   status: httpCode.BAD_REQUEST,
   message: "Request is missing data or data feedback"
   }
   }
   },*/
  updateContentPublicIssue: function (data, context) {
    if (data && data.feedbackCode && data.content && data.content.title && data.content.content && data.content.compentencies && data.content.compentencies.length !== 0) {
      var user_id = context.identity.id;
      return FeedBackItemResponses.findOne({code: data.feedbackCode, isDelete: false})
        .populate('listOfCompentencies')
        .then(function (feedbackItem) {
            if (feedbackItem && feedbackItem.giver === user_id) {
              var oldContent = _.clone(feedbackItem.content);
              var listCompentencies = _.map(feedbackItem.listOfCompentencies, function (com) {
                return com.id;
              });

              return API.Model(Compentencies)
                .find({id: data.content.compentencies})
                .then(function (coms) {
                  if (coms.length === 0) {
                    return {
                      status: httpCode.NOT_FOUND,
                      message: 'Compentencies is not found'
                    };
                  }
                  return coms;
                })
                .then(function (coms) {
                  if(coms.status === 404){
                    return coms
                  }
                  var comsName = _.map(coms, function (com) {
                    return com.name;
                  });
                  var comIds = _.map(coms, function (com) {
                    return com.id;
                  });
                  var content = feedbackItem.content;
                  content = data.content;
                  content.compentencies = _.join(comsName, ',');
                  return API.Model(FeedBackItemResponses).findOne({code: data.feedbackCode})
                    .then(function (feedback) {
                      feedback.listOfCompentencies.remove(listCompentencies);
                      feedback.save();
                      return feedback;
                    })
                    .then(function (feedback) {
                      feedbackItem.listOfCompentencies.add(comIds);
                      feedbackItem.save();
                      return API.Model(Activities).create({
                        user: user_id,
                        type_activity: 'edit',
                        data: {
                          oldContent: oldContent,
                          newContent: content
                        },
                        activity_object_type: "feedback_item",
                        activity_object_id: feedbackItem.id
                      })
                        .then(function (activity) {
                          var listActivities = feedbackItem.listOfActivities;
                          var content = activity.data.newContent;
                          listActivities.push(activity.id);
                          return API.Model(FeedBackItemResponses).update({id: feedbackItem.id}, {
                            listOfActivities: listActivities,
                            content: content
                          })
                            .then(function (feedback) {
                              return {
                                status: httpCode.OK,
                                data: activity
                              }
                            });
                        });
                    });
                });
            }
            return {
              status: httpCode.NOT_FOUND,
              message: 'Feedback item is not found or not permission to update that feedback'
            };
          }
        )
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Request is missing data or data feedback"
      }
    }
  },
  updateCommentPublicIssue: function (data, context) {
    var user_id = context.identity.id;
    if (data && data.activity && data.content && data.feedbackCode) {
      return API.Model(Activities).findOne({code: data.activity, user: user_id})
        .then(function (activity) {
          if (activity) {
            return API.Model(Activities).update({
              code: data.activity,
              user: user_id
            }, {data: data.content})
              .then(function (activity) {
                if (activity.length > 0) {
                  return API.Model(FeedBackItemResponses).findOne({code: data.feedbackCode}).then(function (feedbackItem) {
                    if (feedbackItem) {
                      return latestActivity(feedbackItem.listOfActivities).then(function (latestActivities) {
                        return API.Model(FeedBackItemResponses).update({id: feedbackItem.id}, {
                          listCommentLatest: latestActivities.latestComment,
                          listVoteLatest: latestActivities.latestVote
                        }).then(function (feedback) {
                          return {
                            status: httpCode.OK,
                            data: {
                              commentCount: feedback[0].commentCount,
                              listCommentLatest: feedback[0].listCommentLatest
                            }
                          }
                        })
                      });
                    } else {
                      return {
                        status: httpCode.NOT_FOUND,
                        message: "Not found this activity"
                      }
                    }
                  });
                } else {
                  return {
                    status: httpCode.NOT_FOUND,
                    message: "Not found this activity"
                  }
                }
              });
          }
          return {
            status: httpCode.NOT_FOUND,
            message: "Comment is not found or You don't have permission"
          }
        })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data content or data activity'
      }
    }
  },
  //delete method
  deleteCommentPublicIssue: function (data, context) {
    var user_id = context.identity.id;
    if (data && data.activity) {
      return API.Model(Activities).findOne({code: data.activity}).then(function (activity) {
        if (activity && activity.user === user_id) {
          return API.Model(Activities).destroy({code: activity.code}).then(function (activity) {
            if (activity[0].activity_object_type === 'feedback_item') {
              return API.Model(FeedBackItemResponses).findOne({id: activity[0].activity_object_id})
                .then(function (feedback_item) {
                  if (feedback_item) {
                    var listActivity = feedback_item.listOfActivities;
                    var commentCount = feedback_item.commentCount - 1;
                    listActivity = _.filter(listActivity, function (act) {
                      return act !== activity[0].id;
                    });
                    return latestActivity(listActivity).then(function (latestActivity) {
                      return API.Model(FeedBackItemResponses).update({id: feedback_item.id}, {
                        listOfActivities: listActivity,
                        commentCount: commentCount,
                        listCommentLatest: latestActivity.latestComment,
                        listVoteLatest: latestActivity.latestVote
                      }).then(function (feedback) {
                        return {
                          status: httpCode.OK,
                          data: {
                            commentCount: feedback[0].commentCount,
                            listCommentLatest: feedback[0].listCommentLatest
                          }
                        }
                      });
                    });
                  } else {
                    return {
                      status: httpCode.NOT_FOUND,
                      message: "Not found this feedback item"
                    }
                  }
                })
            }
          })
        } else {
          return {
            status: httpCode.NOT_FOUND,
            message: 'Not found this activity'
          }
        }
      })
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data content or data activity'
      }
    }
  }
};
