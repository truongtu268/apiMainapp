/**
 * Created by truongtu on 4/16/2017.
 */
var Promise = require('bluebird'),
  promisify = Promise.promisify,
  moment = require('moment'),
  _ = require('lodash'),
  bcrypt = require('bcrypt-nodejs'),
  validator = require('validator'),
  httpCode = require('http-codes');

var domain = sails.config.security.server.domain;

userAutoRegister = function (data, context) {
  var date = new Date(),
    $User = API.Model(Users),
    subDomain = '',
    $Teams = API.Model(Teams);
  var avatar = imageService.createRandomImage({
    hash: bcrypt.hashSync(data.email, bcrypt.genSaltSync(10))
  });
  var userPromise = $User.create({
    email: data.email,
    password: data.password,
    inviteDate: date,
    client_id: data.client_id,
    personalInfo: {
      fullName: data.email,
      graduate: '',
      experiment: '',
      mobile: '',
      address: '',
      day_Of_Birth: '',
      gender: ''
    },
    avatar: avatar.url,
    teamRole:1
  }).then(function (user) {
    return {
      id: user.id,
      avatar: user.avatar,
      fullName: user.personalInfo.fullName ? user.personalInfo.fullName : user.email,
      email: user.email,
      activeDate: user.activeDate,
      role: user.teamRole
    }
  });
  userPromise.then(function (user) {
    context.id = user.email;
    context.type = 'Email';
    $Teams.findOne({client_id: data.client_id}).then(function (team) {
      NewsFeedsService.createNewsfeedByBot({
        createUser: data.inviter,
        subject:user.id,
        team: team.id,
        typeNewsfeed: 10
      });
      team.members.add(user.id);
      subDomain = team.subDomain;
      team.save(function (err) {
      });
    });
    return TokenAuths.generateToken({
      userId: user.id,
      client_id: data.client_id
    });
  }).then(function (token) {
    var templateEmail = '';
    if (data.message) {
      templateEmail = templateEmailsService({
        id: context.id,
        type: context.type,
        verifyURL: "https://" + subDomain + "." + domain + "/login/?email=" + data.email + "&accessToken=" + token.accessToken,
        email: data.email,
        message: data.message + ": " + _.split(data.email, "@")[0] + "!",
        password: data.password,
        teamName: subDomain,
        domain: "https://" + subDomain + "." + domain + "/"
      }, 'signUp');
      return emailsService(templateEmail);
    } else {
      templateEmail = templateEmailsService({
        id: context.id,
        type: context.type,
        verifyURL: "https://" + subDomain + "." + domain + "/login/?email=" + data.email + "&accessToken=" + token.accessToken,
        teamName: subDomain,
        email: data.email,
        password: data.password,
        domainName: subDomain + "." + domain,
        domainURL: "https://" + subDomain + "." + domain + "/"
      }, 'signUp');
      return emailsService(templateEmail);
    }
  })
  return userPromise
};

resentEmailInvite = function (data, template, id) {
  var $TokenAuths = API.Model(TokenAuths);
  var $Teams = API.Model(Teams);
  var $Users = API.Model(Users);
  var user = data[0];
  $TokenAuths.destroy({userId: user.id}).then(function () {
    return TokenAuths.generateToken({
      userId: user.id,
      client_id: user.client_id
    }).then(function (token) {
      return $Teams.findOne({client_id: user.client_id}).then(function (team) {
        var passHash = bcrypt.hashSync(user.email, bcrypt.genSaltSync(10)).substring(0, 10);
        var passUpdate = bcrypt.hashSync(passHash, bcrypt.genSaltSync(10));
        NewsFeedsService.createNewsfeedByBot({
          createUser: id,
          subject:user.id,
          team: team.id,
          typeNewsfeed: 10,
          data: {}
        });
        return $Users.update({id: user.id}, {password: passUpdate}).then(function () {
          var option = {};
          if (template === 'signUp') {
            option = {
              message: "Welcome to " + team.subDomain + ": " + _.split(user.email, "@")[0] + " !",
              verifyURL: "//" + team.subDomain + "." + domain + "/login/?email=" + user.email + "&accessToken=" + token.accessToken,
              email: user.email,
              password: passHash,
              domain: "//" + team.subDomain + "." + domain + "/"
            };
          } else {
            option = {
              verifyURL: "//" + team.subDomain + "." + domain + "/login/?email=" + user.email + "&accessToken=" + token.accessToken,
              email: user.email,
              password: passHash
            };
          }
          var templateEmail = templateEmailsService(option, template);
          return emailsService(templateEmail);
        });
      })
    });
  });
};

reinviteDeleteUser = function (data,id) {
  var $Users = API.Model(Users);
  var $Teams = API.Model(Teams);
  var user = data[0];
  return TokenAuths.generateToken({
    user_id: user.id,
    client_id: user.client_id
  }).then(function (token) {
    return $Teams.findOne({client_id: user.client_id}).then(function (team) {
      var passHash = bcrypt.hashSync(user.email, bcrypt.genSaltSync(10)).substring(0, 10);
      var passUpdate = bcrypt.hashSync(passHash, bcrypt.genSaltSync(10));
      return $Users.update({id: user.id}, {password: passUpdate, isDelete: false}).then(function (users) {
        var user = users[0];
        NewsFeedsService.createNewsfeedByBot({
          createUser: id,
          subject:user.id,
          team: team.id,
          typeNewsfeed: 3
        });
        var option = {
          message: "Welcome to " + team.subDomain + ": " + _.split(user.email, "@")[0] + " !",
          verifyURL: "//" + team.subDomain + "." + domain + "/login/?email=" + user.email + "&accessToken=" + token.accessToken,
          email: user.email,
          password: passHash,
          domainLink: "//" + team.subDomain + "." + domain + "/"
        };
        var templateEmail = templateEmailsService(option, 'signUp');
        emailsService(templateEmail);
        return {
          status: httpCode.OK,
          id: user.id,
          avatar: user.avatar,
          fullName: user.personalInfo.fullName ? user.personalInfo.fullName : user.email,
          email: user.email,
          activeDate: user.activeDate,
          role: user.teamRole.typeUsers
        }
      });
    })
  });
};

module.exports = {
  registerUser: function (data, context) {
    if (data.listEmail.length > 0) {
      return Teams.findOne({client_id: context.identity.client_id})
        .populate('members')
        .then(function (team) {
        var members = team.members;
        var promises = data.listEmail
          .map(function (element, index, array) {
          var existedMember = members.filter(function (user) {
            return user.email === element
          });
          if (existedMember.length > 0 && existedMember[0].activeDate === null && existedMember[0].isDelete === false) {
            resentEmailInvite(existedMember, 'signUp',context.identity.id);
          } else if (existedMember.length > 0 && existedMember[0].isDelete === true) {
            return reinviteDeleteUser(existedMember,context.identity.id);
          } else if (existedMember.length === 0) {
            if(validator.isEmail(element)){
              var passHash = bcrypt.hashSync(element, bcrypt.genSaltSync(10)).substring(0, 10);
              if (data.message) {
                return userAutoRegister({
                  email: element,
                  message: data.message,
                  password: passHash,
                  client_id: context.identity.client_id,
                  inviter: context.identity.id
                }, {id: "", type: ""})
              } else {
                return userAutoRegister({email: element, password: passHash, client_id: context.identity.client_id, inviter: context.identity.id}, {
                  id: "",
                  type: ""
                })
              }
            }
          }
        })
          .filter(function (r) {
          return r;
        });
        return Promise.all(promises);
      })
        .then(function (userList) {
        if (userList.length > 0) {
          return {
            status: httpCode.OK,
            list: userList
          }
        }
        return {
          status: httpCode.OK
        }
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Missing list email'
      }
    }
  },
  registerUserByInviteLink: function (data) {
    if (data && data.email && data.password && data.inviteJoinTeamCode) {
      return RegisterUrl.findOne({code: data.inviteJoinTeamCode}).then(function (registerUrl) {
        return Teams.findOne({id: registerUrl.team}).populate('members').then(function (team) {
          var members = team.members;
          var isMemberExist = members.filter(function (o) {
            if (o.email === data.email) {
              return o;
            }
          });
          if (isMemberExist.length > 0 && isMemberExist[0].activeDate === null && isMemberExist[0].isDelete === false) {
            resentEmailInvite(isMemberExist, 'signUp',1);
          } else if (isMemberExist.length > 0 && isMemberExist[0].isDelete === true) {
            return reinviteDeleteUser(isMemberExist);
          }else if (isMemberExist.length > 0 && isMemberExist[0].activeDate){
            return {
              status: httpCode.CONFLICT,
              message: "Email already exists"
            };
          } else if (isMemberExist.length === 0) {
            var avatar = imageService.createRandomImage({
              hash: bcrypt.hashSync(data.email, bcrypt.genSaltSync(10))
            });
            hashPassword = bcrypt.hashSync(data.password, bcrypt.genSaltSync(10))
            var date = new Date();
            return API.Model(Users).create({
              email: data.email,
              password: hashPassword,
              inviteDate: date,
              client_id: team.client_id,
              personalInfo: {
                fullName: data.email,
                graduate: '',
                experiment: '',
                mobile: '',
                address: '',
                day_Of_Birth: '',
                gender: ''
              },
              isDelete: false,
              avatar: avatar.url
            }).then(function (user) {
              team.members.add(user.id);
              team.save();
              return TokenAuths.generateToken({
                userId: user.id,
                client_id: team.client_id
              }).then(function (token) {
                return {
                  status: httpCode.OK,
                  accessToken: token.accessToken,
                  email: data.email
                };
              })
            });
          }
        });
      });
    }
    return {
      status: httpCode.BAD_REQUEST,
      message: 'Missing params'
    }
  },
  verifyUser: function (data) {
    if(data && data.email && data.accessToken){
      return TokenAuths.authenticate({
        accessToken: data.accessToken,
        type: 'verification',
        email: data.email
      }).then(function (info) {
        var date = new Date();
        if (!info) return Promise.reject('Unauthorized');
        if (!info.identity.activeDate) {
          return Teams.findOne({client_id: info.identity.client_id, isDelete: false}).populate('members').then(function (team) {
            var user = _.find(team.members, {email: info.identity.email}),
            tada= _.filter(team.members,{email: 'tadaa@perkfec.com'});
            return API.Model(Users).update({id: user.id}, {activeDate: date}).then(function (){
              NewsFeedsService.createNewsfeedByBot({
                createUser: tada[0].id,
                subject:info.identity.id,
                team: team.id,
                typeNewsfeed: 1
              });
              return {
                status: httpCode.OK,
                verified: true,
                email: info.identity.email,
                token: data.accessToken
              }
            });
          });
        }
        return {
          status: httpCode.OK,
          verified: true,
          email: info.identity.email,
          token: data.accessToken
        }
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Missing data for verify user"
      }
    }
  },
  registerTeam: function (data, context) {
    var date = new Date();
    var avatar = imageService.createRandomImage({
      hash: bcrypt.hashSync(data.email, bcrypt.genSaltSync(10))
    });
    if(data && data.teamName && data.subDomain && data.email){
      return API.Model(Teams).create({
        client_id: TokenAuths.generateTokenString(),
        client_sercret: TokenAuths.generateTokenString(),
        teamName: data.teamName,
        subDomain: data.subDomain,
        dateRegistered: date,
        dateVerified: date
      })
        .then(function (team, error) {
          var firstName = data.firstName,
            lastName = data.lastName;
          var $SurveyCollections = API.Model(SurveyCollections),
            $Surveys = API.Model(Surveys);
          $Surveys.find({typeSurvey: "presetSurvey", receiverTeam: null}).then(function (surveys) {
            var surveyMap = _.map(surveys, function (survey) {
              var surveyOmit = _.omit(survey,["id"]);
              surveyOmit.receiverTeam = team.id;
              return surveyOmit;
            });
            $Surveys.create(surveyMap).then(function (surveys) {
              var surveyIds = _.map(surveys, function (survey) {
                return survey.id;
              });
              $SurveyCollections.create({team: team.id}).then(function (surveyCollection) {
                surveyCollection.surveys.add(surveyIds);
                surveyCollection.save();
              });
            });
          });
          return API.Model(Users).create({
            email: data.email,
            password: data.password,
            personalInfo: data.personalInfo,
            firstName: firstName,
            lastName: lastName,
            avatar: avatar.url,
            teamRole: 3,
            client_id: team.client_id,
            inviteDate: date,
            activeDate: date
          });
        }).then(function (user) {
          Teams.findOne({client_id: user.client_id}).exec(function (err, team) {
            if (err) {
              console.log(err);
            }
            API.Model(NewsFeeds).create({createUser: 1,subject: user.id,typeNewsfeed:1, team: team.id}).then(function (newfeeds) {
            });
            team.members.add(user.id);
            team.save(function (err) {
            });
            Users.findOne({email: 'tadaa@perkfec.com'}).then(function (user) {
              if (user) {
                team.members.add(user.id);
                team.save(function (err) {
                });
              }
            });
          });
          context.id = user.client_id;
          context.type = 'Team ID';
          return TokenAuths.generateToken({
            client_id: user.client_id,
            userId: user.id
          });
        }).then(function (token) {
          if (data.listEmail.length > 0) {
            data.listEmail.forEach(function (element, index, array) {
              Teams.findOne({client_id: token.client_id}).populate('members').then(function (team) {
                var members = team.members.filter(function (member) {
                  if (member.email === element) {
                    return member;
                  }
                });
                if (members.length > 0) {
                  resentEmailInvite(members[0], 'signUp');
                } else {
                  var passHash = bcrypt.hashSync(element, bcrypt.genSaltSync(10)).substring(0, 10);
                  userAutoRegister({email: element, password: passHash, client_id: token.client_id, inviter:token.userId}, {id: "", type: ""});
                }
              });
            });
          }
          return {
            status: httpCode.OK,
            accessToken: token.accessToken,
            email: data.email
          };
        });
    }
    else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Missing data for register team"
      }
    }

  },
  forgotPassword: function (data) {
    var $ForgotPasswordToken = API.Model(ForgotPasswordToken),
      $Teams = API.Model(Teams);
    if (data.subDomain && data.email) {
      return Teams.findOne({subDomain: data.subDomain})
        .populate('members')
        .then(function (team) {
        if (team) {
          var userForgot = _.filter(team.members,function (member) {
            return member.email === data.email;
          });
          if(userForgot.length > 0) {
            var now = new Date();
            now.setTime(now.getTime() + sails.config.security.urlToken.expiration * 1000 + 999);
            return API.Model(ForgotPasswordToken).create({
              user: userForgot[0].id,
              expireTime: now
            }).then(function (token) {
              var option = {
                verifyURL: "//"+team.subDomain+".perkfec.com/forgotpassword/setnew?token="+ token.code,
                email: userForgot[0].email
              };
              var templateEmail = templateEmailsService(option, "forgotPassword");
              emailsService(templateEmail);
              return {
                status: httpCode.OK,
                forgotToken: token.code
              };
            })
          } else {
            return {
              status: httpCode.NOT_FOUND,
              message: "This user doesn't exist in company"
            };
          }
        } else {
          return {
            status: httpCode.NOT_FOUND,
            message: "This company doesn't exist"
          };
        }
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Request is missing domain name and email user"
      }
    }
  },
  changePasswordInForgot: function (data) {
    if(data && data.forgotToken && data.password) {
      var $TokenAuths = API.Model(TokenAuths);
      var $ForgotPasswordToken = API.Model(ForgotPasswordToken);
      var $Users = API.Model(Users);
      return $ForgotPasswordToken.update({ code: data.forgotToken },{isDelete: true})
        .then(function (forgotPassword) {
          if (forgotPassword.length > 0) {
            if(moment(forgotPassword[0].expireTime).isAfter(moment())){
              return $Users.update({ id:forgotPassword[0].user }, {password: data.password}).then(function (user) {
                return $TokenAuths.destroy({userId: user[0].id}).then(function () {
                  return TokenAuths.generateToken({
                    userId: user[0].id,
                    client_id: user[0].client_id
                  }).then(function (token) {
                    var option = {
                      email: user[0].email
                    };
                    var templateEmail = templateEmailsService(option, "forgotPasswordSuccess");
                    emailsService(templateEmail);
                    return {
                      status: httpCode.OK,
                      token: token.accessToken
                    }
                  })
                })
              })
            } else {
              return {
                status: httpCode.NOT_FOUND,
                message:"forgotpass code is expired"
              }
            }
          } else {
            return {
              status: httpCode.NOT_FOUND,
              message:"forgotpass code is not found"
            }
          }
        });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: 'Request is missing data or data survey code'
      }
    }
  }
};
