/**
 * QuestionsController
 *
 * @description :: Server-side logic for managing questions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  create_meaning_key: function (req, res) {
    API(QuestionsService.createMeaningKey,req,res);
  },
  get_all_meaning_keys: function (req, res) {
    API(QuestionsService.getAllMeaningKeys,req,res);
  },
  update_meaning_keys: function (req, res) {
    API(QuestionsService.updateMeaningKeys,req,res);
  },
  create_type_input: function (req, res) {
    API(QuestionsService.createTypeInput,req,res);
  },
  get_all_type_input: function (req, res) {
    API(QuestionsService.getAllTypeInput,req,res);
  },
  update_type_input: function (req, res) {
    API(QuestionsService.updateTypeInput,req,res);
  },
  create_question: function (req, res) {
    API(QuestionsService.createQuestion,req,res);
  },
  get_all_question_by_team: function (req, res) {
    API(QuestionsService.getAllQuestionByTeam,req,res);
  },
  update_question_by_team: function (req, res) {
    API(QuestionsService.updateQuestionByTeam,req,res);
  }
};

