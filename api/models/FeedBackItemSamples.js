/**
 * FeedBackSample.js
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
    title:{
      type:'string',
      required:true
    },
    cover:{
      type:'string'
    },
    questions:{
      collection: 'questions',
      via: 'feebackSamples'
    },
    team: {
      model: 'teams'
    },
    isEditable:{
      type: 'boolean',
      required: true,
      defaultsTo: true
    },
    isTemplate: {
      type: 'boolean',
      required: true,
      defaultsTo: false
    },
    type: {
      type: 'string',
      enum: ['feedback', 'survey', 'presetSurvey']
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};
