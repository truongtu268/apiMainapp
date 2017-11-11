module.exports = {
  check_schedule: function (req, res) {
    API(ScheduleService.checkSchedule,req,res);
  }
};
