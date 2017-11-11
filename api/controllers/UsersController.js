/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  register: function (req, res) {
    API(Registration.registerUser, req, res);
  },
  'verify/:email': function (req, res) {
    API(Registration.verifyUser, req, res);
  },
  current: function (req, res) {
    API(UserService.getCurrentUser, req, res);
  },
  changepassword: function (req, res) {
    API(UserService.changepassword, req, res);
  },
  editprofile: function (req, res) {
    API(UserService.editCurrentUser, req, res);
  },
  members_company: function (req, res) {
    API(UserService.getListUserByCompany, req, res);
  },
  'member_by_code/:code': function (req, res) {
    API(UserService.getUserByCode, req, res);
  },
  upgrade_admin: function (req, res) {
    API(UserService.upgradeUserToAdmin, req, res);
  },
  upgrade_owner: function (req, res) {
    API(UserService.upgradeUserToOwner, req, res);
  },
  downgrade_user: function (req, res) {
    API(UserService.downGradeUser, req, res);
  },
  delete_user: function (req, res) {
    API(UserService.deleteUser, req, res);
  },
  ///check later
  register_by_invite_link: function (req, res) {
    API(Registration.registerUserByInviteLink, req, res);
  },
  create_invite_link: function (req, res) {
    API(UserService.createRegisterUrl, req, res);
  },
  verify_register_link: function (req, res) {
    API(UserService.verifyRegisterUrl, req, res);
  },
  forgot_password: function (req, res) {
    API(Registration.forgotPassword, req, res);
  },
  change_password_in_forgot: function (req, res) {
    API(Registration.changePasswordInForgot, req, res);
  },
  'member': function (req, res) {
    if(req.isSocket){
      var body = req.body;
      return API.Model(Rooms)
        .findOrCreate({name: body.subdomain},{name: body.subdomain})
        .then(function (data) {
          sails.sockets.join(req, data.name);
          return res.ok("Connect success");
      });
    } else {
      return res.forbidden();
    }
  }
};
