/**
 * Created by MyPC on 6/30/2017.
 */
var _ = require('lodash');
var statusCode = require('http-codes');
module.exports = {
  getListActivities: function (lisActivitiesId) {
    return Activities.find({id: lisActivitiesId, isDelete: false}).sort('createdAt DESC').populate('user')
      .then(function (listActivities, err) {
        if (err) {
          return [];
        } else {
          var listData = _.map(listActivities, function (action) {
            var actionData = _.omit(action, ['users']);
            return actionData.user = {
              code: action.code,
              type: action.type_activity,
              data: action.data,
              user: {
                code: action.user.code,
                firstName: action.user.firstName,
                lastName: action.user.lastName,
                email: action.user.email,
                avatar: action.user.avatar
              },
              isDelete: action.user.isDelete,
              createdAt: action.createdAt
            };
          });
          return listData;
        }
      });
  },
  deleteActivities: function (activityId) {
    return API.Model(Actions).delete({id: activityId}).then(function (action, err) {
      if(err){
        return {
          status: statusCode.NOT_FOUND,
          message: 'Some error with data'
        }
      } else {
        return {
          status: statusCode.OK,
          data: action[0],
          message:'Delete action success'
        }
      }
    })
  },
  createListActivities: function (listActivities) {
    var $Activities = API.Model(Activities);
    return $Activities.create(listActivities).then(function (activities) {
      var ids = _.map(activities, function (activity) {
        return activity.id;
      });
      return ids;
    })
  },
  createActivity: function (activities) {
    return API.Model(Actions).create(activities).then(function (activities) {
      return activities.id;
    })
  }
}
