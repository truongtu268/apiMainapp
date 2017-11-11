module.exports = {

  attributes: {
    surveyTitle: {
      type: 'string',
      required: true,
      defaultsTo: 'No subject'
    },
    template:{
      model:'feedbackitemsamples'
    },
    templateCode:{
      type: 'string'
    },
    creator: {
      model: 'users'
    },
    isAnonymous: {
      type: 'boolean',
      defaultsTo: true
    },
    receivers:{
      collection:'users'
    },
    surveyResponseList:{
      collection:'SurveyResponseLists',
      via:'survey'
    },
    status:{
      type:'string',
      enum:['draft','running','stopped','deleted'],
      defaultsTo: 'draft'
    },
    receiverTeam:{
      model:'teams'
    },
    typeSurvey: {
      type:'string'
    },
    schedule: {
      type:'json',
      required: true,
      defaultsTo: {}
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
    },
    surveyCollection:{
      collection: 'surveyCollections',
      via: 'surveys'
    }
  }
};
