module.exports = {
  attributes: {
    code:{
      type:'string',
      unique: true,
      required: true
    },
    questionId:{
      model:'questions'
    },
    content: {
      type: 'string',
      defaultsTo: null
    },
    language: {
      type: 'string',
      defaultsTo: 'en'
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};
