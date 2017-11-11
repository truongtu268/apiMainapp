module.exports = {

  attributes: {
    surveyResponseList: {
      model: 'SurveyResponseLists',
      required: true
    },
    surveyResponseAnswer: {
      collection: 'SurveyResponseAnswers',
      via: 'surveyResponseItem'
    },
    respondent: {
      model: 'users',
      required: true
    },
    isAnonymous: {
      type: 'boolean',
      required: true,
      defaultsTo: true
    },
    template:{
      model:'feedbackitemsamples'
    },
    statusSurveyItem:{
      type: 'string',
      enum:['running','running and stop notification','stopped','completed'],
      required: true,
      defaultsTo: 'running'
    },
    timeStop:{
      type: 'datetime'
    },
    code: {
      type: 'string',
      unique: true,
      required: true
    },
    isDelete: {
      type: 'boolean',
      required: true,
      defaultsTo: false
    }
  }
};
