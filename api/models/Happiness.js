/**
 * Happiness.js
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
    name: {
      type: 'string',
      required: true,
      defaultsTo: null,
      unique: true
    },
    listOfIndustries: {
      collection: 'industries',
      via: 'listOfHappiness'
    },
    listOfQuestions: {
      collection: 'questions',
      via: 'listOfHappiness'
    },
    listOfFeedbacks: {
      collection: 'FeedBackItemResponses',
      via: 'listOfHappiness'
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};

