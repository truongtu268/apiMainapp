/**
 * TeamNotification.js
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
      required:true,
      defaultsTo: null
    },
    description:{
      type:'string',
      required:true,
      defaultsTo: null
    },
    statusNoti:{
      type:'string',
      enum:['unread','read'],
      required:true,
      defaultsTo: null
    },
    actionNoti:{
      type:'json',
      required:true,
      defaultsTo: null
    },
    // team:{
    //   collection:'teams',
    //   via:'team_noti'
    // },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};

