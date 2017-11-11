/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */
require('dotenv').config();

module.exports.bootstrap = function(cb) {
  /** IMPORTANT: DO NOT ADD FAKE DATA, IT WILL CRASH SERVER**/
  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  // var logProccess = require('../fake_data/log_proccess_data');

  // var teams = require('../fake_data/team_data');
  // var feedbackItemSample = require('../fake_data/feedback_item_sample_data'),
  //   botUser = require('../fake_data/users_data'),
  //   roleUsers = require('../fake_data/member_roles'),
  //   industry = require('../fake_data/Industry'),
  //   newsFeedTypes = require('../fake_data/news_feed_types'),
  //   typeInput = require('../fake_data/type_input_data'),
  //   meaningKey = require('../fake_data/meaningkey_data'),
  //   anonymousUser = require('../fake_data/anonymous_user'),
  //   survey = require('../fake_data/survey_data'),
  //   feedbackSample = require('../fake_data/template_multi_data');
  //   date = new Date();
  // botUser.activeDate = date;
  // fakeDataService.create_compentencies(industry);
  // fakeDataService.create_user_type(roleUsers);
  // fakeDataService.register_team(teams);
  // fakeDataService.create_chat_bot(botUser);
  // API.Model(NewsFeedTypes).create(newsFeedTypes).then(function (type) {
  // });
  // API.Model(MeaningKeys).create(meaningKey).then(function (meaningkey) {
  // });
  // API.Model(TypeInputs).create(typeInput).then(function (typeinput) {
  // });
  // API.Model(AnonymousUsers).create(anonymousUser).then(function (anonymous) {
  // });
  // fakeDataService.create_feedback_sample(feedbackSample);
  // fakeDataService.create_survey(survey);
  // fakeDataService.create_preset_survey();
  return cb();
};
