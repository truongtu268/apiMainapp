/**
 * FeedBackSampleController
 *
 * @description :: Server-side logic for managing Feedbacksamples
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  'createfeedbacksamples_unanonymous': function (req, res) {
    API(FeedbackService.getFeedbackSampleUnAnonymous,req,res);
  },
  'get_feedback_samples_by_code': function (req, res) {
    API(FeedbackService.getFeedbackSampleByCode,req,res);
  },
  'image_generate': function (req, res) {
    API(imageService.createRandomImage, req, res);
  },
  'create_feedback_sample': function (req, res) {
    API(SampleFeedbacksService.createFeedbackSample, req, res);
  },
  'update_feedback_sample': function (req, res) {
    API(SampleFeedbacksService.updateFeedbackSample, req, res);
  },
  'delete_feedback_sample': function (req, res) {
    API(SampleFeedbacksService.deleteFeedbackSample, req, res);
  },
  get_all_survey_template: function (req, res) {
    API(SampleFeedbacksService.getAllFeedbackSampleSurveyTemplate, req, res);
  }
};
