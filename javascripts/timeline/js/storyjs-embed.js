/*
 TimelineJS - ver. 2.29.0 - 2014-01-22
 Copyright (c) 2012-2013 Northwestern University
 a project of the Northwestern University Knight Lab, originally created by Zach Wise
 https://github.com/NUKnightLab/TimelineJS
 This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/* **********************************************
 Begin LazyLoad.js
 ********************************************** *//*jslint browser: true, eqeqeq: true, bitwise: true, newcap: true, immed: true, regexp: false *//*
 LazyLoad makes it easy and painless to lazily load one or more external
 JavaScript or CSS files on demand either during or after the rendering of a web
 page.

 Supported browsers include Firefox 2+, IE6+, Safari 3+ (including Mobile
 Safari), Google Chrome, and Opera 9+. Other browsers may or may not work and
 are not officially supported.

 Visit https://github.com/rgrove/lazyload/ for more info.

 Copyright (c) 2011 Ryan Grove <ryan@wonko.com>
 All rights reserved.

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the 'Software'), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 @module lazyload
 @class LazyLoad
 @static
 @version 2.0.3 (git)
 */
function getEmbedScriptPath(e) {
	var t = document.getElementsByTagName("script"), n = "", r = "";
	for (var i = 0; i < t.length; i++) {
		t[i].src.match(e) && (n = t[i].src);
	}
	n != "" && (r = "/");
	return n.split("?")[0].split("/").slice(0, -1).join("/") + r
}
function createStoryJS(e, t) {
	function g() {
		LoadLib.js(h.js, y)
	}

	function y() {
		l.js = !0;
		h.lang != "en" ? LazyLoad.js(c.locale, b) : l.language = !0;
		x()
	}

	function b() {
		l.language = !0;
		x()
	}

	function w() {
		l.css = !0;
		x()
	}

	function E() {
		l.font.css = !0;
		x()
	}

	function S() {
		l.font.js = !0;
		x()
	}

	function x() {
		if (l.checks > 40) {
			return;
		}
		l.checks++;
		if (l.js && l.css && l.font.css && l.font.js && l.language) {
			if (!l.finished) {
				l.finished = !0;
				N()
			}
		} else {
			l.timeout = setTimeout("onloaded_check_again();", 250)
		}
	}

	function T() {
		var e = "storyjs-embed";
		r = document.createElement("div");
		h.embed_id != "" ? i = document.getElementById(h.embed_id) : i = document.getElementById("timeline-embed");
		i.appendChild(r);
		r.setAttribute("id", h.id);
		if (h.width.toString().match("%")) {
			i.style.width = h.width.split("%")[0] + "%";
		} else {
			h.width = h.width - 2;
			i.style.width = h.width + "px"
		}
		if (h.height.toString().match("%")) {
			i.style.height = h.height;
			e += " full-embed";
			i.style.height = h.height.split("%")[0] + "%"
		} else if (h.width.toString().match("%")) {
			e += " full-embed";
			h.height = h.height - 16;
			i.style.height = h.height + "px"
		} else {
			e += " sized-embed";
			h.height = h.height - 16;
			i.style.height = h.height + "px"
		}
		i.setAttribute("class", e);
		i.setAttribute("className", e);
		r.style.position = "relative"
	}

	function N() {
		VMM.debug = h.debug;
		n = new VMM.Timeline(h.id);
		n.init(h);
		o && VMM.bindEvent(global, onHeadline, "HEADLINE")
	}

	var n, r, i, s, o = !1, u = "2.24", a = "1.7.1", f = "", l = {timeout: "", checks: 0, finished: !1, js: !1, css: !1, jquery: !1, has_jquery: !1, language: !1, font: {css: !1, js: !1}}, c = {base: embed_path, css: embed_path + "css/", js: embed_path + "js/", locale: embed_path + "js/locale/", jquery: "//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js", font: {google: !1, css: embed_path + "css/themes/font/", js: "//ajax.googleapis.com/ajax/libs/webfont/1/webfont.js"}}, h = {version: u, debug: !1, type: "timeline", id: "storyjs", embed_id: "timeline-embed", embed: !0, width: "100%", height: "100%", source: "https://docs.google.com/spreadsheet/pub?key=0Agl_Dv6iEbDadFYzRjJPUGktY0NkWXFUWkVIZDNGRHc&output=html", lang: "en", font: "default", css: c.css + "timeline.css?" + u, js: "", api_keys: {google: "", flickr: "", twitter: ""}, gmap_key: ""}, p =
					[
						{name: "Merriweather-NewsCycle", google: ["News+Cycle:400,700:latin", "Merriweather:400,700,900:latin"]},
						{name: "NewsCycle-Merriweather", google: ["News+Cycle:400,700:latin", "Merriweather:300,400,700:latin"]},
						{name: "PoiretOne-Molengo", google: ["Poiret+One::latin", "Molengo::latin"]},
						{name: "Arvo-PTSans", google: ["Arvo:400,700,400italic:latin", "PT+Sans:400,700,400italic:latin"]},
						{name: "PTSerif-PTSans", google: ["PT+Sans:400,700,400italic:latin", "PT+Serif:400,700,400italic:latin"]},
						{name: "PT", google: ["PT+Sans+Narrow:400,700:latin", "PT+Sans:400,700,400italic:latin", "PT+Serif:400,700,400italic:latin"]},
						{name: "DroidSerif-DroidSans", google: ["Droid+Sans:400,700:latin", "Droid+Serif:400,700,400italic:latin"]},
						{name: "Lekton-Molengo", google: ["Lekton:400,700,400italic:latin", "Molengo::latin"]},
						{name: "NixieOne-Ledger", google: ["Nixie+One::latin", "Ledger::latin"]},
						{name: "AbrilFatface-Average", google: ["Average::latin", "Abril+Fatface::latin"]},
						{name: "PlayfairDisplay-Muli", google: ["Playfair+Display:400,400italic:latin", "Muli:300,400,300italic,400italic:latin"]},
						{name: "Rancho-Gudea", google: ["Rancho::latin", "Gudea:400,700,400italic:latin"]},
						{name: "Bevan-PotanoSans", google: ["Bevan::latin", "Pontano+Sans::latin"]},
						{name: "BreeSerif-OpenSans", google: ["Bree+Serif::latin", "Open+Sans:300italic,400italic,600italic,700italic,800italic,400,300,600,700,800:latin"]},
						{name: "SansitaOne-Kameron", google: ["Sansita+One::latin", "Kameron:400,700:latin"]},
						{name: "Lora-Istok", google: ["Lora:400,700,400italic,700italic:latin", "Istok+Web:400,700,400italic,700italic:latin"]},
						{name: "Pacifico-Arimo", google: ["Pacifico::latin", "Arimo:400,700,400italic,700italic:latin"]}
					];
	if (typeof e == "object") {
		for (s in e) {
			Object.prototype.hasOwnProperty.call(e, s) && (h[s] = e[s]);
		}
	}
	typeof t != "undefined" && (h.source = t);
	if (typeof url_config == "object") {
		o = !0;
		h.source.match("docs.google.com") || h.source.match("json") || h.source.match("storify") || (h.source = "https://docs.google.com/spreadsheet/pub?key=" + h.source + "&output=html")
	}
	if (h.js.match("locale")) {
		h.lang = h.js.split("locale/")[1].replace(".js", "");
		h.js = c.js + "timeline-min.js?" + u
	}
	if (!h.js.match("/")) {
		h.css = c.css + h.type + ".css?" + u;
		h.js = c.js + h.type;
		h.debug ? h.js += ".js?" + u : h.js += "-min.js?" + u;
		h.id = "storyjs-" + h.type
	}
	h.lang.match("/") ? c.locale = h.lang : c.locale = c.locale + h.lang + ".js?" + u;
	T();
	LoadLib.css(h.css, w);
	if (h.font == "default") {
		l.font.js = !0;
		l.font.css = !0
	} else {
		var d;
		if (h.font.match("/")) {
			d = h.font.split(".css")[0].split("/");
			c.font.name = d[d.length - 1];
			c.font.css = h.font
		} else {
			c.font.name = h.font;
			c.font.css = c.font.css + h.font + ".css?" + u
		}
		LoadLib.css(c.font.css, E);
		for (var v = 0; v < p.length; v++) {
			if (c.font.name == p[v].name) {
				c.font.google = !0;
				WebFontConfig = {google: {families: p[v].google}}
			}
		}
		c.font.google ? LoadLib.js(c.font.js, S) : l.font.js = !0
	}
	try {
		l.has_jquery = jQuery;
		l.has_jquery = !0;
		if (l.has_jquery) {
			var f = parseFloat(jQuery.fn.jquery);
			f < parseFloat(a) ? l.jquery = !1 : l.jquery = !0
			l.jquery = true;
		}
	} catch (m) {
		l.jquery = !1
	}
	l.jquery ? g() : LoadLib.js(c.jquery, g);
	this.onloaded_check_again = function () {
		x()
	}
}
LazyLoad = function (e) {
	function u(t, n) {
		var r = e.createElement(t), i;
		for (i in n) {
			n.hasOwnProperty(i) && r.setAttribute(i, n[i]);
		}
		return r
	}

	function a(e) {
		var t = r[e], n, o;
		if (t) {
			n = t.callback;
			o = t.urls;
			o.shift();
			i = 0;
			if (!o.length) {
				n && n.call(t.context, t.obj);
				r[e] = null;
				s[e].length && l(e)
			}
		}
	}

	function f() {
		var n = navigator.userAgent;
		t = {async: e.createElement("script").async === !0};
		(t.webkit = /AppleWebKit\//.test(n)) || (t.ie = /MSIE/.test(n)) || (t.opera = /Opera/.test(n)) || (t.gecko = /Gecko\//.test(n)) || (t.unknown = !0)
	}

	function l(i, o, l, p, d) {
		var v = function () {
			a(i)
		}, m = i === "css", g = [], y, b, w, E, S, x;
		t || f();
		if (o) {
			o = typeof o == "string" ? [o] : o.concat();
			if (m || t.async || t.gecko || t.opera) {
				s[i].push({urls: o, callback: l, obj: p, context: d});
			} else {
				for (y = 0, b = o.length; y < b; ++y) {
					s[i].push({urls: [o[y]
					], callback: y === b - 1 ? l : null, obj: p, context: d})
				}
			}
		}
		if (r[i] || !(E = r[i] = s[i].shift())) {
			return;
		}
		n || (n = e.head || e.getElementsByTagName("head")[0]);
		S = E.urls;
		for (y = 0, b = S.length; y < b; ++y) {
			x = S[y];
			if (m) {
				w = t.gecko ? u("style") : u("link", {href: x, rel: "stylesheet"});
			} else {
				w = u("script", {src: x});
				w.async = !1
			}
			w.className = "lazyload";
			w.setAttribute("charset", "utf-8");
			if (t.ie && !m) {
				w.onreadystatechange = function () {
					if (/loaded|complete/.test(w.readyState)) {
						w.onreadystatechange = null;
						v()
					}
				};
			} else if (m && (t.gecko || t.webkit)) {
				if (t.webkit) {
					E.urls[y] = w.href;
					h()
				} else {
					w.innerHTML = '@import "' + x + '";';
					c(w)
				}
			} else {
				w.onload = w.onerror = v;
			}
			g.push(w)
		}
		for (y = 0, b = g.length; y < b; ++y) {
			n.appendChild(g[y])
		}
	}

	function c(e) {
		var t;
		try {
			t = !!e.sheet.cssRules
		} catch (n) {
			i += 1;
			i < 200 ? setTimeout(function () {
				c(e)
			}, 50) : t && a("css");
			return
		}
		a("css")
	}

	function h() {
		var e = r.css, t;
		if (e) {
			t = o.length;
			while (--t >= 0) {
				if (o[t].href === e.urls[0]) {
					a("css");
					break
				}
			}
			i += 1;
			e && (i < 200 ? setTimeout(h, 50) : a("css"))
		}
	}

	var t, n, r = {}, i = 0, s = {css: [], js: []}, o = e.styleSheets;
	return{css: function (e, t, n, r) {
		l("css", e, t, n, r)
	}, js: function (e, t, n, r) {
		l("js", e, t, n, r)
	}}
}(this.document);
LoadLib = function (e) {
	function n(e) {
		var n = 0, r = !1;
		for (n = 0; n < t.length; n++) {
			t[n] == e && (r = !0);
		}
		if (r) {
			return!0;
		}
		t.push(e);
		return!1
	}

	var t = [];
	return{css: function (e, t, r, i) {
		n(e) || LazyLoad.css(e, t, r, i)
	}, js: function (e, t, r, i) {
		n(e) || LazyLoad.js(e, t, r, i)
	}}
}(this.document);
var WebFontConfig;
if (typeof embed_path == "undefined" || typeof embed_path == "undefined") {
	var embed_path = getEmbedScriptPath("storyjs-embed.js").split("js/")[0];
}
(function () {
	typeof url_config == "object" ? createStoryJS(url_config) : typeof timeline_config == "object" ? createStoryJS(timeline_config) : typeof storyjs_config == "object" ? createStoryJS(storyjs_config) : typeof config == "object" && createStoryJS(config)
})();