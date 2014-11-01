/*
	Astral by HTML5 UP
	html5up.net | @n33co
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	/*********************************************************************************/
	/* Settings                                                                      */
	/*********************************************************************************/

		var settings = {

			// Speed to resize panel.
				resizeSpeed: 600,
			
			// Speed to fade in/out.
				fadeSpeed: 300,
			
			// Size factor.
				sizeFactor: 11.5,		
			
			// Minimum point size.
				sizeMin: 15,			
			
			// Maximum point size.
				sizeMax: 20			

		};

	/*********************************************************************************/
	/* skel                                                                          */
	/*********************************************************************************/
		
		skel.init({
			reset: 'full',
			pollOnce: true,
			breakpoints: {
				'global':	{ range: '*', href: 'css/style.css' },
				'desktop':	{ range: '737-', href: 'css/style-desktop.css', containers: 1200, grid: { gutters: 25 }, viewport: { width: 1080, scalable: false } },
				'mobile':	{ range: '-736', href: 'css/style-mobile.css', containers: '100%', grid: { collapse: true, gutters: 10 }, viewport: { scalable: false } }
			}
		});

	/*********************************************************************************/
	/* Main                                                                          */
	/*********************************************************************************/

		var	$window = $(window);
		
		$window.on('load', function() {

			var	$body = $('body'),
				$main = $('#main'),
				$panels = $main.find('.panel'),
				$hbw = $('html,body,window'),
				$footer = $('#footer'),
				$wrapper = $('#wrapper'),
				$nav = $('#nav'), $nav_links = $nav.find('a'),
				$jumplinks = $('.jumplink'),
				$form = $('form'),
				panels = [],
				activePanelId = null,
				firstPanelId = null,
				isLocked = false,
				hash = window.location.hash.substring(1);
		
			if (skel.vars.isTouch) {
				
				settings.fadeSpeed = 0;
				settings.resizeSpeed = 0;
				$nav_links.find('span').remove();
			
			}

			if (skel.isActive('desktop')) {
				
				// Body.
					$body._resize = function() {
						var factor = ($window.width() * $window.height()) / (1440 * 900);
						$body.css('font-size', Math.min(Math.max(Math.floor(factor * settings.sizeFactor), settings.sizeMin), settings.sizeMax) + 'pt');
						$main.height(panels[activePanelId].outerHeight());
						$body._reposition();
					};

					$body._reposition = function() {
						if (skel.vars.isTouch && (window.orientation == 0 || window.orientation == 180))
							$wrapper.css('padding-top', Math.max((($window.height() - (panels[activePanelId].outerHeight() + $footer.outerHeight())) / 2) - $nav.height(), 30) + 'px');
						else
							$wrapper.css('padding-top', ((($window.height() - panels[firstPanelId].height()) / 2) - $nav.height()) + 'px');
					};
					
				// Panels.
					$panels.each(function(i) {
						var t = $(this), id = t.attr('id');
						
						panels[id] = t;
					
						if (i == 0) {
							
							firstPanelId = id;
							activePanelId = id;
						
						}
						else
							t.hide();
							
						t._activate = function(instant) {
						
							// Check lock state and determine whether we're already at the target.
								if (isLocked
								||	activePanelId == id)
									return false;

							// Lock.
								isLocked = true;
								
							// Change nav link (if it exists).
								$nav_links.removeClass('active');
								$nav_links.filter('[href="#' + id + '"]').addClass('active');
								
							// Change hash.
								if (i == 0)
									window.location.hash = '#';
								else
									window.location.hash = '#' + id;

							// Add bottom padding.
								var x = parseInt($wrapper.css('padding-top')) +
										panels[id].outerHeight() +
										$nav.outerHeight() +
										$footer.outerHeight();
							
								if (x > $window.height())
									$wrapper.addClass('tall');
								else
									$wrapper.removeClass('tall');
										
							// Fade out active panel.
								$footer.fadeTo(settings.fadeSpeed, 0.0001);
								panels[activePanelId].fadeOut(instant ? 0 : settings.fadeSpeed, function() {
				
									// Set new active.
										activePanelId = id;

										// Force scroll to top.
											$hbw.animate({
												scrollTop: 0
											}, settings.resizeSpeed, 'swing');

										// Reposition.
											$body._reposition();
											
										// Resize main to height of new panel.
											$main.animate({
												height: panels[activePanelId].outerHeight()
											}, instant ? 0 : settings.resizeSpeed, 'swing', function() {
											
												// Fade in new active panel.
													$footer.fadeTo(instant ? 0 : settings.fadeSpeed, 1.0);
													panels[activePanelId].fadeIn(instant ? 0 : settings.fadeSpeed, function() {
														
														// Unlock.
															isLocked = false;

													});
											});
										
								});
						
						};
						
					});

				// Nav + Jumplinks.
					$nav_links.add($jumplinks).click(function(e) {
						var t = $(this), href = t.attr('href'), id;
					
						if (href.substring(0,1) == '#') {
							
							e.preventDefault();
							e.stopPropagation();

							id = href.substring(1);
							
							if (id in panels)
								panels[id]._activate();
						
						}
					
					});
				
				// Window.
					$window
						.resize(function() {
						
							if (!isLocked)
								$body._resize();
						
						});
						
					if (skel.vars.IEVersion < 9)
						$window
							.on('resize', function() {
								$wrapper.css('min-height', $window.height());
							});

				// Forms (IE<10).
					if ($form.length > 0) {
						
						if (skel.vars.IEVersion < 10) {
							$.fn.n33_formerize=function(){var _fakes=new Array(),_form = $(this);_form.find('input[type=text],textarea').each(function() { var e = $(this); if (e.val() == '' || e.val() == e.attr('placeholder')) { e.addClass('formerize-placeholder'); e.val(e.attr('placeholder')); } }).blur(function() { var e = $(this); if (e.attr('name').match(/_fakeformerizefield$/)) return; if (e.val() == '') { e.addClass('formerize-placeholder'); e.val(e.attr('placeholder')); } }).focus(function() { var e = $(this); if (e.attr('name').match(/_fakeformerizefield$/)) return; if (e.val() == e.attr('placeholder')) { e.removeClass('formerize-placeholder'); e.val(''); } }); _form.find('input[type=password]').each(function() { var e = $(this); var x = $($('<div>').append(e.clone()).remove().html().replace(/type="password"/i, 'type="text"').replace(/type=password/i, 'type=text')); if (e.attr('id') != '') x.attr('id', e.attr('id') + '_fakeformerizefield'); if (e.attr('name') != '') x.attr('name', e.attr('name') + '_fakeformerizefield'); x.addClass('formerize-placeholder').val(x.attr('placeholder')).insertAfter(e); if (e.val() == '') e.hide(); else x.hide(); e.blur(function(event) { event.preventDefault(); var e = $(this); var x = e.parent().find('input[name=' + e.attr('name') + '_fakeformerizefield]'); if (e.val() == '') { e.hide(); x.show(); } }); x.focus(function(event) { event.preventDefault(); var x = $(this); var e = x.parent().find('input[name=' + x.attr('name').replace('_fakeformerizefield', '') + ']'); x.hide(); e.show().focus(); }); x.keypress(function(event) { event.preventDefault(); x.val(''); }); });  _form.submit(function() { $(this).find('input[type=text],input[type=password],textarea').each(function(event) { var e = $(this); if (e.attr('name').match(/_fakeformerizefield$/)) e.attr('name', ''); if (e.val() == e.attr('placeholder')) { e.removeClass('formerize-placeholder'); e.val(''); } }); }).bind("reset", function(event) { event.preventDefault(); $(this).find('select').val($('option:first').val()); $(this).find('input,textarea').each(function() { var e = $(this); var x; e.removeClass('formerize-placeholder'); switch (this.type) { case 'submit': case 'reset': break; case 'password': e.val(e.attr('defaultValue')); x = e.parent().find('input[name=' + e.attr('name') + '_fakeformerizefield]'); if (e.val() == '') { e.hide(); x.show(); } else { e.show(); x.hide(); } break; case 'checkbox': case 'radio': e.attr('checked', e.attr('defaultValue')); break; case 'text': case 'textarea': e.val(e.attr('defaultValue')); if (e.val() == '') { e.addClass('formerize-placeholder'); e.val(e.attr('placeholder')); } break; default: e.val(e.attr('defaultValue')); break; } }); window.setTimeout(function() { for (x in _fakes) _fakes[x].trigger('formerize_sync'); }, 10); }); return _form; };
							$form.n33_formerize();
						}

					}

				// CSS polyfills (IE<9).
					if (skel.vars.IEVersion < 9)
						$(':last-child').addClass('last-child');

				// Init.
					$window
						.trigger('resize');

					if (hash && hash in panels)
						panels[hash]._activate(true);

					$wrapper.fadeTo(400, 1.0);
				
			}
					
		});

})(jQuery);