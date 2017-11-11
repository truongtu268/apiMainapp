module.exports = {

  attributes: {
    surveyResponseItem: {
      model: 'surveyresponseitems',
      required: true
    },
    question: {
      model: 'questions',
      required: true
    },
    answer: {
      type: 'json'
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
