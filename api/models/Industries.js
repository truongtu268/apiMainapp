/**
 * Industries.js
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
    name:{
      type: 'string',
      required: true,
      unique: true
    },
    listOfCompentencies:{
      collection: 'compentencies',
      via: 'listOfIndustries',
      dominant: true
    },
    listOfHappiness:{
      collection: 'happiness',
      via: 'listOfIndustries',
      dominant: true
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};
