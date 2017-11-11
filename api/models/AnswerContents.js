module.exports = {
  attributes: {
    code:{
      type:'string',
      unique: true,
      required: true
    },
    content: {
      type: 'string',
      defaultsTo: null
    },
    answer:{
      model:'answers'
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
