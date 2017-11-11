/**
 * Created by MyPC on 6/5/2017.
 */
var httpCode = require('http-codes');
module.exports = function (req, res, next) {
  OAuth.authenticator.authenticate('bearer', { session: false }, function(err,identity,authorization) {
    if (identity.teamRole !== 3){
      return res.send({
        status: httpCode.FORBIDDEN,
        message: "You don't have permission"
      });
    }

    req.identity = identity;
    req.authorization = authorization;
    next();
  })(req,res);
}
