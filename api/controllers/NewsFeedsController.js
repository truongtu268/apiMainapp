/**
 * Created by MyPC on 7/13/2017.
 */
module.exports = {
  create_newsfeed_type: function(req,res) {
    API(NewsFeedsService.createNewsfeedType, req, res);
  },
  create_newsfeed: function (req, res) {
    API(NewsFeedsService.createNewsfeed, req, res);
  },
  get_all_newsfeedtype: function (req, res) {
    API(NewsFeedsService.getAllNewsfeedType, req, res);
  },
  get_all_newsfeed: function (req, res) {
    API(NewsFeedsService.getAllNewsfeedByCompany, req, res);
  }
};
