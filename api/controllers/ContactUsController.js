/**
 * ContactUsController
 *
 * @description :: Server-side logic for managing Contactuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  post_contact: function(req,res){
    API(contactUsService.postContactUs,req,res);
  },
  get_all_contact: function (req, res) {
    API(contactUsService.getAllContact,req,res);
  }
};

