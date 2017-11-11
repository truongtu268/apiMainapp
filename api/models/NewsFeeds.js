/**
 * Created by MyPC on 6/27/2017.
 */
var uuid = require('node-uuid');
module.exports = {
  autoPK: false,
  attributes: {
    id:{
      type:'string',
      unique: true,
      required: true,
      primaryKey: true,
      defaultsTo: function () {
        return uuid.v4();
      }
    },
    code:{
      type:'string',
      unique: true,
      required: true
    },
    createUser:{
      model:'users',
      required:true
    },
    subject: {
      model:'users'
    },
    typeNewsfeed:{
      model:'newsfeedtypes',
      required:true
    },
    team:{
      model:'teams',
      required: true
    },
    edgeRank :{
      type:'integer'
    },
    data : {
      type:'json'
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};
