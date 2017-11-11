var Promise = require('bluebird'),
  bcrypt = require('bcrypt-nodejs'),
  randToken = require('rand-token'),
  _ = require('lodash'),
  moment = require('moment'),
  httpCode = require('http-codes');
checkTimeWithNow = function (timeStart) {
  var futureStartTime = moment().add(5, "minute"),
    startTime = moment(timeStart, "hh:mm:ss"),
    now = moment();
  if (startTime.isBetween(now, futureStartTime) || startTime.isSame(now)) {
    return true;
  }
  return false;
};
checkScheduleWithNow = function (schedule) {
  var quarter = moment().quarter(),
    year = moment().year(),
    monthOfQuarter = moment().month() % 3 - 1,
    month = moment().month(),
    dateOfweek = moment().day(),
    weekOfMonth = Math.ceil(moment().date() / 7) - 1,
    dayOfFirstMonth = moment(moment().startOf("month")).day();
    if (schedule.weekOfMonth.length > 0 ) {
      if (schedule.dayOfWeek.length === 1 &&
        dayOfFirstMonth <= schedule.dayOfWeek[0]) {
        if (_.indexOf(schedule.weekOfMonth, weekOfMonth) !== -1 &&
          dateOfweek === schedule.dayOfWeek[0]) {
          return checkTimeWithNow(schedule.timeStart);
        }
        return false;
      } else if (schedule.dayOfWeek.length === 1 &&
        dayOfFirstMonth > schedule.dayOfWeek[0]) {
        var weekOfMonthMap = _.map(schedule.weekOfMonth, function (week) {
          return week + 1;
        });
        if (_.indexOf(weekOfMonthMap, weekOfMonth) !== -1 &&
          dateOfweek === schedule.dayOfWeek[0]) {
          return checkTimeWithNow(schedule.timeStart);
        }
        return false;
      }
  } else if (schedule.dayOfWeek.length > 0 &&
    schedule.weekOfMonth.length === 0 ) {
    if (_.indexOf(schedule.dayOfWeek, dateOfweek) !== -1) {
      return checkTimeWithNow(schedule.timeStart);
    }
    return false;
  } else {
    return false;
  }
};
checkNotiStartAndEndTimeSurvey = function (surveyItem) {
  var now = moment(),
    startTime = moment(surveyItem.createdAt, 'YYYY-MM-DD hh:mm:ss'),
    stopTime = moment(surveyItem.timeStop, 'YYYY-MM-DD hh:mm:ss'),
    futureTime = moment().add(5, "minute");
  if (surveyItem.statusSurveyItem === "running" &&
    (now.diff(startTime, 'seconds') <= 300 && now.diff(startTime, 'seconds') >= 0)) {
    return true;
  }
  return false;
};
module.exports = {
  checkSchedule: function (data, context) {
    API.Model(SurveyCollections).find({})
      .then(function (surveyCollections) {
        var surveyMap = _.map(surveyCollections, function (surveyCollection) {
          if (checkScheduleWithNow(surveyCollection.schedule)) {
            return SurveyCollectionService.randomCheckPresetSurvey({id: surveyCollection.id});
          }
          return Promise.resolve(surveyCollection.id)
        });
        return Promise.all(surveyMap);
      })
      .then(function () {
        API.Model(Surveys).find({status: "running"})
          .then(function (surveys) {
            _.map(surveys, function (survey) {
              console.log(checkScheduleWithNow(survey.schedule));
              if (checkScheduleWithNow(survey.schedule)) {
                SurveyService.createListSurveyResponsePerTime({surveyCode: survey.code}, {});
              }
              return survey.id
            });
          })
          .then(function () {
            API.Model(SurveyResponseItems).find({statusSurveyItem: "running"})
              .then(function (surveyItems) {
                _.forEach(surveyItems, function (surveyItem) {
                  if (checkNotiStartAndEndTimeSurvey(surveyItem)) {
                    SurveyService.sendEmailNotiSurvey(surveyItem);
                  }
                });
              });
          });
      });
    return {
      status: httpCode.OK,
      message: "Check schedule process done"
    };
  }
};
