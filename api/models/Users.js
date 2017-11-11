/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var promisify = require('bluebird').promisify,
  removeDiacritics = require('diacritics').remove,
  bcrypt = require('bcrypt-nodejs');
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
    email: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    password:{
      type:'string',
      required:true,
      defaultsTo: null,
      columnName: 'encrypted_password',
      minLength: 8
    },
    firstName:{
      type:'string'
    },
    lastName:{
      type:'string'
    },
    firstNameNoSign:{
      type:'string'
    },
    lastNameNoSign:{
      type:'string'
    },
    avatar:{
      type:'string'
    },
    jobTitle:{
      type:'string'
    },
    personalInfo:{
      type:'json'
    },
    team:{
      collection:'teams',
      via: 'members',
      dominant: true
    },
    teamRole:{
      model:'typeusers',
      required: true,
      defaultsTo: 1
    },
    client_id:{
      type:'string'
    },
    socialInfo:{
      type:'json'
    },
    settings:{
      type:'json'
    },
    slackId:{
      type:'string'
    },
    userNoti:{
      collection:'usernotifications',
      via:'user',
      dominant: true
    },
    activitiesList:{
      collection:'activities',
      via: 'user'
    },
    inviteDate:{
      type:'date'
    },
    activeDate:{
      type:'date'
    },
    joinCompanyDate:{
      type:'date'
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    },
    receiverFeedback:{
      collection:'feedbackitemresponses',
      via:'receiver'
    },
    runningSurveys: {
      collection:'surveyresponseitems',
      via:'respondent'
    },
    comparePassword: function (password) {
      return bcrypt.compareSync(password,this.password);
    },

    toJSON: function () {
      var obj = this.toObject();
      delete obj.password;

      return obj;
    }
  },

  beforeCreate: function (user, next) {
    if(user.hasOwnProperty('password')){
      user.password = bcrypt.hashSync(user.password,bcrypt.genSaltSync(10));
      if(user.hasOwnProperty('firstName')){
        user.firstNameNoSign = removeDiacritics(user.firstName);
      }
      if(user.hasOwnProperty('lastName')){
        user.lastNameNoSign = removeDiacritics(user.lastName);
      }
      next(false,user);
    } else{
      next(null,user);
    }
  },
  beforeUpdate: function (user, next) {
    if(user.hasOwnProperty('firstName') || user.hasOwnProperty('lastName')){
      if(user.hasOwnProperty('firstName')){
        user.firstNameNoSign = removeDiacritics(user.firstName);
      }
      if(user.hasOwnProperty('lastName')){
        user.lastNameNoSign = removeDiacritics(user.lastName);
      }
      next(false,user);
    } else {
      next(null,user);
    }
  },
  changePassword: function (user, next) {
    if(user.hasOwnProperty('password')){
      user.password = bcrypt.hashSync(user.password,bcrypt.genSaltSync(10));
      next(false,user);
    } else{
      next(null,user);
    }
  },

  authenticate: function (email, password, clientId) {
    return API.Model(Users).findOne({email:email, client_id:clientId}).then(function (user) {
      if(!user){
        return null;
      }
      return (user && user.comparePassword(password) && !user.isDelete)? user : null;
    });
  }
};

