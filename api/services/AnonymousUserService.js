/**
 * Created by MyPC on 6/30/2017.
 */
var _ = require('lodash');
var statusCode = require('http-codes');
module.exports = {
  randoomUser: function () {
    return API.Model(AnonymousUsers).find({}).then(function (anonymousUsers) {
      return _.sample(anonymousUsers)
    })
  }
}
