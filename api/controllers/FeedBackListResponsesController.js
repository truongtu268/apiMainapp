/**
 * FeedBackPageController
 *
 * @description :: Server-side logic for managing Feedbackpages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	'createfeedback':function(req,res){
    API(FeedbackService.createFeedback,req,res);
  },
  'getlistfeedback': function (req, res) {
    API(FeedbackService.getListFeedback,req,res);
  },
  'send_url_feedback_list_to_email': function (req, res) {
    API(FeedbackService.sendUrlFeedbackListToEmail, req, res);
  },
  'rating_feedback': function (req, res) {
    API(FeedbackService.ratingFeedback, req, res);
  }
};
