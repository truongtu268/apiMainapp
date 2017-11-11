/**
 * FeedBackController
 *
 * @description :: Server-side logic for managing Feedbacks
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  'get_issue_by_type': function (req, res) {
    API(FeedbackService.getIssueByType,req,res);
  },
  'create_feedback_take_action': function (req, res) {
    API(FeedbackService.createFeedbackTakeAction, req, res);
  },
  'updateStatusFeedback': function (req, res) {
    API(FeedbackService.updateStatusFeedback, req, res);
  },
  'get_all_list_feedback': function (req, res) {
    API(FeedbackService.getListAllFeedbackItemResponse, req, res);
  },
  'get_all_list_feedback_admin': function (req, res) {
    API(FeedbackService.getListAllFeedbackItemResponse, req, res);
  },
  'create_public_issue': function (req,res) {
    API(FeedbackService.createPublicIssue, req ,res);
  },
  'delete_public_issue': function (req, res) {
    API(FeedbackService.deletePublicIssue, req, res);
  },
  'get_public_issue': function (req, res) {
    API(FeedbackService.getPublicIssue, req, res);
  },
  'get_all_activities': function (req, res) {
    API(FeedbackService.getAllActivities, req, res);
  },
  'get_stat_of_all_issue': function (req, res) {
    API(FeedbackService.getStatOfAllIssue, req, res);
  },
  'rating_issue_anonymous': function (req, res) {
    API(FeedbackService.ratingIssueAnonymous, req, res);
  }
};
