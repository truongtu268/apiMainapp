/**
 * Created by MyPC on 7/2/2017.
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
    type_activity: {
      type: 'string',
      required: true,
      enum: ['comment','vote','open','close','seen','receive','rating','compentencies','edit']
    },
    user: {
      model: 'users'
    },
    data: {
      type: 'json',
      required: true,
      defaultsTo: {}
    },
    activity_object_type:{
      type: 'string',
      required: true
    },
    activity_object_id:{
      type: 'string',
      required: true
    },
    isDelete:{
      type:'boolean',
      required: true,
      defaultsTo: false
    }
  }
};
