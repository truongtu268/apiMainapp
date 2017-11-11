/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  edit_survey_content: function (req, res) {
    API(SuperAdminService.submitSurveyContent, req, res);
  }
};
