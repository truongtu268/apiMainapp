/**
 * FileController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  uploadfile: function (req, res) {
    try {
      req.file('avatar').upload({
        adapter: require('skipper-s3'),
        key: sails.config.security.s3.key,
        secret: sails.config.security.s3.secret,
        bucket: sails.config.security.s3.bucket
      }, function (err, filesUploaded) {
        if (err) return res.negotiate(err);
        return res.ok({
          files: filesUploaded,
          textParams: req.params.all()
        });
      });
    } catch (e){
      (e);
    }
  },
  uploadfilefeedback: function (req, res) {
    try {
      req.file('feedback').upload({
        adapter: require('skipper-s3'),
        key: sails.config.security.s3.key,
        secret: sails.config.security.s3.secret,
        bucket: sails.config.security.s3.bucket
      }, function (err, filesUploaded) {
        if (err) return res.negotiate(err);
        return res.ok({
          files: filesUploaded,
          textParams: req.params.all()
        });
      });
    } catch (e){
      (e);
    }
  }
};
