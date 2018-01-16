window.$ = window.jQuery = require("jquery");
require("bootstrap");
require("bootstrap-3-typeahead");
require("moment");
require("./lib/bootstrap-datetimepicker.js");
require("./lib/jquery.timepicker.js");
require("./lib/jquery.datepair.js");

$(document).ready(() => {
  $("#name").typeahead({
    source: [user.profile.name],
    autoSelect: true,
    autocomplete: false
  });
  console.log(user.profile.name);
  // Place JavaScript code here...
});

$( ".pop-people" ).click(function() {
  $("#name").val(this.innerText);
});
//
$(function () {
  var bindDatePicker = function() {
   $("#datetimepicker1 .date").datetimepicker({
       format:'YYYY-MM-DD',
     icons: {
       time: "fa fa-clock-o",
       date: "fa fa-calendar",
       up: "fa fa-arrow-up",
       down: "fa fa-arrow-down"
     }
   }).find('input:first').on("blur",function () {
     // check if the date is correct. We can accept dd-mm-yyyy and yyyy-mm-dd.
     // update the format if it's yyyy-mm-dd
     var date = parseDate($(this).val());

     if (! isValidDate(date)) {
       //create date based on momentjs (we have that)
       date = moment().format('YYYY-MM-DD');
     }

     $(this).val(date);
   });
 }

  var isValidDate = function(value, format) {
   format = format || false;
   // lets parse the date to the best of our knowledge
   if (format) {
     value = parseDate(value);
   }

   var timestamp = Date.parse(value);

   return isNaN(timestamp) == false;
  }

  var parseDate = function(value) {
   var m = value.match(/^(\d{1,2})(\/|-)?(\d{1,2})(\/|-)?(\d{4})$/);
   if (m)
     value = m[5] + '-' + ("00" + m[3]).slice(-2) + '-' + ("00" + m[1]).slice(-2);

   return value;
  }

  bindDatePicker();

  $('#datetimepicker1 .time').timepicker({
      'showDuration': true,
      'timeFormat': 'g:ia'
  });
});
