/**
 * AnonymousUrlController
 *
 * @description :: Server-side logic for managing Anonymousurls
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  get_anonymous_urls: function(req,res){
    API(FeedbackService.createNewUrl,req,res);
  },
  verify_anonymous_urls: function (req,res) {
    API(FeedbackService.verifyUrl,req,res);
  }
};

