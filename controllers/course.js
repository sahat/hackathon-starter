var secrets = require('../config/secrets');
var Course = require('../models/Course');

exports.create = function(req, res) {

  var not_blank = ["class_name", "classification", "college", "course_name", "is_open", "loc_code"];
  for (var i = 0; i < not_blank.length; i++) {
    req.assert(not_blank[i], not_blank[i]+' cannot be blank').notEmpty();
  }
  req.assert('secret', 'Secret does not match').equals(secrets.sessionSecret);

  var errors = req.validationErrors();
  if (errors) {
    return errors;
  } else {
    var course = new Course({
      class_name: req.body.class_name,
      classification: req.body.classification,
      college: req.body.college,
      component: req.body.component,
      course_name: req.body.course_name,
      description: req.body.description,
      grading: req.body.grading,
      instructor: req.body.instructor
      is_open: req.body.is_open,
      level: req.body.level,
      loc_code: req.body.loc_code,
      meet_data: req.body.meet_data,
      notes: req.body.notes,
      number: req.body.number,
      section: req.body.section,
      session: req.body.session,
    });

    Course.findOne({class_name: req.body.class_name, section: req.body.section}, function(err, existingCourse) {
      if (existingCourse) {
        return 'Course with that class_name and section already exists.';
      } else if (err) {
        return err;
      } else {
        course.save(function(err) {
          if (err) {
            return next(err);
          }
        });
        return 'Course created successfuly.';
      }
    });
  }
};