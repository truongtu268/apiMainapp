/**
 * Created by truongtu on 5/16/2017.
 */
var pug = require('pug');
templateEmail = function (options, id) {
  var newOptions = {};
  var message = "";
  var url = require('path').join(__dirname,'./mailsTemplate/');
  switch(id){
    case 'signUp':
      var compiledFunction = pug.compileFile(url + 'signup.pug');
      newOptions.message = compiledFunction(options);
      newOptions.subject = 'Your Perkfec account is almost active!';
      newOptions.email = options.email;
      return newOptions;
    case 'forgotPassword':
      var compiledFunction = pug.compileFile(url + 'forgotPassword.pug');
      newOptions.message = compiledFunction(options);
      newOptions.subject = 'Perkfec App Forgot password';
      newOptions.email = options.email;
      return newOptions;
    case 'forgotPasswordSuccess':
      var compiledFunction = pug.compileFile(url + 'forgotPasswordSuccess.pug');
      newOptions.message = compiledFunction(options);
      newOptions.subject = 'Perkfec App Forgot password Success';
      newOptions.email = options.email;
      return newOptions;
    case 'signUpWithMessage':
      var compiledFunction = pug.compileFile(url + 'signupWithTemplate.pug');
      newOptions.message = compiledFunction(options);
      newOptions.subject = 'Perkfec App Account Registration';
      newOptions.email = options.email;
      return newOptions;
    case 'feedbackInactiveUser':
      var compiledFunction = pug.compileFile(url + 'notificateFeedbackInactiveUser.pug');
      newOptions.message = compiledFunction(options);
      newOptions.subject = 'Someone feedback you!!!';
      newOptions.email = options.email;
      return newOptions;
    case 'notificationFeedbackLink':
      var compiledFunction = pug.compileFile(url + 'notificateFeedback.pug');
      newOptions.message = compiledFunction(options);
      newOptions.subject = 'Someone sent you a new message';
      newOptions.email = options.email;
      return newOptions;
    case 'sendFeedbackLink':
      var compiledFunction = pug.compileFile(url + 'sendFeedbackLink.pug');
      newOptions.message = compiledFunction(options);
      newOptions.subject = 'Save link feedback';
      newOptions.email = options.email;
      return newOptions;
    case 'emailForClient':
      var compiledFunction = pug.compileFile(url + 'emailForClient.pug');
      newOptions.message = compiledFunction(options);
      newOptions.subject = 'Welcome to perkfec!!!';
      newOptions.email = options.email;
      return newOptions;
    case 'emailForCEO':
      var compiledFunction = pug.compileFile(url + 'emailForCEO.pug');
      newOptions.message = compiledFunction(options);
      newOptions.subject = 'Someone leave contact!!!';
      newOptions.email = 'toan@perkfec.com';
      return newOptions;
    case 'surveyNoti':
      var compiledFunction = pug.compileFile(url + 'sendSurveyNoti.pug');
      newOptions.message = compiledFunction(options);
      newOptions.subject = 'Have a survey need to answer';
      newOptions.email = options.email;
      return newOptions;
    default: break;
  }
};

module.exports = templateEmail;
