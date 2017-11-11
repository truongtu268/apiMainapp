/**
 * FeedBack.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var uuid = require('node-uuid');
module.exports = {
  autoPK: false,
  attributes: {
    id:{
      type:'string',
      unique: true,
      required: true,
      primaryKey: true,
      defaultsTo: function () {
        return uuid.v4();
      }
    },
    code:{
      type:'string',
      unique: true,
      required: true
    },
    feedbackSample:{
      model:'feedbackitemsamples'
    },
    content:{
      type:'json',
      required:true,
      defaultsTo: {}
    },
    giver:{
      model:'users'
    },
    receiver:{
      collection:'users',
      via:'receiverFeedback',
      dominant: true
    },
    teamReceiver:{
      model:'teams'
    },
    feedbackType: {
      type: 'string',
      enum: ['recognize','issue','feedback','other']
    },
    isAnonymous:{
      type: 'boolean'
    },
    feedbackPage:{
      model:'feedbacklistresponses'
    },
    status: {
      type: 'json'
    },
    rate: {
      type: 'integer',
      required: true,
      defaultsTo: 0
    },
    voteCount: {
      type: 'integer',
      defaultsTo: 0
    },
    commentCount: {
      type: 'integer',
      defaultsTo: 0
    },
    feedbackState: {
      type: 'string',
      enum: ['open','close']
    },
    listOfActivities:{
      type: 'array'
    },
    listOfCompentencies: {
      collection: 'compentencies',
      via: 'listOfFeedbacks'
    },
    listOfHappiness:{
      collection: 'happiness',
      via: 'listOfFeedbacks',
      dominant: true
    },
    listCommentLatest: {
      'type':'json',
      defaultsTo: []
    },
    listVoteLatest: {
      'type':'json',
      defaultsTo: []
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};

