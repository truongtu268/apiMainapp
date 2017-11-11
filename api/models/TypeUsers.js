/**
 * TypeUser.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var uuid = require('node-uuid');
module.exports = {
  attributes: {
    code:{
      type:'string',
      unique: true,
      required: true
    },
    typeUsers: {
      type: 'string',
      required: true,
      defaultsTo: 'member'
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};

