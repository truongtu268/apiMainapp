/**
 * Created by truongtu on 5/4/2017.
 */
var Promise = require('bluebird'),
  promisify = Promise.promisify,
  bcrypt = require('bcrypt-nodejs'),
  randToken = require('rand-token'),
  _ = require('lodash'),
  httpCode = require('http-codes');

function mapUserToMember(user) {
  return {
    id: user.id,
    avatar: user.avatar,
    fullName: user.firstName ? user.firstName : user.email,
    email: user.email,
    activeDate: user.activeDate,
    code: user.code,
    role: user.teamRole.typeUsers
  }
}

module.exports = {
  getCurrentUser: function (data, context) {
    if (!context) {
      return {
        status: httpCode.NOT_FOUND,
        message: "This employee doesn't exist"
      }
    }
    var identity = context.identity;
    return Users.findOne({id: identity.id}).populate('teamRole').then(function (user) {
      user.role = user.teamRole.typeUsers;
      return user;
    });
  },
  editCurrentUser: function (data, context) {
    var $Users = API.Model(Users);
    if (data) {
      data.teamRole = data.teamRole.id;
      return $Users.update({id: context.identity.id}, data).then(function (user) {
        return {
          status: httpCode.OK,
          message: "Update user success"
        };
      });
    } else {
      return {
        status: httpCode.BAD_REQUEST,
        message: "Missing data user"
      };
    }
  },
  changepassword: function (data, context) {
    var $Users = API.Model(Users);
    return $Users.findOne({id: context.identity.id}).then(function (user) {
      return Users.authenticate(user.email, data.oldPassword, context.identity.client_id).then(function (user) {
        if (user !== null) {
          var password = bcrypt.hashSync(data.newPassword, bcrypt.genSaltSync(10));
          return $Users.update({id: user.id}, {password: password}).then(function (user) {
            return {
              status: httpCode.OK,
              message: "Change password success"
            };
          });
        } else {
          return {
            status: httpCode.UNAUTHORIZED,
            message: "Old pass is wrong"
          };
        }
      });
    });
  },
  getListUserByCompany: function (data, context) {
    if (!context) {
      return {
        status: httpCode.NOT_FOUND,
        message: "This employee doesn't exist"
      }
    }
    return Teams.findOne({
      client_id: context.identity.client_id,
      isDelete: false
    }).populate('members').then(function (data) {
      if (!data) {
        return {
          status: httpCode.NOT_FOUND,
          message: "This company doesn't exist"
        }
      }
      var members = data.members.map(function (member) {
        return member.id;
      });
      return Users.find({id: members, isDelete: false}).populate('teamRole').then(function (membersSent) {
        var memberMaps = membersSent.map(function (mem) {
          return mapUserToMember(mem)
        });
        return {
          status: httpCode.OK,
          list: memberMaps
        }
      });
    });
  },
  getUserByCode: function (data, context) {
    if (data.code) {
      return Teams.findOne({
        client_id: context.identity.client_id,
        isDelete: false
      }).populate('members').then(function (team) {
        if (team) {
          var member = _.filter(team.members, function (member) {
            if (member.code === data.code && !member.isDelete) {
              return member;
            }
          })[0];
          if (member) {
            return {
              status: httpCode.OK,
              data: member
            }
          } else {
            return {
              status: httpCode.NOT_FOUND,
              message: 'Not found this user'
            }
          }
        }
      });
    }
    return {
      status: httpCode.BAD_REQUEST,
      message: 'Missing id in request'
    }
  },
  deleteUser: function (data, context) {
    var $Users = API.Model(Users),
      $Teams = API.Model(Teams),
      $NewsFeeds = API.Model(NewsFeeds);
    if (data && data.id) {
      if (data.id == context.identity.id) {
        return {
          status: httpCode.METHOD_NOT_ALLOWED,
          message: 'Not delete yourself'
        };
      }
      if (context.identity.teamRole === 3) {
        return Users.findOne({id: data.id, isDelete: false}).populate('teamRole').then(function (user) {
          if (user.teamRole.typeUsers === 'owner' || user.teamRole.typeUsers === 'chatbot') {
            return {
              status: httpCode.FORBIDDEN,
              message: "You don't have permission"
            };
          }
          API.Model(TokenAuths).destroy({userId: data.id}).then(function () {
          });
          return $Users.delete({id: data.id}, {activeDate: null}).then(function (user) {
            return $Teams.findOne({client_id: user[0].client_id}).then(function (team) {
              NewsFeedsService.createNewsfeedByBot({
                createUser: context.identity.id,
                subject: user[0].id,
                team: team.id,
                typeNewsfeed: 2
              });
              return {
                status: httpCode.OK,
                message: 'Delete user success',
                data: user
              }
            });
          });
        })
      } else {
        return Users.findOne({id: data.id}).populate('teamRole').then(function (user) {
          if (user.teamRole.typeUsers === 'owner' || user.teamRole.typeUsers === 'chatbot' || user.teamRole.typeUsers === 'admin') {
            return {
              status: httpCode.FORBIDDEN,
              message: "You don't have permission"
            };
          }
          API.Model(TokenAuths).destroy({userId: data.id}).then(function () {
          });

          return $Users.delete({id: data.id}, {activeDate: null}).then(function (user) {
            return $Teams.findOne({client_id: user[0].client_id}).then(function (team) {
              return $NewsFeeds.create({createUser: user[0].id, typeNewsfeed: 2, team: team.id}).then(function () {
                return {
                  status: httpCode.OK,
                  message: 'Delete user success',
                  data: user
                }
              });
            });
          });
        })
      }
    }
    return {
      status: httpCode.BAD_REQUEST,
      message: "Request is missing data id"
    }
  },
  ////to do here
  upgradeUserToAdmin: function (data, context) {
    var $Users = API.Model(Users);
    return Teams.findOne({
      client_id: context.identity.client_id,
      isDelete: false
    }).populate('members').then(function (team) {
      if (data && data.id) {
        return $Users.update({id: data.id, isDelete: false}, {teamRole: 2}).then(function (user) {
          NewsFeedsService.createNewsfeedByBot({
            createUser: context.identity.id,
            subject: user[0].id,
            team: team.id,
            typeNewsfeed: 4
          });
          return Users.findOne({id: user[0].id, isDelete: false}).populate('teamRole').then(function (userFilter) {
            if (userFilter) {
              return {
                status: httpCode.NOT_FOUND,
                message: "User not exist in team"
              }
            } else {
              return {
                status: httpCode.OK,
                message: 'Update user admin success',
                data: mapUserToMember(userFilter)
              }
            }
          });
        })
      } else {
        return {
          status: httpCode.BAD_REQUEST,
          message: "Request is missing data id"
        }
      }
    });
  },
  upgradeUserToOwner: function (data, context) {
    return Teams.findOne({client_id: context.identity.client_id}).populate('members').then(function (team) {
      if (data && data.id) {
        return Users.update({id: data.id, isDelete: false}, {teamRole: 3}).then(function (user) {
          NewsFeedsService.createNewsfeedByBot({
            createUser: context.identity.id,
            subject: user[0].id,
            team: team.id,
            typeNewsfeed: 5
          });
          return Users.findOne({id: user[0].id, isDelete: false}).populate('teamRole').then(function (userFilter) {
            if (userFilter) {
              return {
                status: httpCode.NOT_FOUND,
                message: "User not exist in team"
              }
            } else {
              return {
                status: httpCode.OK,
                message: 'Update user owner success',
                data: mapUserToMember(userFilter)
              }
            }
          });
        });
      }
      return {
        status: httpCode.BAD_REQUEST,
        message: "Request is missing data id"
      }
    });
  },
  downGradeUser: function (data, context) {
    return Teams.findOne({client_id: context.identity.client_id}).populate('members').then(function (team) {
      if (data && data.id) {
        return Users.findOne({id: data.id, isDelete: false}).then(function (user) {
          if (user.client_id === team.client_id) {
            if(user.teamRole > 1) {
              var role = user.teamRole - 1;
              return Users.update({id: data.id}, {teamRole: role}).then(function (userUpdate) {
                return Users.findOne({id: userUpdate[0].id}).populate('teamRole').then(function (userReturn) {
                  return {
                    status: httpCode.OK,
                    message: 'DownGrade user success',
                    data: mapUserToMember(userReturn)
                  }
                })
              })
            } else {
              return {
                status: httpCode.NOT_MODIFIED,
                message: "User isn't downgrade"
              }
            }
          } else {
            return {
              status: httpCode.NOT_FOUND,
              message: "User not exist in team"
            }

          }
        });
      }
      return {
        status: httpCode.BAD_REQUEST,
        message: "Request is missing data id"
      }
    });
  },
  createRegisterUrl: function (data) {
    var $RegisterUrl = API.Model(RegisterUrl),
      $Teams = API.Model(Teams);
    if (data && data.subDomain) {
      return $Teams.findOne({subDomain: data.subDomain}).then(function (team) {
        if (team) {
          return $RegisterUrl.findOne({team: team.id}).then(function (registerUrl) {
            var now = new Date();
            now.setHours(0, 0, 0, 0);
            if (!registerUrl || (registerUrl.expireTime && new Date() > registerUrl.expireTime)) {
              now.setTime(now.getTime() + sails.config.security.urlToken.expiration * 1000 + 999);
              return $RegisterUrl.create({team: team.id, expireTime: now}).then(function (registerUrl) {
                return registerUrl;
              });
            }
            return {
              status: httpCode.OK,
              data: registerUrl
            };
          });
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
        message: "Request is missing domain name"
      }
    }
  },
  verifyRegisterUrl: function (data) {
    var $RegisterUrl = API.Model(RegisterUrl);
    if (data.code) {
      return $RegisterUrl.findOne({code: data.code}).then(function (registerUrl) {
        if (registerUrl) {
          return {
            status: httpCode.OK,
            data: registerUrl
          };
        } else {
          return {
            status: httpCode.NOT_FOUND,
            message: "This feedback link doesn't exist or expired"
          }
        }
      });
    }
    return {
      status: httpCode.BAD_REQUEST,
      message: "Request is missing url verification"
    }
  }
};
