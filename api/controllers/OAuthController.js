/**
 * TokenController
 *
 * @description :: Server-side logic for managing Tokens
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	token: function (req, res) {
    API(OAuth.sendToken,req,res);
  },
  'token-info': function (req,res) {
    API(OAuth.tokenInfo,req,res);
  }
};

