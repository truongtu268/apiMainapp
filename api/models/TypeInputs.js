/**
 * Created by MyPC on 7/17/2017.
 */
module.exports = {

  attributes: {
    code:{
      type:'string',
      unique: true,
      required: true
    },
    name:{
      type:'string',
      required:true
    },
    codename:{
      type:'string',
      required:true
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};
