/*!
 * jquery-timepicker v1.11.13 - A jQuery timepicker plugin inspired by Google Calendar. It supports both mouse and keyboard navigation.
 * Copyright (c) 2015 Jon Thornton - http://jonthornton.github.com/jquery-timepicker/
 * License: MIT
 */

(function(factory) {
  if (
    typeof exports === "object" &&
    exports &&
    typeof module === "object" &&
    module &&
    module.exports === exports
  ) {
    // Browserify. Attach to jQuery module.
    factory(require("jquery"));
  } else if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(["jquery"], factory);
  } else {
    // Browser globals
    factory(jQuery);
  }
})(function($) {
  var _ONE_DAY = 86400;
  var _lang = {
    am: "am",
    pm: "pm",
    AM: "AM",
    PM: "PM",
    decimal: ".",
    mins: "mins",
    hr: "hr",
    hrs: "hrs"
  };

  var _DEFAULTS = {
    appendTo: "body",
    className: null,
    closeOnWindowScroll: false,
    disableTextInput: false,
    disableTimeRanges: [],
    disableTouchKeyboard: false,
    durationTime: null,
    forceRoundTime: false,
    maxTime: null,
    minTime: null,
    noneOption: false,
    orientation: "l",
    roundingFunction: function(seconds, settings) {
      if (seconds === null) {
        return null;
      } else if (typeof settings.step !== "number") {
        // TODO: nearest fit irregular steps
        return seconds;
      } else {
        var offset = seconds % (settings.step * 60); // step is in minutes

        var start = settings.minTime || 0;

        // adjust offset by start mod step so that the offset is aligned not to 00:00 but to the start
        offset -= start % (settings.step * 60);

        if (offset >= settings.step * 30) {
          // if offset is larger than a half step, round up
          seconds += settings.step * 60 - offset;
        } else {
          // round down
          seconds -= offset;
        }

        return _moduloSeconds(seconds, settings);
      }
    },
    scrollDefault: null,
    selectOnBlur: false,
    show2400: false,
    showDuration: false,
    showOn: ["click", "focus"],
    showOnFocus: true,
    step: 30,
    stopScrollPropagation: false,
    timeFormat: "g:ia",
    typeaheadHighlight: true,
    useSelect: false,
    wrapHours: true
  };

  var methods = {
    init: function(options) {
      return this.each(function() {
        var self = $(this);

        // pick up settings from data attributes
        var attributeOptions = [];
        for (var key in _DEFAULTS) {
          if (self.data(key)) {
            attributeOptions[key] = self.data(key);
          }
        }

        var settings = $.extend({}, _DEFAULTS, options, attributeOptions);

        if (settings.lang) {
          _lang = $.extend(_lang, settings.lang);
        }

        settings = _parseSettings(settings);
        self.data("timepicker-settings", settings);
        self.addClass("ui-timepicker-input");

        if (settings.useSelect) {
          _render(self);
        } else {
          self.prop("autocomplete", "off");
          if (settings.showOn) {
            for (var i in settings.showOn) {
              self.on(settings.showOn[i] + ".timepicker", methods.show);
            }
          }
          self.on("change.timepicker", _formatValue);
          self.on("keydown.timepicker", _keydownhandler);
          self.on("keyup.timepicker", _keyuphandler);
          if (settings.disableTextInput) {
            self.on("keydown.timepicker", _disableTextInputHandler);
          }
          self.on("cut.timepicker", _keyuphandler);
          self.on("paste.timepicker", _keyuphandler);

          _formatValue.call(self.get(0), null, "initial");
        }
      });
    },

    show: function(e) {
      var self = $(this);
      var settings = self.data("timepicker-settings");

      if (e) {
        e.preventDefault();
      }

      if (settings.useSelect) {
        self.data("timepicker-list").focus();
        return;
      }

      if (_hideKeyboard(self)) {
        // block the keyboard on mobile devices
        self.blur();
      }

      var list = self.data("timepicker-list");

      // check if input is readonly
      if (self.prop("readonly")) {
        return;
      }

      // check if list needs to be rendered
      if (
        !list ||
        list.length === 0 ||
        typeof settings.durationTime === "function"
      ) {
        _render(self);
        list = self.data("timepicker-list");
      }

      if (_isVisible(list)) {
        return;
      }

      self.data("ui-timepicker-value", self.val());
      _setSelected(self, list);

      // make sure other pickers are hidden
      methods.hide();

      // position the dropdown relative to the input
      list.show();
      var listOffset = {};

      if (settings.orientation.match(/r/)) {
        // right-align the dropdown
        listOffset.left =
          self.offset().left +
          self.outerWidth() -
          list.outerWidth() +
          parseInt(list.css("marginLeft").replace("px", ""), 10);
      } else {
        // left-align the dropdown
        listOffset.left =
          self.offset().left +
          parseInt(list.css("marginLeft").replace("px", ""), 10);
      }

      var verticalOrientation;
      if (settings.orientation.match(/t/)) {
        verticalOrientation = "t";
      } else if (settings.orientation.match(/b/)) {
        verticalOrientation = "b";
      } else if (
        self.offset().top + self.outerHeight(true) + list.outerHeight() >
        $(window).height() + $(window).scrollTop()
      ) {
        verticalOrientation = "t";
      } else {
        verticalOrientation = "b";
      }

      if (verticalOrientation == "t") {
        // position the dropdown on top
        list.addClass("ui-timepicker-positioned-top");
        listOffset.top =
          self.offset().top -
          list.outerHeight() +
          parseInt(list.css("marginTop").replace("px", ""), 10);
      } else {
        // put it under the input
        list.removeClass("ui-timepicker-positioned-top");
        listOffset.top =
          self.offset().top +
          self.outerHeight() +
          parseInt(list.css("marginTop").replace("px", ""), 10);
      }

      list.offset(listOffset);

      // position scrolling
      var selected = list.find(".ui-timepicker-selected");

      if (!selected.length) {
        var timeInt = _time2int(_getTimeValue(self));
        if (timeInt !== null) {
          selected = _findRow(self, list, timeInt);
        } else if (settings.scrollDefault) {
          selected = _findRow(self, list, settings.scrollDefault());
        }
      }

      // if not found or disabled, intelligently find first selectable element
      if (!selected.length || selected.hasClass("ui-timepicker-disabled")) {
        selected = list.find("li:not(.ui-timepicker-disabled):first");
      }

      if (selected && selected.length) {
        var topOffset =
          list.scrollTop() + selected.position().top - selected.outerHeight();
        list.scrollTop(topOffset);
      } else {
        list.scrollTop(0);
      }

      // prevent scroll propagation
      if (settings.stopScrollPropagation) {
        $(
          document
        ).on("wheel.ui-timepicker", ".ui-timepicker-wrapper", function(e) {
          e.preventDefault();
          var currentScroll = $(this).scrollTop();
          $(this).scrollTop(currentScroll + e.originalEvent.deltaY);
        });
      }

      // attach close handlers
      $(document).on(
        "touchstart.ui-timepicker mousedown.ui-timepicker",
        _closeHandler
      );
      $(window).on("resize.ui-timepicker", _closeHandler);
      if (settings.closeOnWindowScroll) {
        $(document).on("scroll.ui-timepicker", _closeHandler);
      }

      self.trigger("showTimepicker");

      return this;
    },

    hide: function(e) {
      var self = $(this);
      var settings = self.data("timepicker-settings");

      if (settings && settings.useSelect) {
        self.blur();
      }

      $(".ui-timepicker-wrapper").each(function() {
        var list = $(this);
        if (!_isVisible(list)) {
          return;
        }

        var self = list.data("timepicker-input");
        var settings = self.data("timepicker-settings");

        if (settings && settings.selectOnBlur) {
          _selectValue(self);
        }

        list.hide();
        self.trigger("hideTimepicker");
      });

      return this;
    },

    option: function(key, value) {
      if (typeof key == "string" && typeof value == "undefined") {
        return $(this).data("timepicker-settings")[key];
      }

      return this.each(function() {
        var self = $(this);
        var settings = self.data("timepicker-settings");
        var list = self.data("timepicker-list");

        if (typeof key == "object") {
          settings = $.extend(settings, key);
        } else if (typeof key == "string") {
          settings[key] = value;
        }

        settings = _parseSettings(settings);

        self.data("timepicker-settings", settings);

        _formatValue.call(self.get(0), { type: "change" }, "initial");

        if (list) {
          list.remove();
          self.data("timepicker-list", false);
        }

        if (settings.useSelect) {
          _render(self);
        }
      });
    },

    getSecondsFromMidnight: function() {
      return _time2int(_getTimeValue(this));
    },

    getTime: function(relative_date) {
      var self = this;

      var time_string = _getTimeValue(self);
      if (!time_string) {
        return null;
      }

      var offset = _time2int(time_string);
      if (offset === null) {
        return null;
      }

      if (!relative_date) {
        relative_date = new Date();
      }

      // construct a Date from relative date, and offset's time
      var time = new Date(relative_date);
      time.setHours(offset / 3600);
      time.setMinutes((offset % 3600) / 60);
      time.setSeconds(offset % 60);
      time.setMilliseconds(0);

      return time;
    },

    isVisible: function() {
      var self = this;
      var list = self.data("timepicker-list");
      return !!(list && _isVisible(list));
    },

    setTime: function(value) {
      var self = this;
      var settings = self.data("timepicker-settings");

      if (settings.forceRoundTime) {
        var prettyTime = _roundAndFormatTime(_time2int(value), settings);
      } else {
        var prettyTime = _int2time(_time2int(value), settings);
      }

      if (value && prettyTime === null && settings.noneOption) {
        prettyTime = value;
      }

      _setTimeValue(self, prettyTime, "initial");
      _formatValue.call(self.get(0), { type: "change" }, "initial");

      if (self.data("timepicker-list")) {
        _setSelected(self, self.data("timepicker-list"));
      }

      return this;
    },

    remove: function() {
      var self = this;

      // check if this element is a timepicker
      if (!self.hasClass("ui-timepicker-input")) {
        return;
      }

      var settings = self.data("timepicker-settings");
      self.removeAttr("autocomplete", "off");
      self.removeClass("ui-timepicker-input");
      self.removeData("timepicker-settings");
      self.off(".timepicker");

      // timepicker-list won't be present unless the user has interacted with this timepicker
      if (self.data("timepicker-list")) {
        self.data("timepicker-list").remove();
      }

      if (settings.useSelect) {
        self.show();
      }

      self.removeData("timepicker-list");

      return this;
    }
  };

  // private methods

  function _isVisible(elem) {
    var el = elem[0];
    return el.offsetWidth > 0 && el.offsetHeight > 0;
  }

  function _parseSettings(settings) {
    if (settings.minTime) {
      settings.minTime = _time2int(settings.minTime);
    }

    if (settings.maxTime) {
      settings.maxTime = _time2int(settings.maxTime);
    }

    if (settings.durationTime && typeof settings.durationTime !== "function") {
      settings.durationTime = _time2int(settings.durationTime);
    }

    if (settings.scrollDefault == "now") {
      settings.scrollDefault = function() {
        return settings.roundingFunction(_time2int(new Date()), settings);
      };
    } else if (
      settings.scrollDefault &&
      typeof settings.scrollDefault != "function"
    ) {
      var val = settings.scrollDefault;
      settings.scrollDefault = function() {
        return settings.roundingFunction(_time2int(val), settings);
      };
    } else if (settings.minTime) {
      settings.scrollDefault = function() {
        return settings.roundingFunction(settings.minTime, settings);
      };
    }

    if (
      $.type(settings.timeFormat) === "string" &&
      settings.timeFormat.match(/[gh]/)
    ) {
      settings._twelveHourTime = true;
    }

    if (
      settings.showOnFocus === false &&
      settings.showOn.indexOf("focus") != -1
    ) {
      settings.showOn.splice(settings.showOn.indexOf("focus"), 1);
    }

    if (settings.disableTimeRanges.length > 0) {
      // convert string times to integers
      for (var i in settings.disableTimeRanges) {
        settings.disableTimeRanges[i] = [
          _time2int(settings.disableTimeRanges[i][0]),
          _time2int(settings.disableTimeRanges[i][1])
        ];
      }

      // sort by starting time
      settings.disableTimeRanges = settings.disableTimeRanges.sort(function(
        a,
        b
      ) {
        return a[0] - b[0];
      });

      // merge any overlapping ranges
      for (var i = settings.disableTimeRanges.length - 1; i > 0; i--) {
        if (
          settings.disableTimeRanges[i][0] <=
          settings.disableTimeRanges[i - 1][1]
        ) {
          settings.disableTimeRanges[i - 1] = [
            Math.min(
              settings.disableTimeRanges[i][0],
              settings.disableTimeRanges[i - 1][0]
            ),
            Math.max(
              settings.disableTimeRanges[i][1],
              settings.disableTimeRanges[i - 1][1]
            )
          ];
          settings.disableTimeRanges.splice(i, 1);
        }
      }
    }

    return settings;
  }

  function _render(self) {
    var settings = self.data("timepicker-settings");
    var list = self.data("timepicker-list");

    if (list && list.length) {
      list.remove();
      self.data("timepicker-list", false);
    }

    if (settings.useSelect) {
      list = $("<select />", { class: "ui-timepicker-select" });
      var wrapped_list = list;
    } else {
      list = $("<ul />", { class: "ui-timepicker-list" });

      var wrapped_list = $("<div />", {
        class: "ui-timepicker-wrapper",
        tabindex: -1
      });
      wrapped_list.css({ display: "none", position: "absolute" }).append(list);
    }

    if (settings.noneOption) {
      if (settings.noneOption === true) {
        settings.noneOption = settings.useSelect ? "Time..." : "None";
      }

      if ($.isArray(settings.noneOption)) {
        for (var i in settings.noneOption) {
          if (parseInt(i, 10) == i) {
            var noneElement = _generateNoneElement(
              settings.noneOption[i],
              settings.useSelect
            );
            list.append(noneElement);
          }
        }
      } else {
        var noneElement = _generateNoneElement(
          settings.noneOption,
          settings.useSelect
        );
        list.append(noneElement);
      }
    }

    if (settings.className) {
      wrapped_list.addClass(settings.className);
    }

    if (
      (settings.minTime !== null || settings.durationTime !== null) &&
      settings.showDuration
    ) {
      var stepval =
        typeof settings.step == "function" ? "function" : settings.step;
      wrapped_list.addClass("ui-timepicker-with-duration");
      wrapped_list.addClass("ui-timepicker-step-" + settings.step);
    }

    var durStart = settings.minTime;
    if (typeof settings.durationTime === "function") {
      durStart = _time2int(settings.durationTime());
    } else if (settings.durationTime !== null) {
      durStart = settings.durationTime;
    }
    var start = settings.minTime !== null ? settings.minTime : 0;
    var end =
      settings.maxTime !== null ? settings.maxTime : start + _ONE_DAY - 1;

    if (end < start) {
      // make sure the end time is greater than start time, otherwise there will be no list to show
      end += _ONE_DAY;
    }

    if (
      end === _ONE_DAY - 1 &&
      $.type(settings.timeFormat) === "string" &&
      settings.show2400
    ) {
      // show a 24:00 option when using military time
      end = _ONE_DAY;
    }

    var dr = settings.disableTimeRanges;
    var drCur = 0;
    var drLen = dr.length;

    var stepFunc = settings.step;
    if (typeof stepFunc != "function") {
      stepFunc = function() {
        return settings.step;
      };
    }

    for (var i = start, j = 0; i <= end; j++, i += stepFunc(j) * 60) {
      var timeInt = i;
      var timeString = _int2time(timeInt, settings);

      if (settings.useSelect) {
        var row = $("<option />", { value: timeString });
        row.text(timeString);
      } else {
        var row = $("<li />");
        row.addClass(
          timeInt % _ONE_DAY < _ONE_DAY / 2
            ? "ui-timepicker-am"
            : "ui-timepicker-pm"
        );
        row.data("time", _moduloSeconds(timeInt, settings));
        row.text(timeString);
      }

      if (
        (settings.minTime !== null || settings.durationTime !== null) &&
        settings.showDuration
      ) {
        var durationString = _int2duration(i - durStart, settings.step);
        if (settings.useSelect) {
          row.text(row.text() + " (" + durationString + ")");
        } else {
          var duration = $("<span />", { class: "ui-timepicker-duration" });
          duration.text(" (" + durationString + ")");
          row.append(duration);
        }
      }

      if (drCur < drLen) {
        if (timeInt >= dr[drCur][1]) {
          drCur += 1;
        }

        if (dr[drCur] && timeInt >= dr[drCur][0] && timeInt < dr[drCur][1]) {
          if (settings.useSelect) {
            row.prop("disabled", true);
          } else {
            row.addClass("ui-timepicker-disabled");
          }
        }
      }

      list.append(row);
    }

    wrapped_list.data("timepicker-input", self);
    self.data("timepicker-list", wrapped_list);

    if (settings.useSelect) {
      if (self.val()) {
        list.val(_roundAndFormatTime(_time2int(self.val()), settings));
      }

      list.on("focus", function() {
        $(this)
          .data("timepicker-input")
          .trigger("showTimepicker");
      });
      list.on("blur", function() {
        $(this)
          .data("timepicker-input")
          .trigger("hideTimepicker");
      });
      list.on("change", function() {
        _setTimeValue(self, $(this).val(), "select");
      });

      _setTimeValue(self, list.val(), "initial");
      self.hide().after(list);
    } else {
      var appendTo = settings.appendTo;
      if (typeof appendTo === "string") {
        appendTo = $(appendTo);
      } else if (typeof appendTo === "function") {
        appendTo = appendTo(self);
      }
      appendTo.append(wrapped_list);
      _setSelected(self, list);

      list.on("mousedown click", "li", function(e) {
        // hack: temporarily disable the focus handler
        // to deal with the fact that IE fires 'focus'
        // events asynchronously
        self.off("focus.timepicker");
        self.on("focus.timepicker-ie-hack", function() {
          self.off("focus.timepicker-ie-hack");
          self.on("focus.timepicker", methods.show);
        });

        if (!_hideKeyboard(self)) {
          self[0].focus();
        }

        // make sure only the clicked row is selected
        list.find("li").removeClass("ui-timepicker-selected");
        $(this).addClass("ui-timepicker-selected");

        if (_selectValue(self)) {
          self.trigger("hideTimepicker");

          list.on("mouseup.timepicker click.timepicker", "li", function(e) {
            list.off("mouseup.timepicker click.timepicker");
            wrapped_list.hide();
          });
        }
      });
    }
  }

  function _generateNoneElement(optionValue, useSelect) {
    var label, className, value;

    if (typeof optionValue == "object") {
      label = optionValue.label;
      className = optionValue.className;
      value = optionValue.value;
    } else if (typeof optionValue == "string") {
      label = optionValue;
      value = '';
    } else {
      $.error("Invalid noneOption value");
    }

    if (useSelect) {
      return $("<option />", {
        value: value,
        class: className,
        text: label
      });
    } else {
      return $("<li />", {
        class: className,
        text: label
      }).data("time", String(value));
    }
  }

  function _roundAndFormatTime(seconds, settings) {
    seconds = settings.roundingFunction(seconds, settings);
    if (seconds !== null) {
      return _int2time(seconds, settings);
    }
  }

  // event handler to decide whether to close timepicker
  function _closeHandler(e) {
    if (e.target == window) {
      // mobile Chrome fires focus events against window for some reason
      return;
    }

    var target = $(e.target);

    if (
      target.closest(".ui-timepicker-input").length ||
      target.closest(".ui-timepicker-wrapper").length
    ) {
      // active timepicker was focused. ignore
      return;
    }

    methods.hide();
    $(document).unbind(".ui-timepicker");
    $(window).unbind(".ui-timepicker");
  }

  function _hideKeyboard(self) {
    var settings = self.data("timepicker-settings");
    return (
      (window.navigator.msMaxTouchPoints || "ontouchstart" in document) &&
      settings.disableTouchKeyboard
    );
  }

  function _findRow(self, list, value) {
    if (!value && value !== 0) {
      return false;
    }

    var settings = self.data("timepicker-settings");
    var out = false;
    var value = settings.roundingFunction(value, settings);

    // loop through the menu items
    list.find("li").each(function(i, obj) {
      var jObj = $(obj);
      if (typeof jObj.data("time") != "number") {
        return;
      }

      if (jObj.data("time") == value) {
        out = jObj;
        return false;
      }
    });

    return out;
  }

  function _setSelected(self, list) {
    list.find("li").removeClass("ui-timepicker-selected");

    var settings = self.data("timepicker-settings");
    var timeValue = _time2int(_getTimeValue(self), settings);
    if (timeValue === null) {
      return;
    }

    var selected = _findRow(self, list, timeValue);
    if (selected) {
      var topDelta = selected.offset().top - list.offset().top;

      if (
        topDelta + selected.outerHeight() > list.outerHeight() ||
        topDelta < 0
      ) {
        list.scrollTop(
          list.scrollTop() + selected.position().top - selected.outerHeight()
        );
      }

      if (settings.forceRoundTime || selected.data("time") === timeValue) {
        selected.addClass("ui-timepicker-selected");
      }
    }
  }

  function _formatValue(e, origin) {
    if (origin == "timepicker") {
      return;
    }

    var self = $(this);

    if (this.value === "") {
      _setTimeValue(self, null, origin);
      return;
    }

    if (self.is(":focus") && (!e || e.type != "change")) {
      return;
    }

    var settings = self.data("timepicker-settings");
    var seconds = _time2int(this.value, settings);

    if (seconds === null) {
      self.trigger("timeFormatError");
      return;
    }

    var rangeError = false;
    // check that the time in within bounds
    if (
      settings.minTime !== null &&
      settings.maxTime !== null &&
      (seconds < settings.minTime || seconds > settings.maxTime)
    ) {
      rangeError = true;
    }

    // check that time isn't within disabled time ranges
    $.each(settings.disableTimeRanges, function() {
      if (seconds >= this[0] && seconds < this[1]) {
        rangeError = true;
        return false;
      }
    });

    if (settings.forceRoundTime) {
      var roundSeconds = settings.roundingFunction(seconds, settings);
      if (roundSeconds != seconds) {
        seconds = roundSeconds;
        origin = null;
      }
    }

    var prettyTime = _int2time(seconds, settings);

    if (rangeError) {
      if (
        _setTimeValue(self, prettyTime, "error") ||
        (e && e.type == "change")
      ) {
        self.trigger("timeRangeError");
      }
    } else {
      _setTimeValue(self, prettyTime, origin);
    }
  }

  function _getTimeValue(self) {
    if (self.is("input")) {
      return self.val();
    } else {
      // use the element's data attributes to store values
      return self.data("ui-timepicker-value");
    }
  }

  function _setTimeValue(self, value, source) {
    if (self.is("input")) {
      self.val(value);

      var settings = self.data("timepicker-settings");
      if (settings.useSelect && source != "select") {
        self
          .data("timepicker-list")
          .val(_roundAndFormatTime(_time2int(value), settings));
      }
    }

    if (self.data("ui-timepicker-value") != value) {
      self.data("ui-timepicker-value", value);
      if (source == "select") {
        self
          .trigger("selectTime")
          .trigger("changeTime")
          .trigger("change", "timepicker");
      } else if (["error", "initial"].indexOf(source) == -1) {
        self.trigger("changeTime");
      }

      return true;
    } else {
      if (["error", "initial"].indexOf(source) == -1) {
        self.trigger("selectTime");
      }
      return false;
    }
  }

  /*
	*  Filter freeform input
	*/
  function _disableTextInputHandler(e) {
    switch (e.keyCode) {
      case 13: // return
      case 9: //tab
        return;

      default:
        e.preventDefault();
    }
  }

  /*
	*  Keyboard navigation via arrow keys
	*/
  function _keydownhandler(e) {
    var self = $(this);
    var list = self.data("timepicker-list");

    if (!list || !_isVisible(list)) {
      if (e.keyCode == 40) {
        // show the list!
        methods.show.call(self.get(0));
        list = self.data("timepicker-list");
        if (!_hideKeyboard(self)) {
          self.focus();
        }
      } else {
        return true;
      }
    }

    switch (e.keyCode) {
      case 13: // return
        if (_selectValue(self)) {
          _formatValue.call(self.get(0), { type: "change" });
          methods.hide.apply(this);
        }

        e.preventDefault();
        return false;

      case 38: // up
        var selected = list.find(".ui-timepicker-selected");

        if (!selected.length) {
          list.find("li").each(function(i, obj) {
            if ($(obj).position().top > 0) {
              selected = $(obj);
              return false;
            }
          });
          selected.addClass("ui-timepicker-selected");
        } else if (!selected.is(":first-child")) {
          selected.removeClass("ui-timepicker-selected");
          selected.prev().addClass("ui-timepicker-selected");

          if (selected.prev().position().top < selected.outerHeight()) {
            list.scrollTop(list.scrollTop() - selected.outerHeight());
          }
        }

        return false;

      case 40: // down
        selected = list.find(".ui-timepicker-selected");

        if (selected.length === 0) {
          list.find("li").each(function(i, obj) {
            if ($(obj).position().top > 0) {
              selected = $(obj);
              return false;
            }
          });

          selected.addClass("ui-timepicker-selected");
        } else if (!selected.is(":last-child")) {
          selected.removeClass("ui-timepicker-selected");
          selected.next().addClass("ui-timepicker-selected");

          if (
            selected.next().position().top + 2 * selected.outerHeight() >
            list.outerHeight()
          ) {
            list.scrollTop(list.scrollTop() + selected.outerHeight());
          }
        }

        return false;

      case 27: // escape
        list.find("li").removeClass("ui-timepicker-selected");
        methods.hide();
        break;

      case 9: //tab
        methods.hide();
        break;

      default:
        return true;
    }
  }

  /*
	*	Time typeahead
	*/
  function _keyuphandler(e) {
    var self = $(this);
    var list = self.data("timepicker-list");
    var settings = self.data("timepicker-settings");

    if (!list || !_isVisible(list) || settings.disableTextInput) {
      return true;
    }

    if (e.type === "paste" || e.type === "cut") {
      setTimeout(function() {
        if (settings.typeaheadHighlight) {
          _setSelected(self, list);
        } else {
          list.hide();
        }
      }, 0);
      return;
    }

    switch (e.keyCode) {
      case 96: // numpad numerals
      case 97:
      case 98:
      case 99:
      case 100:
      case 101:
      case 102:
      case 103:
      case 104:
      case 105:
      case 48: // numerals
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
      case 65: // a
      case 77: // m
      case 80: // p
      case 186: // colon
      case 8: // backspace
      case 46: // delete
        if (settings.typeaheadHighlight) {
          _setSelected(self, list);
        } else {
          list.hide();
        }
        break;
    }
  }

  function _selectValue(self) {
    var settings = self.data("timepicker-settings");
    var list = self.data("timepicker-list");
    var timeValue = null;

    var cursor = list.find(".ui-timepicker-selected");

    if (cursor.hasClass("ui-timepicker-disabled")) {
      return false;
    }

    if (cursor.length) {
      // selected value found
      timeValue = cursor.data("time");
    }

    if (timeValue !== null) {
      if (typeof timeValue != "string") {
        timeValue = _int2time(timeValue, settings);
      }

      _setTimeValue(self, timeValue, "select");
    }

    return true;
  }

  function _int2duration(seconds, step) {
    seconds = Math.abs(seconds);
    var minutes = Math.round(seconds / 60),
      duration = [],
      hours,
      mins;

    if (minutes < 60) {
      // Only show (x mins) under 1 hour
      duration = [minutes, _lang.mins];
    } else {
      hours = Math.floor(minutes / 60);
      mins = minutes % 60;

      // Show decimal notation (eg: 1.5 hrs) for 30 minute steps
      if (step == 30 && mins == 30) {
        hours += _lang.decimal + 5;
      }

      duration.push(hours);
      duration.push(hours == 1 ? _lang.hr : _lang.hrs);

      // Show remainder minutes notation (eg: 1 hr 15 mins) for non-30 minute steps
      // and only if there are remainder minutes to show
      if (step != 30 && mins) {
        duration.push(mins);
        duration.push(_lang.mins);
      }
    }

    return duration.join(" ");
  }

  function _int2time(timeInt, settings) {
    if (typeof timeInt != "number") {
      return null;
    }

    var seconds = parseInt(timeInt % 60),
      minutes = parseInt((timeInt / 60) % 60),
      hours = parseInt((timeInt / (60 * 60)) % 24);

    var time = new Date(1970, 0, 2, hours, minutes, seconds, 0);

    if (isNaN(time.getTime())) {
      return null;
    }

    if ($.type(settings.timeFormat) === "function") {
      return settings.timeFormat(time);
    }

    var output = "";
    var hour, code;
    for (var i = 0; i < settings.timeFormat.length; i++) {
      code = settings.timeFormat.charAt(i);
      switch (code) {
        case "a":
          output += time.getHours() > 11 ? _lang.pm : _lang.am;
          break;

        case "A":
          output += time.getHours() > 11 ? _lang.PM : _lang.AM;
          break;

        case "g":
          hour = time.getHours() % 12;
          output += hour === 0 ? "12" : hour;
          break;

        case "G":
          hour = time.getHours();
          if (timeInt === _ONE_DAY) hour = settings.show2400 ? 24 : 0;
          output += hour;
          break;

        case "h":
          hour = time.getHours() % 12;

          if (hour !== 0 && hour < 10) {
            hour = "0" + hour;
          }

          output += hour === 0 ? "12" : hour;
          break;

        case "H":
          hour = time.getHours();
          if (timeInt === _ONE_DAY) hour = settings.show2400 ? 24 : 0;
          output += hour > 9 ? hour : "0" + hour;
          break;

        case "i":
          var minutes = time.getMinutes();
          output += minutes > 9 ? minutes : "0" + minutes;
          break;

        case "s":
          seconds = time.getSeconds();
          output += seconds > 9 ? seconds : "0" + seconds;
          break;

        case "\\":
          // escape character; add the next character and skip ahead
          i++;
          output += settings.timeFormat.charAt(i);
          break;

        default:
          output += code;
      }
    }

    return output;
  }

  function _time2int(timeString, settings) {
    if (timeString === "" || timeString === null) return null;
    if (typeof timeString == "object") {
      return (
        timeString.getHours() * 3600 +
        timeString.getMinutes() * 60 +
        timeString.getSeconds()
      );
    }
    if (typeof timeString != "string") {
      return timeString;
    }

    timeString = timeString.toLowerCase().replace(/[\s\.]/g, "");

    // if the last character is an "a" or "p", add the "m"
    if (timeString.slice(-1) == "a" || timeString.slice(-1) == "p") {
      timeString += "m";
    }

    var ampmRegex =
      "(" +
      _lang.am.replace(".", "") +
      "|" +
      _lang.pm.replace(".", "") +
      "|" +
      _lang.AM.replace(".", "") +
      "|" +
      _lang.PM.replace(".", "") +
      ")?";

    // try to parse time input
    var pattern = new RegExp(
      "^" +
        ampmRegex +
        "([0-9]?[0-9])\\W?([0-5][0-9])?\\W?([0-5][0-9])?" +
        ampmRegex +
        "$"
    );

    var time = timeString.match(pattern);
    if (!time) {
      return null;
    }

    var hour = parseInt(time[2] * 1, 10);
    var ampm = time[1] || time[5];
    var hours = hour;
    var minutes = time[3] * 1 || 0;
    var seconds = time[4] * 1 || 0;

    if (hour <= 12 && ampm) {
      var isPm = ampm == _lang.pm || ampm == _lang.PM;

      if (hour == 12) {
        hours = isPm ? 12 : 0;
      } else {
        hours = hour + (isPm ? 12 : 0);
      }
    } else if (settings) {
      var t = hour * 3600 + minutes * 60 + seconds;
      if (t >= _ONE_DAY + (settings.show2400 ? 1 : 0)) {
        if (settings.wrapHours === false) {
          return null;
        }

        hours = hour % 24;
      }
    }

    var timeInt = hours * 3600 + minutes * 60 + seconds;

    // if no am/pm provided, intelligently guess based on the scrollDefault
    if (
      hour < 12 &&
      !ampm &&
      settings &&
      settings._twelveHourTime &&
      settings.scrollDefault
    ) {
      var delta = timeInt - settings.scrollDefault();
      if (delta < 0 && delta >= _ONE_DAY / -2) {
        timeInt = (timeInt + _ONE_DAY / 2) % _ONE_DAY;
      }
    }

    return timeInt;
  }

  function _pad2(n) {
    return ("0" + n).slice(-2);
  }

  function _moduloSeconds(seconds, settings) {
    if (seconds == _ONE_DAY && settings.show2400) {
      return seconds;
    }

    return seconds % _ONE_DAY;
  }

  // Plugin entry
  $.fn.timepicker = function(method) {
    if (!this.length) return this;
    if (methods[method]) {
      // check if this element is a timepicker
      if (!this.hasClass("ui-timepicker-input")) {
        return this;
      }
      return methods[method].apply(
        this,
        Array.prototype.slice.call(arguments, 1)
      );
    } else if (typeof method === "object" || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error("Method " + method + " does not exist on jQuery.timepicker");
    }
  };
});
