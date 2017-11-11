/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  '*': 'OAuthValidateAccessToken',

  /***************************************************************************
  *                                                                          *
  * Here's an example of mapping some policies to run before a controller    *
  * and its actions                                                          *
  *                                                                          *
  ***************************************************************************/
  OAuthController: {
    '*' :  'OAuthValidateAccessToken',
    token: 'OAuthPublicTeam'
  },
  UsersController: {
    '*' : 'OAuthValidateAccessToken',
    'register' : 'OAuthValidateAccessToken',
    'upgrade_admin' : ['OAuthValidateAccessToken','isOwner'],
    'upgrade_owner' : ['OAuthValidateAccessToken','isOwner'],
    'delete_user' : ['OAuthValidateAccessToken','isAdmin'],
    'verify/:email' : true,
    'register_by_invite_link' : true,
    'change_password_in_forgot' : true,
    'create_invite_link' : true,
    'verify_register_link' : true,
    'forgot_password': true,
    'create_log': true,
    'delete_log': true,
    'find_log': true,
    'member': true
  },
  SuperAdminController: {
    '*' : 'OAuthValidateAccessToken',
    'edit_survey_content' : true
  },
  TeamsController: {
    '*' : 'OAuthValidateAccessToken',
    'register' : true,
    'verify/:email' : true,
    'verifysubdomain/:subDomain' : true
  },
  FeedbackAnonymousUrlsController:{
    '*' : 'OAuthValidateAccessToken',
    'get_anonymous_urls' : true,
    'verify_anonymous_urls': true
  },
  FeedBackItemSamplesController:{
    '*' : true,
    'createfeedbacksamples_unanonymous' : 'OAuthValidateAccessToken',
    'get_feedback_samples_by_code' : 'OAuthValidateAccessToken',
    'create_feedback_sample' : 'OAuthValidateAccessToken',
    'update_feedback_sample' : 'OAuthValidateAccessToken',
    'delete_feedback_sample' : 'OAuthValidateAccessToken'
  },
  LogProccessesController:{
    '*' : 'OAuthValidateAccessToken'
  },
  FeedBackListResponsesController:{
    '*' : 'OAuthValidateAccessToken',
    'createfeedbacksamples' : true,
    'image_generate': true
  },
  FeedBackItemResponsesController:{
    '*' : 'OAuthValidateAccessToken',
    'get_all_list_feedback' : ['OAuthValidateAccessToken','isAdmin','isOwner'],
    'get_all_list_feedback_admin' : ['OAuthValidateAccessToken','isAdmin']
  },
  FileController:{
    '*' : true
  },
  ContactUsController:{
    '*': true
  },
  ActivitiesController:{
    '*': 'OAuthValidateAccessToken'
  },
  NewsFeedsController:{
    '*': 'OAuthValidateAccessToken'
  },
  SurveyController:{
    'survey_collection_test': true
  }
	// RabbitController: {
		// Apply the `false` policy as the default for all of RabbitController's actions
		// (`false` prevents all access, which ensures that nothing bad happens to our rabbits)
		// '*': false,
		// For the action `nurture`, apply the 'isRabbitMother' policy
		// (this overrides `false` above)
		// nurture	: 'isRabbitMother',
		// Apply the `isNiceToAnimals` AND `hasRabbitFood` policies
		// before letting any users feed our rabbits
		// feed : ['isNiceToAnimals', 'hasRabbitFood']
	// }
};
