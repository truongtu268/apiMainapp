/**
 * Created by MyPC on 7/12/2017.
 */
/**
 * Created by MyPC on 6/4/2017.
 */
var Promise = require('bluebird'),
  promisify = Promise.promisify,
  httpCode = require('http-codes');

module.exports = {
  getAllcompetencies: function (data, context) {
    $Compentencies = API.Model(Compentencies);
    return $Compentencies.find({}).then(function (coms) {
      return {
        status: httpCode.OK,
        list: coms
      };
    });
  }
}
