/**
 * ContactUs.js
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
    code: {
      type: 'string',
      unique: true,
      required: true
    },
    name: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    email: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    phoneNo:{
      type: 'string',
      required: true,
      defaultsTo: null
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};

