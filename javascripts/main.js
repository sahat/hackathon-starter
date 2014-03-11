/* ========================== */
/* ==== HELPER FUNCTIONS ==== */


isIE = false;


$.fn.isAfter = function (sel) {
	return this.prevAll(sel).length !== 0;
}
$.fn.isBefore = function (sel) {
	return this.nextAll(sel).length !== 0;
}


function validatedata($attr, $defaultValue) {
	if ($attr !== undefined) {
		return $attr
	}
	return $defaultValue;
}

function parseBoolean(str, $defaultValue) {
	if (str == 'true') {
		return true;
	}
	return $defaultValue;
	//return /true/i.test(str);
}

/* ============================================= */
/* ==== GOOGLE MAP - Asynchronous Loading  ==== */

function initmap() {
	"use strict";
	jQuery(".googleMap").each(function () {
		var atcenter = "";
		var $this = jQuery(this);
		var location = $this.data("location");

		var offset = -30;

		if (validatedata($this.data("offset"))) {
			offset = $this.data("offset");
		}

		if (validatedata(location)) {

			$this.gmap3({
				marker: {
					//latLng: [40.616439, -74.035540],
					address: location,
					options: {
						visible: false
					},
					callback: function (marker) {
						atcenter = marker.getPosition();
					}
				},
				map: {
					options: {
						//maxZoom:11,
						zoom: 18,
						mapTypeId: google.maps.MapTypeId.SATELLITE,
						// ('ROADMAP', 'SATELLITE', 'HYBRID','TERRAIN');
						scrollwheel: false,
						disableDoubleClickZoom: false,
						//disableDefaultUI: true,
						mapTypeControlOptions: {
							//mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.HYBRID],
							//style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
							//position: google.maps.ControlPosition.RIGHT_CENTER
							mapTypeIds: []
						}
					},
					events: {
						idle: function () {
							if (!$this.data('idle')) {
								$this.gmap3('get').panBy(0, offset);
								$this.data('idle', true);
							}
						}
					}
				},
				overlay: {
					//latLng: [40.616439, -74.035540],
					address: location,
					options: {
						content: '<div class="customMarker"><span class="fa fa-map-marker"></span><i></i></div>',
						offset: {
							y: -70,
							x: -25
						}
					}
				}
				//},"autofit"
			});

			// center on resize
			google.maps.event.addDomListener(window, "resize", function () {
				//var userLocation = new google.maps.LatLng(53.8018,-1.553);
				setTimeout(function () {
					$this.gmap3('get').setCenter(atcenter);
					$this.gmap3('get').panBy(0, offset);
				}, 400);

			});

			// set height
			$this.css("min-height", $this.data("height") + "px");
		}

	})
}

function loadScript() {
	"use strict";
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&' + 'callback=initmap';
	document.body.appendChild(script);
}


if ($(".googleMap").length > 0) {
	window.onload = loadScript;
}


jQuery(document).ready(function () {
	"use strict";
	$ = jQuery.noConflict();


	/* ===================== */
	/* ==== TIMELINE JS ==== */

	if ($("#timeline-embed").length > 0) {

		createStoryJS({
			width: '100%',
			height: '600',
			source: 'js/timeline/source/timeline.json',
			embed_id: 'timeline-embed',               //OPTIONAL USE A DIFFERENT DIV ID FOR EMBED
			start_at_end: false,                          //OPTIONAL START AT LATEST DATE
			start_at_slide: '2',                            //OPTIONAL START AT SPECIFIC SLIDE
			start_zoom_adjust: '2',                            //OPTIONAL TWEAK THE DEFAULT ZOOM LEVEL
			hash_bookmark: false,                           //OPTIONAL LOCATION BAR HASHES
			debug: false,                           //OPTIONAL DEBUG TO CONSOLE
			lang: 'en',                           //OPTIONAL LANGUAGE
			maptype: 'HYBRID',                   //OPTIONAL MAP STYLE
			css: 'js/timeline/css/timeline.css',     //OPTIONAL PATH TO CSS
			js: 'js/timeline/js/timeline-min.js'    //OPTIONAL PATH TO JS
		});
	}


	/* ============================= */
	/* ==== SET ELEMENTS HEIGHT ==== */
	// flexslider
	$('.flexslider.std-slider').each(function () {
		var $this = $(this);
		$this.css('min-height', $this.attr('data-height') + "px");
	})

	// spacer element
	$('.spacer').each(function () {
		var $this = $(this);
		$this.css('height', $this.attr('data-height') + "px");
	})

	/* ================================== */
	/* ==== SET PADDING FOR SECTIONS ==== */

	$(".content-area, .parallaxSection").each(function () {
		var $this = $(this);
		var bottomSpace = $this.attr("data-btmspace");
		var topSpace = $this.attr("data-topspace");
		var bg = $this.attr("data-bg");

		if (validatedata(bottomSpace, false)) {
			$this.css("padding-bottom", bottomSpace + "px");
		}
		if (validatedata(topSpace, false)) {
			$this.css("padding-top", topSpace + "px");
		}
		if (validatedata(bg, false)) {
			$this.css('background-image', 'url("' + bg + '")');
		}
	})


	if ($(".parallaxSection.height100").length > 0) {

		$(".parallaxSection.height100").each(function () {

			var $this = $(this);
			$("#boxedWrapper, body").css("height", "100%");

			var menuHeight = 0;
			if ($this.isAfter(".navbar-default")) {
				menuHeight = $(".navbar-default").outerHeight();
			}
			if ($(".navbar-default").hasClass("navbar-fixed-top")) {
				menuHeight = 0;
			}


			var sliderHeight = $this.outerHeight() - menuHeight;
			var $slider = $this.find(".flexslider");

			$($this, $slider).css("height", sliderHeight);

		})
	}


	/* ========================= */
	/* ==== CLICKABLE TABLE ==== */

	$('.table-responsive tr').click(function () {
		var $this = $(this);
		if ($this.attr('data-link') !== undefined) {
			window.location = $this.attr('data-link');
		}
	});

	/* ========================== */
	/* ==== SCROLL TO ANCHOR ==== */

	$('a.local[href*=#]:not([href=#])').click(function () {
		if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
			var target = $(this.hash);
			target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');

			var menuOffset = 0;
			if ($(this).hasClass("menuOffset")) {
				if (!($.browser.mobile)) {
					menuOffset = parseInt($('.navbar-default').height());
				} else {

				}
			}

			if (target.length) {
				$('html,body').animate({
					scrollTop: target.offset().top - menuOffset
				}, 1000, 'swing');
				return false;
			}
		}
	});


	/* ================== */
	/* ==== COUNT TO ==== */

	if (($().appear) && ($(".timerCounter").length > 0)) {
		$('.timerCounter').appear(function () {
			$('.timerVal').each(function () {
				$(this).countTo();
			})
		})
	}

	/* =============================== */
	/* ==== PLACEHOLDERS FALLBACK ==== */

	if ($().placeholder) {
		$("input[placeholder],textarea[placeholder]").placeholder();
	}

	/* ======================================= */
	/* === CLICKABLE MAIN PARENT ITEM MENU === */
	jQuery(".navbar-default li.dropdown > .dropdown-toggle").removeAttr("data-toggle data-target");


	/* ======================== */
	/* ==== ANIMATION INIT ==== */

	if ($().appear) {

		if ($.browser.mobile) {
			// disable animation on mobile
			$("body").removeClass("withAnimation");
		} else {

			$('.withAnimation .animated').appear(function () {
				var $this = $(this);
				$this.each(function () {
					$this.addClass('activate');
					$this.addClass($this.data('fx'));
				});
			}, {accX: 50, accY: -150});

		}
	}

	/* ======================== */
	/* === VIDEO BACKGROUND === */

	// helper function

	$.fn.isOnScreen = function () {
		var win = $(window);
		var viewport = {
			top: win.scrollTop(),
			left: win.scrollLeft()
		};
		viewport.right = viewport.left + win.width();
		viewport.bottom = viewport.top + win.height();
		var bounds = this.offset();
		bounds.right = bounds.left + this.outerWidth();
		bounds.bottom = bounds.top + this.outerHeight();
		return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
	};

	if (($().mb_YTPlayer) && ($(".videoSection").length > 0)) {
		if ($.browser.mobile) {
			// disable on mobile
			$(".videoSection").hide();
			$("#ct_preloader").fadeOut(600);

		} else {
			$(".videoSection").mb_YTPlayer();
			$('.videoSection').on("YTPStart", function () {
				setTimeout(function () {
					$("#ct_preloader").fadeOut(300);
					$(".videoSection").find(".flexslider").fadeIn(1000);
				}, 1050);
			})
			// if wait long - hide preloader
			setTimeout(function () {
				$("#ct_preloader").fadeOut(300);
			}, 9000);

			// chrome parallax section fix
			if ($('.videoSection.parallaxEffect').isOnScreen()) {
				$('.videoSection.parallaxEffect .innerVideo').css("position", "fixed");
			} else {
				$('.videoSection.parallaxEffect .innerVideo').css("position", "absolute");
			}
			$(window).on('scroll', function () {
				if ($('.videoSection.parallaxEffect').isOnScreen()) {
					$('.videoSection.parallaxEffect .innerVideo').css("position", "fixed");
				} else {
					$('.videoSection.parallaxEffect .innerVideo').css("position", "absolute");
				}
			});

			$('.videoSection.parallaxEffect').each(function () {
				var $this = $(this);
				$this.siblings(":not([data-bg], .navbar-default)").css({
					"position": "relative",
					"z-index": "1"
				})

			})

		}
	}

	/* ======================= */
	/* ==== TOOLTIPS INIT ==== */

	$("[data-toggle='tooltip']").tooltip();


	/* ======================= */
	/* ==== TO TOP BUTTON ==== */


	$('#toTop').click(function () {
		$("body,html").animate({scrollTop: 0}, 600);
		return false;
	});

	$(window).scroll(function () {
		if ($(this).scrollTop() != 0) {
			$("#toTop").fadeIn(300);
		} else {
			$("#toTop").fadeOut(250);
		}
	});


	/* ======================== */
	/* ==== MAGNIFIC POPUP ==== */

	if ($().magnificPopup) {

		$(".popup-iframe").magnificPopup({
			disableOn: 700,
			type: 'iframe',
			mainClass: 'mfp-fade',
			removalDelay: 160,
			preloader: false,
			fixedContentPos: false
		});

		$('.imgpopup').magnificPopup({
			type: 'image',
			closeOnContentClick: true,
			closeBtnInside: false,
			fixedContentPos: false,
			mainClass: 'mfp-fade', // class to remove default margin from left and right side
			image: {
				verticalFit: true
			}
		});
	}

	/* ========================= */
	/* ==== LOAD SVG IMAGES ==== */

	if ($(".octagon").length > 0) {
		$(".octagon .svg-load").load("images/octagon1.svg");
	}

	/* ============================ */
	/* ==== SHOW HEADER SEARCH ==== */

	$("#showHeaderSearch").click(function () {
		var $this = $(this);
		var $searchform = $this.parent().find(".header-search");
		$searchform.fadeToggle(250, function () {

			if (($searchform).is(":visible")) {
				$this.find(".fa-search").removeClass("fa-search").addClass("fa-times");

				if (!isIE) {
					$searchform.find("[type=text]").focus();
				}
			} else {
				$this.find(".fa-times").removeClass("fa-times").addClass("fa-search");
			}
		});

		return false;
	})

	/* =========================== */
	/* ==== SHOW MAP ON CLICK ==== */

	$(".showMap").click(function () {
		var $this = $(this);
		var $parent = $this.closest(".content-layer");
		var $form = $parent.find(".placeOver");

		$parent.find(".bg-layer, .placeOver").fadeToggle(250, function () {
			if (($form).is(":visible")) {
				$this.text($this.attr("data-old"));
			} else {
				$this.attr("data-old", $this.text());
				$this.text($this.attr("data-text"));
			}
		});

		return false;
	})

	/* ==================================== */
	/* ==== FITVIDS - responsive video ==== */

	if (($().fitVids) && ($(".responsiveVideo").length > 0)) {
		$(".responsiveVideo").fitVids();
	}


	/* ==================== */
	/* === PROGRESS BAR === */

	if (($().appear) && ($(".progress").length > 0)) {
		jQuery('.progress').appear(function () {
			var $this = jQuery(this);
			$this.each(function () {
				var $innerbar = $this.find(".progress-bar");
				var percentage = $innerbar.attr("data-percentage");

				$innerbar.addClass("animating").css("width", percentage + "%");

				$innerbar.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function () {
					$this.find(".pro-level").fadeIn(600);
				});

			});
		}, {accY: -100});
	}

	/* ================== */
	/* ==== ISOTOPE ==== */

	if (($.Isotope) && ($('#blog-list.withMasonry').length > 0)) {

		jQuery(window).load(function () {

			// blog masonry

			var $blogContainer = $('#blog-list.withMasonry'), // object that will keep track of options
							isotopeOptions = {}, // defaults, used if not explicitly set in hash
							defaultOptions = {
								itemSelector: '.blog-item',
								layoutMode: 'sloppyMasonry',
								resizable: false, // disable normal resizing
								// set columnWidth to a percentage of container width
								masonry: { }
							};


			$(window).smartresize(function () {
				$blogContainer.isotope({
					// update columnWidth to a percentage of container width
					masonry: { }
				});
			});

			// set up Isotope
			$blogContainer.isotope(defaultOptions, function () {

				// fix for height dynamic content
				setTimeout(function () {
					$blogContainer.isotope('reLayout');
				}, 1000);

			});
		});
	}


	if (($.Isotope) && ($('#galleryContainer').length > 0)) {
		// gallery isotope

		jQuery(window).load(function () {

			var $container = jQuery('#galleryContainer'), // object that will keep track of options
							isotopeOptions = {}, // defaults, used if not explicitly set in hash
							defaultOptions = {
								filter: '*',
								itemSelector: '.galleryItem',
								sortBy: 'original-order',
								layoutMode: 'sloppyMasonry',
								sortAscending: true,
								resizable: false, // disable normal resizing
								// set columnWidth to a percentage of container width
								masonry: { }
							};


			$(window).smartresize(function () {
				$container.isotope({
					// update columnWidth to a percentage of container width
					masonry: { }
				});
			});

			// set up Isotope
			$container.isotope(defaultOptions);

			var $optionSets = jQuery('#galleryFilters'), isOptionLinkClicked = false;

			// switches selected class on buttons
			function changeSelectedLink($elem) {
				// remove selected class on previous item
				$elem.parents('.option-set').find('.btn-primary').removeClass('btn-primary');
				// set selected class on new item
				$elem.addClass('btn-primary');
			}


			$optionSets.find('a').click(function () {
				var $this = jQuery(this);
				// don't proceed if already selected
				if ($this.hasClass('btn-primary')) {
					return;
				}
				changeSelectedLink($this);
				// get href attr, remove leading #
				var href = $this.attr('href').replace(/^#/, ''), // convert href into object
				// i.e. 'filter=.inner-transition' -> { filter: '.inner-transition' }
								option = jQuery.deparam(href, true);
				// apply new option to previous
				jQuery.extend(isotopeOptions, option);
				// set hash, triggers hashchange on window
				jQuery.bbq.pushState(isotopeOptions);
				isOptionLinkClicked = true;
				return false;
			});


			var hashChanged = false;

			jQuery(window).bind('hashchange', function (event) {
				// get options object from hash
				var hashOptions = window.location.hash ? jQuery.deparam.fragment(window.location.hash, true) : {}, // do not animate first call
								aniEngine = hashChanged ? 'best-available' : 'none', // apply defaults where no option was specified
								options = jQuery.extend({}, defaultOptions, hashOptions, { animationEngine: aniEngine });
				// apply options from hash
				$container.isotope(options);
				// save options
				isotopeOptions = hashOptions;

				// if option link was not clicked
				// then we'll need to update selected links
				if (!isOptionLinkClicked) {
					// iterate over options
					var hrefObj, hrefValue, $selectedLink;
					for (var key in options) {
						hrefObj = {};
						hrefObj[ key ] = options[ key ];
						// convert object into parameter string
						// i.e. { filter: '.inner-transition' } -> 'filter=.inner-transition'
						hrefValue = jQuery.param(hrefObj);
						// get matching link
						$selectedLink = $optionSets.find('a[href="#' + hrefValue + '"]');
						changeSelectedLink($selectedLink);
					}
				}

				isOptionLinkClicked = false;
				hashChanged = true;
			})// trigger hashchange to capture any hash data on init
							.trigger('hashchange');

		});
	}


	$(window).load(function () {


		/* ==================== */
		/* ==== FLEXSLIDER ==== */

		if (($().flexslider) && ($(".flexslider").length > 0)) {

			$('.flexslider.std-slider').each(function () {
				var $this = $(this);

				// initialize
				$this.find(".slides > li").each(function () {
					var $slide_item = $(this);
					var bg = validatedata($slide_item.attr('data-bg'), false);
					if (bg) {
						$slide_item.css('background-image', 'url("' + bg + '")');
					}
					$slide_item.css('min-height', $this.attr('data-height') + "px");

					// hide slider content due to fade animation
					$slide_item.find(".inner").hide();

					$slide_item.find(".inner [data-fx]").each(function () {
						$(this).removeClass("animated");
					})
				})

				var loop = validatedata(parseBoolean($this.attr("data-loop")), false);
				var smooth = validatedata(parseBoolean($this.attr("data-smooth")), false);
				var slideshow = validatedata(parseBoolean($this.attr("data-slideshow")), false);
				var speed = validatedata(parseInt($this.attr('data-speed')), 7000);
				var animspeed = validatedata(parseInt($this.attr("data-animspeed")), 600);
				var controls = validatedata(parseBoolean($this.attr('data-controls')), false);
				var dircontrols = validatedata(parseBoolean($this.attr('data-dircontrols')), false);

				$this.flexslider({
					animation: "fade",              //String: Select your animation type, "fade" or "slide"
					animationLoop: loop,             //Boolean: Should the animation loop? If false, directionNav will received "disable" classes at either end
					smoothHeight: smooth,            //{NEW} Boolean: Allow height of the slider to animate smoothly in horizontal mode
					slideshow: slideshow,                //Boolean: Animate slider automatically
					slideshowSpeed: speed,           //Integer: Set the speed of the slideshow cycling, in milliseconds
					animationSpeed: animspeed,            //Integer: Set the speed of animations, in milliseconds

					// Primary Controls
					controlNav: controls,               //Boolean: Create navigation for paging control of each clide? Note: Leave true for manualControls usage
					directionNav: dircontrols,             //Boolean: Create navigation for previous/next navigation? (true/false)

					pauseOnHover: true,            //Boolean: Pause the slideshow when hovering over slider, then resume when no longer hovering
					prevText: " ",           //String: Set the text for the "previous" directionNav item
					nextText: " ",
					useCSS: false,

					// Callback API
					start: function () {
						setTimeout(function () {
							$this.find(".slides > li.flex-active-slide .inner").each(function () {
								var $content = $(this);
								if (!isIE) {
									$content.closest(".inner").show();
								} else {
									$content.closest(".inner").fadeIn(300);
								}
							});
							$this.find(".slides > li.flex-active-slide .inner [data-fx]").each(function () {
								var $content = $(this);
								$content.addClass($content.data('fx')).show().addClass("animated activate");
							})
						}, 600);

					},
					before: function () {

						$this.find(".slides > li.flex-active-slide .inner [data-fx]").each(function () {
							var $content = $(this);
							$content.closest(".inner").fadeOut(400);
							$content.removeClass($content.data('fx')).removeClass("animated activate");
						})
					},           //Callback: function(slider) - Fires asynchronously with each slider animation
					after: function () {
						setTimeout(function () {
							$this.find(".slides > li.flex-active-slide .inner").each(function () {
								var $content = $(this);
								if (!isIE) {
									$content.closest(".inner").show();
								} else {
									$content.closest(".inner").fadeIn(300);
								}
							});
							$this.find(".slides > li.flex-active-slide .inner [data-fx]").each(function () {
								var $content = $(this);
								$content.addClass($content.data('fx')).show().addClass("animated activate");
							})
						}, 150);
					},            //Callback: function(slider) - Fires after each slider animation completes
					end: function () {
					},              //Callback: function(slider) - Fires when the slider reaches the last slide (asynchronous)
					added: function () {
					},            //{NEW} Callback: function(slider) - Fires after a slide is added
					removed: function () {
					}           //{NEW} Callback: function(slider) - Fires after a slide is removed
				});
			});

			$('.flexslider.carousel-slider').each(function () {
				var $this = $(this);

				var slideshow = validatedata(parseBoolean($this.attr("data-slideshow")), false);
				var speed = validatedata(parseInt($this.attr('data-speed')), 7000);
				var animspeed = validatedata(parseInt($this.attr("data-animspeed")), 600);
				var loop = validatedata(parseBoolean($this.attr("data-loop")), false);
				var min = validatedata(parseInt($this.attr('data-min')), 1);
				var max = validatedata(parseInt($this.attr("data-max")), 3);
				var move = validatedata(parseInt($this.attr("data-move")), 0);
				var controls = validatedata(parseBoolean($this.attr('data-controls')), false);
				var dircontrols = validatedata(parseBoolean($this.attr('data-dircontrols')), false);

				$this.flexslider({
					animation: "slide",
					slideshow: slideshow,
					slideshowSpeed: speed,
					animationSpeed: animspeed,
					animationLoop: loop,
					itemWidth: 370,
					itemMargin: 30,
					minItems: min,
					maxItems: max,
					move: move,
					controlNav: controls,
					directionNav: dircontrols
				});
			});
		}


		/* =========================== */
		/* === BIG ARROW ANIMATION === */

		function animateArrow() {

			setTimeout(function () {
				$(".bigArrow i").css('opacity', 1).stop(true, true).animate({ opacity: 0, top: "15px" }, { queue: false, duration: 350, complete: function () {

					$(".bigArrow i").css("top", "-15px").stop(true, true).delay(200).animate({ opacity: 1, top: 0 }, { queue: false, duration: 450, complete: function () {
						animateArrow();
					}})
				}})
			}, 1800);
		}

		animateArrow();

	});
	/* / window load */

	/* =================== */
	/* ==== ONE PAGER ==== */


	var $logoimage = '';
	var oldsrc = '';

	function swapMenu(mode) {

		if (mode == "init") {
			$logoimage = $(".navbar-brand img");
			oldsrc = $logoimage.attr('src');
		}

		if ((mode == "standardMenu")&&(!($.browser.mobile))) {
			$onepagerNav.removeClass("navbar-transparent");
			if (!($logoimage.hasClass("swaped"))) {

				$logoimage.fadeOut(50, function () {
					$logoimage.attr('src', $logoimage.parent().attr("data-logo"));
					$logoimage.fadeIn(50).addClass("swaped");
				});
			}
		}
		if ((mode == "fixedMenu")&&(!($.browser.mobile))) {
			$onepagerNav.addClass("navbar-transparent");
			$logoimage.attr('src', oldsrc);
			$logoimage.removeClass("swaped");
		}
	}


	var onepagerNavClass = "navbar-fixed-top";
	var $onepagerNav = $("."+onepagerNavClass);

	if (($onepagerNav.length > 0)) {

		var scrollOffset = 0;

		if (!($.browser.mobile)) {

		} else {
			$(".navbar-fixed-top").removeClass(onepagerNavClass).removeClass("navbar-transparent").addClass("navbar-static-top");
			$logoimage = $(".navbar-brand img");
			$logoimage.fadeOut(50, function () {
				$logoimage.attr('src', $logoimage.parent().attr("data-logo"));
				$logoimage.fadeIn(50).addClass("swaped");
			});

			scrollOffset = parseInt($('.navbar-default').height());
		}

		$('.nav.navbar-nav li a').click(function () {
			// if mobile and menu open - hide it after click
			var $togglebtn = $(".navbar-toggle")

			if (!($togglebtn.hasClass("collapsed")) && ($togglebtn.is(":visible"))) {
				$(".navbar-toggle").trigger("click");
			}

			var $this = $(this);

			var content = $this.attr('href');

			var myUrl = content.match(/^#([^\/]+)$/i);

			if ($(content).length > 0) {
				if (myUrl) {

					var goPosition = $(content).offset().top + scrollOffset - parseInt($('.navbar-default').height());

					$('html,body').stop().animate({ scrollTop: goPosition}, 1000, 'easeInOutExpo', function () {
						$this.closest("li").addClass("active");
					});


				} else {
					window.location = content;
				}

				return false;
			}
		});


		$(window).on('scroll', function () {

			var menuEl, mainMenu = $onepagerNav, mainMenuHeight = mainMenu.outerHeight() + 5;
			var menuElements = mainMenu.find('a');

			var scrollElements = menuElements.map(function () {

				var content = $(this).attr("href");
				var myUrl = content.match(/^#([^\/]+)$/i);

				if (myUrl) {

					var item = $($(this).attr("href"));
					if (item.length) {
						return item;
					}

				}
			});

			var fromTop = $(window).scrollTop() + mainMenuHeight;

			var currentEl = scrollElements.map(function () {
				if ($(this).offset().top < fromTop) {
					return this;
				}
			});

			currentEl = currentEl[currentEl.length - 1];
			var id = currentEl && currentEl.length ? currentEl[0].id : "";
			if (menuEl !== id) {
				menuElements.parent().removeClass("active").end().filter("[href=#" + id + "]").parent().addClass("active");
			}

			var scroll = $(window).scrollTop();
			if (scroll > 0) {
				swapMenu("standardMenu");
			} else {
				swapMenu("fixedMenu");
			}

		});


		swapMenu("init");
		var scroll = $(window).scrollTop();
		if (scroll > 0) {
			swapMenu("standardMenu");
		}
	}


	/* ================================ */
	/* === AJAX PORTFOLIO ONE PAGER === */

	$("body").on("click", ".getAjaxItem", function () {
		var $this = $(this);
		var $galDetails = $("#galleryAjaxDetails");

		if ($galDetails.length <= 0) {
			return true;
		}

		var url = $this.attr("href") + " #ajaxContent";

		if (($galDetails).is(":visible")) {
			$galDetails.animate({opacity: 0}, 400, function () {
				$galDetails.load(url, function () {


					$galDetails.delay(300).animate({opacity: 1}, 400, function () {
						$('html,body').animate({
							scrollTop: $galDetails.offset().top - parseInt($('.navbar-fixed-top').height())
						}, 600, 'swing');
					});
				});
			});
		} else {
			$galDetails.slideUp(300, function () {
				$galDetails.load(url, function () {
					$galDetails.delay(300).slideDown(700, function () {
						$('html,body').animate({
							scrollTop: $galDetails.offset().top - parseInt($('.navbar-fixed-top').height())
						}, 600, 'swing');
					});
				});
			});
		}

		return false;
	})

	$("body").on("click", ".closeAjaxPortfolio", function () {
		var $galDetails = $("#galleryAjaxDetails");
		$galDetails.slideUp(300, function () {
			$('html,body').animate({
				scrollTop: $("#portfolio").offset().top - parseInt($('.navbar-fixed-top').height())
			}, 600, 'swing');
		});
		return false;
	});


	$(document).ajaxStart(function () {
		$("#ct_preloader").addClass("ajax-inprogress").show();

	});

	$(document).ajaxStop(function () {
		setTimeout(function () {
			$("#ct_preloader").removeClass("ajax-inprogress").hide();
		}, 300);

		// init js after ajax stop
		$("#galleryAjaxDetails .content-area").each(function () {
			var $this = $(this);
			var bottomSpace = $this.attr("data-btmspace");
			var topSpace = $this.attr("data-topspace");

			if (validatedata(bottomSpace, false)) {
				$this.css("padding-bottom", bottomSpace + "px");
			}
			if (validatedata(topSpace, false)) {
				$this.css("padding-top", topSpace + "px");
			}
		})
		$("[data-toggle='tooltip']").tooltip();

	});



});
/* / document ready */

