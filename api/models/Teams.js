/**
 * Team.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var uuid = require('node-uuid');
var promisify = require('bluebird').promisify,
bcrypt = require('bcrypt-nodejs');

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
    teamName: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    subDomain:{
      type: 'string',
      required: true,
      defaultsTo: null
    },
    logo:{
      type:'string'
    },
    slackId:{
      type:'string'
    },
    teamInfo:{
      type:'json'
    },
    members:{
      collection:'users',
      via: 'team'
    },
    feedbackUrls:{
      collection: 'FeedbackAnonymousUrls',
      via: 'team'
    },
    feedbackItemList:{
      collection: 'feedbackitemresponses',
      via: 'teamReceiver'
    },
    packageName:{
      model: 'pricingpackages'
    },
    client_id:{
      type: 'string',
      required: true,
      unique: true,
      defaultsTo: null
    },
    client_sercret:{
      type: 'string',
      required: true,
      defaultsTo: null
    },
    trust_level:{
      type: 'string'
    },
    redirect_uri:{
      type: 'string',
      urlish: true
    },
    dateRegistered:{
      type: 'string'
    },
    dateVerified:{
      type: 'string'
    },
    compareSecret: function (teamSercret) {
      return bcrypt.compareSync(teamSercret,this.team_sercret);
    },
    toJSON: function () {
      var obj = this.toObject();
      delete obj.team_sercret;
      return obj;
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  },

  beforeCreate: function (team, next) {
    if(team.hasOwnProperty('team_secret')){
      team.team_sercret = bcrypt.hashSync(team.team_sercret,bcrypt.genSaltSync(10));
      next(false,team);
    }else{
      next(null,team);
    }
  },

  authenticate: function (teamId,teamSecret) {
    return API.Model(Team).findOne({team_id:teamId}).then(function (team) {
      return (team && team.compareSecret(teamSecret)) ? team : null;
    });
  }
};

