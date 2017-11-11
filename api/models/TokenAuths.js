/**
 * TokenAuths.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var Promise = require('bluebird'),
  promisify = Promise.promisify,
  randToken = require('rand-token');
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
    accessToken: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    refreshToken: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    code: {
      type: 'string',
      unique: true,
      required: true
    },
    expirationDate: {
      type: 'datetime',
      required: true,
      defaultsTo: null
    },
    userId: {
      type: 'string'
    },
    client_id: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    security_level: {
      type: 'string'
    },
    scope: {
      type: 'string'
    },
    isDelete: {
      type: 'boolean',
      required: true,
      defaultsTo: false
    },
    calc_expires_in: function () {
      return Math.floor(new Date(this.expirationDate).getTime() / 1000 - new Date().getTime() / 1000);
    },
    toJSON: function () {
      var hiddenProperties = ['id', 'accessToken', 'refreshToken', 'code', 'userId', 'client_id'],
        obj = this.Object();
      obj.expires_in = this.expires_in();

      hiddenProperties.forEach(function (property) {
        delete  obj[property];
      });

      return obj;
    }
  },
  authenticate: function (criteria) {
    var tokenInfo,
      $Tokens = API.Model(TokenAuths),
      $Users = API.Model(Users),
      $Teams = API.Model(Teams),
      $result;
    if (criteria.accessToken) {
      $result = $Tokens.findOne({accessToken: criteria.accessToken});
    } else if (criteria.code) {
      $result = $Tokens.findOne({code: criteria.code});
    }
    else {
      return Promise.reject("Unauthorized");
    }
    return $result.then(function (token) {
      if (!token) return null;
      if (token.expirationDate && new Date() > token.expirationDate) {
        return $Tokens.destroy({accessToken: token}).then(function () {
          return null
        });
      }

      tokenInfo = token;

      if (token.userId != null) {
        return $Users.findOne({
          id: token.userId
        });
      } else {
        return $Teams.findOne({team_id: token.team_id});
      }
    }).then(function (identity) {
      if (!identity) return null;
      else if (criteria.type == 'verification') {
        if (identity.email != criteria.email) {
          return null;
        }
      }
      else if (!identity.inviteDate) return null;

      return {
        identity: identity,
        authorization: {
          scope: tokenInfo.scope,
          token: tokenInfo
        }
      };
    });
  },

  generateTokenString: function () {
    return randToken.generate(sails.config.security.oauth.token.length);
  },

  generateToken: function (criteria) {
    var token = {},
      accessToken;

    if (!criteria.client_id) return Promise.resolve(null);

    token.client_id = criteria.client_id;
    token.userId = criteria.userId || undefined;
    token.accessToken = accessToken = TokenAuths.generateTokenString();

    token.refreshToken = TokenAuths.generateTokenString();
    token.code = TokenAuths.generateTokenString();

    if (!criteria.expirationDate) {
      token.expirationDate = new Date();
      token.expirationDate.setTime(token.expirationDate.getTime() + sails.config.security.oauth.token.expiration * 1000 + 999);
    }

    return TokenAuths.findOrCreate(criteria, token).then(function (retrievedToken) {
      if (retrievedToken.accessToken != accessToken) {
        return TokenAuths.update(criteria, token).then(function (updatedTokens) {
          return updatedTokens[0];
        });
      }
      return retrievedToken;
    });
  }
};

