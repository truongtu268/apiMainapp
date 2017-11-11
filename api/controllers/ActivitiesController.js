/**
 * Created by MyPC on 7/5/2017.
 */
module.exports = {
  create_comment_public_issue: function(req,res){
    API(ActivitiesService.createCommentPublicIssue,req,res);
  },
  update_comment_public_issue: function (req, res) {
    API(ActivitiesService.updateCommentPublicIssue,req,res);
  },
  get_all_activities_public_issue_by_type: function (req, res) {
    API(ActivitiesService.getAllActivitiesPublicIssueByType,req,res);
  },
  delete_comment_public_issue: function (req, res) {
    API(ActivitiesService.deleteCommentPublicIssue,req,res);
  },
  create_vote_public_issue: function(req,res){
    API(ActivitiesService.createVotePublicIssue,req,res);
  },
  update_state_public_issue: function (req, res) {
    API(ActivitiesService.updateStatePublicIssue,req,res);
  },
  update_content_public_issue: function (req, res) {
    API(ActivitiesService.updateContentPublicIssue,req,res);
  }
};
