/**
 * Compentencies.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
  attributes: {
    code: {
      type: 'string',
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
      via: 'listOfCompentencies'
    },
    listOfQuestions: {
      collection: 'questions',
      via: 'listOfCompentencies'
    },
    listOfFeedbacks: {
      collection: 'feedbackitemresponses',
      via: 'listOfCompentencies',
      dominant: true
    },
    parent: {
      type: 'string'
    },
    layer: {
      model: 'Layers'
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};

