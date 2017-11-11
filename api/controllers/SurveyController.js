module.exports = {
  create_survey: function(req,res){
    API(SurveyService.createSurvey,req,res);
  },
  get_my_created_survey: function(req,res){
    API(SurveyService.getMyCreatedSurvey,req,res);
  },
  get_preset_survey: function (req,res) {
    API(SurveyService.getPresetSurvey,req,res);
  },
  get_survey_by_code: function (req, res) {
    API(SurveyService.getSurveyById,req,res);
  },
  get_survey_by_template_code: function (req, res) {
    API(SurveyService.getSurveyByTemplateCode,req,res);
  },
  edit_survey_by_user: function (req, res) {
    API(SurveyService.editSurvey, req, res);
  },
  publish_survey: function (req, res) {
    API(SurveyService.publishSurvey, req, res);
  },
  stop_survey: function (req,res) {
    API(SurveyService.stopSurvey, req, res);
  },
  submit_survey_content: function (req,res) {
    API(SurveyService.submitSurveyContent,req,res);
  },
  submit_survey_setting: function (req, res) {
    API(SurveyService.submitSurveySetting,req,res);
  },
  edit_survey_content: function (req, res) {
    API(SurveyService.editSurveyContent,req,res);
  },
  initial_list_survey_item: function (req, res) {
    API(SurveyService.createListSurveyResponsePerTime, req, res);
  },
  get_survey_question_per_user: function (req, res) {
    API(SurveyService.getSurveyQuestionPerUser, req, res);
  },
  create_survey_response_per_question: function (req, res) {
    API(SurveyService.createSurveyResponsePerQuestion, req, res);
  },
  list_all_user_with_all_survey_need_run: function (req, res) {
    API(SurveyService.listAllUserWithAllSurveyNeedRun, req, res);
  },
  stop_all_survey_run_out_of_time: function (req, res) {
    API(SurveyService.stopAllSurveyRunOutOfTime, req, res);
  },
  get_all_survey_need_to_ask: function (req, res) {
    API(SurveyService.getAllSurveyNeedToAsk, req, res);
  },
  delete_survey: function (req, res) {
    API(SurveyService.deleteSurvey, req, res);
  },
  send_survey_to_trash: function (req, res) {
    API(SurveyService.setSurveyInTrash, req, res);
  },
  survey_collection_test: function (req, res) {
    API(SurveyCollectionService.randomCheckPresetSurvey, req, res);
  },
  analysis_preset_survey: function (req, res) {
    API(SurveyService.analysisPresetSurvey, req, res);
  },
  analysis_normal_survey: function (req, res) {
    API(SurveyService.analysisNormalSurvey, req, res);
  }
};
