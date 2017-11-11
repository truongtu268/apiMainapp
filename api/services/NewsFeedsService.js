/**
 * Created by MyPC on 6/8/2017.
 */
var httpCode = require('http-codes'),
  _ = require('lodash');

module.exports = {
  getAllNewsfeedByCompany: function (data, context) {
    return Teams.findOne({client_id: context.identity.client_id}).then(function (team) {
      return NewsFeeds.find({team: team.id}).populate(['createUser', 'subject']).then(function (logs) {
        var logsFilter = _.map(logs, function (log) {
          return {
            code: log.code,
            createdAt: log.createdAt,
            createUser: {
              code: log.createUser.code,
              avatar: log.createUser.avatar,
              firstName: log.createUser.firstName,
              lastName: log.createUser.lastName,
            },
            subject: {
              code: log.subject.code,
              avatar: log.subject.avatar,
              firstName: log.subject.firstName,
              lastName: log.subject.lastName
            },
            data: log.data
          };
        });
        return {
          status: httpCode.OK,
          list: _.orderBy(logsFilter, 'createdAt', 'desc')
        };
      })
    })
  },
  createNewsfeedType: function (data, context) {
    if (data.name && data.description && data) {
      return API.Model(NewsFeedTypes).create({
        name: data.name,
        description: data.description
      }).then(function (newsfeedtype) {
        return {
          status: httpCode.OK,
          data: newsfeedtype
        }
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Missing name or description in request"
      };
    }
  },
  getAllNewsfeedType: function (data, context) {
    return API.Model(NewsFeedTypes).find({}).then(function (newsfeedTypes) {
      return {
        status: httpCode.OK,
        list: newsfeedTypes
      }
    })
  },
  createNewsfeedByBot: function (data) {
    if (data) {
      return API.Model(NewsFeeds).create({
        createUser: data.createUser,
        subject: data.subject,
        team: data.team,
        typeNewsfeed: data.typeNewsfeed,
        data: data.data
      })
        .then(function (newsfeeds) {
          return newsfeeds;
        });
    } else {
      return null;
    }
  },
  createNewsfeed: function (data, context) {
    if (data && data.typeNewsfeed && data.data) {
      var userId = context.identity.id,
        clientId = context.identity.client_id;
      return API.Model(Teams).findOne({client_id: clientId})
        .then(function (team) {
          return API.Model(NewsFeeds)
            .create({
              createUser: userId,
              subject: data.subject,
              team: team.id,
              typeNewsfeed: data.typeNewsfeed,
              data: data.data
            })
            .then(function (newsfeed) {
              return {
                status: httpCode.OK,
                data: newsfeed
              }
            });
        });
    }
    else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Missing data or type newsfeed or data or content or description in request"
      };
    }
  }
};
