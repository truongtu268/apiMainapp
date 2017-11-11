/**
 * TeamController
 *
 * @description :: Server-side logic for managing Teams
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  register: function(req,res){
    API(Registration.registerTeam,req,res);
  },
  'verify/:email': function(req,res){
    API(Registration.verifyTeam,req,res);
  },
  'verifysubdomain/:subDomain': function(req,res){
    API(TeamService.verifySubdomain,req,res);
  }
};

