module.exports = {
  attributes: {
    code:{
      type:'string',
      unique:true,
      required:true
    },
    surveys:{
      collection: 'surveys',
      via: 'surveyCollection',
      dominant: true
    },
    oldSurvey:{
      type: 'array',
      defaultsTo: []
    },
    schedule: {
      type: 'json',
      required: true,
      defaultsTo:{
        timeStart:"12:00:00",
        dayOfWeek:[0],
        weekOfMonth:[],
        monthOfQuarter:[],
        isRepeat: true
      }
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    },
    team:{
      model:'teams'
    }
  }
}
