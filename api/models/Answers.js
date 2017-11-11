module.exports = {
  attributes: {
    code:{
      type:'string',
      unique: true,
      required: true
    },
    icon:{
      type:'string'
    },
    questionId:{
      model:'questions'
    },
    content: {
      collection: 'AnswerContents',
      via: 'answer'
    },
    weight: {
      type:'integer'
    },
    orderInQuestion: {
      type: 'integer'
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};
