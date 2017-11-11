module.exports = {

  attributes: {
    surveyResponseItem: {
      collection:'surveyresponseitems',
      via: 'surveyResponseList'
    },
    survey:{
      model: 'surveys',
      required: true
    },
    statusSurveyList:{
      type: 'string',
      enum:['running','stopped','completed'],
      required: true,
      defaultsTo: 'running'
    },
    code:{
      type:'string',
      unique: true,
      required: true
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};
