/**
 * Questions.js
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
    isRequireAnswer: {
      type:'boolean',
      required: true,
      defaultsTo: true
    },
    type: {
      model: 'typeinputs',
      required: true
    },
    meaningKey: {
      model: 'meaningkeys',
      required: true
    },
    content: {
      collection: 'QuestionContents',
      via:'questionId'
    },
    answerList:{
      collection: 'answers',
      via:'questionId'
    },
    team: {
      model: 'teams'
    },
    feebackSamples: {
      model: 'feedbackitemsamples'
    },
    orderInSample: {
      type:'integer'
    },
    listOfCompentencies: {
      collection: 'compentencies',
      via: 'listOfQuestions',
      dominant: true
    },
    listOfHappiness:{
      collection: 'happiness',
      via: 'listOfQuestions',
      dominant: true
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};

