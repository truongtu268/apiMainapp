/**
 * Created by MyPC on 7/12/2017.
 */
module.exports = {
  get_all_compentencies: function(req,res){
    API(CompentenciesService.getAllcompetencies,req,res);
  }
};
