/**
 * Created by truongtu on 4/16/2017.
 */
var Promise = require('bluebird'),
  promisify = Promise.promisify,
  httpCode = require('http-codes');

module.exports = {
  verifySubdomain: function (data, context) {
    if (data.subdomain) {
      if (data.subdomain.length >= 5) {
        return Teams.findOne({
          subDomain: data.subdomain
        })
          .then(function (info) {
          if (!info) {
            return {
              status: httpCode.NOT_FOUND,
              message: "This company doesn't exist"
            }
          }
          return {
            status: httpCode.OK,
            verified: true,
            teamName: info.teamName,
            subDomain: info.subDomain,
            client_id: info.client_id,
            logo: info.logo
          }
        });
      }
      return {
        status: httpCode.BAD_REQUEST,
        message: "Subdomain must be longer than 4 character"
      }
    }
    return {
      status: httpCode.BAD_REQUEST,
      message: "Subdomain is null"
    }
  }
};
