/**************************************************************************
* AngularJS-nvD3, v1.0.5; MIT License; 03/12/2015 08:27
* http://krispo.github.io/angular-nvd3
**************************************************************************/
(function(){

    'use strict';

    angular.module('nvd3', [])

        .directive('nvd3', ['nvd3Utils', function(nvd3Utils){
            return {
                restrict: 'AE',
                scope: {
                    data: '=',      //chart data, [required]
                    options: '=',   //chart options, according to nvd3 core api, [required]
                    api: '=?',      //directive global api, [optional]
                    events: '=?',   //global events that directive would subscribe to, [optional]
                    config: '=?',    //global directive configuration, [optional]
                    onReady: '&?' //callback function that is called with internal scope when directive is created [optional]
                },
                link: function(scope, element, attrs){
                    var defaultConfig = {
                        extended: false,
                        visible: true,
                        disabled: false,
                        refreshDataOnly: true,
                        deepWatchOptions: true,
                        deepWatchData: true,
                        deepWatchDataDepth: 2, // 0 - by reference (cheap), 1 - by collection item (the middle), 2 - by value (expensive)
                        debounce: 10 // default 10ms, time silence to prevent refresh while multiple options changes at a time
                    };

                    //flag indicates if directive and chart is ready
                    scope.isReady = false;

                    //basic directive configuration
                    scope._config = angular.extend(defaultConfig, scope.config);

                    //directive global api
                    scope.api = {
                        // Fully refresh directive
                        refresh: function(){
                            scope.api.updateWithOptions(scope.options);
                            scope.isReady = true;
                        },

                        // Fully refresh directive with specified timeout
                        refreshWithTimeout: function(t){
                            setTimeout(function(){
                                scope.api.refresh();
                            }, t);
                        },

                        // Update chart layout (for example if container is resized)
                        update: function() {
                            if (scope.chart && scope.svg) {
                                scope.svg.datum(scope.data).call(scope.chart);
                                // scope.chart.update();
                            } else {
                                scope.api.refresh();
                            }
                        },

                        // Update chart layout with specified timeout
                        updateWithTimeout: function(t){
                            setTimeout(function(){
                                scope.api.update();
                            }, t);
                        },

                        // Update chart with new options
                        updateWithOptions: function(options){
                            // Clearing
                            scope.api.clearElement();

                            // Exit if options are not yet bound
                            if (angular.isDefined(options) === false) return;

                            // Exit if chart is hidden
                            if (!scope._config.visible) return;

                            // Initialize chart with specific type
                            scope.chart = nv.models[options.chart.type]();

                            // Generate random chart ID
                            scope.chart.id = Math.random().toString(36).substr(2, 15);

                            angular.forEach(scope.chart, function(value, key){
                                if (key[0] === '_');
                                else if ([
                                        'clearHighlights',
                                        'highlightPoint',
                                        'id',
                                        'options',
                                        'resizeHandler',
                                        'state',
                                        'open',
                                        'close',
                                        'tooltipContent'
                                    ].indexOf(key) >= 0);

                                else if (key === 'dispatch') {
                                    if (options.chart[key] === undefined || options.chart[key] === null) {
                                        if (scope._config.extended) options.chart[key] = {};
                                    }
                                    configureEvents(scope.chart[key], options.chart[key]);
                                }

                                else if ([
                                        'bars',
                                        'bars1',
                                        'bars2',
                                        'boxplot',
                                        'bullet',
                                        'controls',
                                        'discretebar',
                                        'distX',
                                        'distY',
                                        'interactiveLayer',
                                        'legend',
                                        'lines',
                                        'lines1',
                                        'lines2',
                                        'multibar',
                                        'pie',
                                        'scatter',
                                        'sparkline',
                                        'stack1',
                                        'stack2',
                                        'sunburst',
                                        'tooltip',
                                        'x2Axis',
                                        'xAxis',
                                        'y1Axis',
                                        'y2Axis',
                                        'y3Axis',
                                        'y4Axis',
                                        'yAxis',
                                        'yAxis1',
                                        'yAxis2'
                                    ].indexOf(key) >= 0 ||
                                        // stacked is a component for stackedAreaChart, but a boolean for multiBarChart and multiBarHorizontalChart
                                    (key === 'stacked' && options.chart.type === 'stackedAreaChart')) {
                                    if (options.chart[key] === undefined || options.chart[key] === null) {
                                        if (scope._config.extended) options.chart[key] = {};
                                    }
                                    configure(scope.chart[key], options.chart[key], options.chart.type);
                                }

                                //TODO: need to fix bug in nvd3
                                else if ((key === 'xTickFormat' || key === 'yTickFormat') && options.chart.type === 'lineWithFocusChart');
                                else if ((key === 'tooltips') && options.chart.type === 'boxPlotChart');
                                else if ((key === 'tooltipXContent' || key === 'tooltipYContent') && options.chart.type === 'scatterChart');

                                else if (options.chart[key] === undefined || options.chart[key] === null){
                                    if (scope._config.extended) {
                                        if (key==='barColor')
                                            options.chart[key] = value()();
                                        else
                                            options.chart[key] = value();
                                    }
                                }

                                else scope.chart[key](options.chart[key]);
                            });

                            // Update with data
                            if (options.chart.type === 'sunburstChart') {
                                scope.api.updateWithData(angular.copy(scope.data));
                            } else {
                                scope.api.updateWithData(scope.data);
                            }

                            // Configure wrappers
                            if (options['title'] || scope._config.extended) configureWrapper('title');
                            if (options['subtitle'] || scope._config.extended) configureWrapper('subtitle');
                            if (options['caption'] || scope._config.extended) configureWrapper('caption');


                            // Configure styles
                            if (options['styles'] || scope._config.extended) configureStyles();

                            nv.addGraph(function() {
                                if (!scope.chart) return;

                                // Remove resize handler. Due to async execution should be placed here, not in the clearElement
                                if (scope.chart.resizeHandler) scope.chart.resizeHandler.clear();

                                // Update the chart when window resizes
                                scope.chart.resizeHandler = nv.utils.windowResize(function() {
                                    scope.chart && scope.chart.update && scope.chart.update();
                                });

                                /// Zoom feature
                                if (options.chart.zoom !== undefined && [
                                        'scatterChart',
                                        'lineChart',
                                        'candlestickBarChart',
                                        'cumulativeLineChart',
                                        'historicalBarChart',
                                        'ohlcBarChart',
                                        'stackedAreaChart'
                                    ].indexOf(options.chart.type) > -1) {
                                    nvd3Utils.zoom(scope, options);
                                }

                                return scope.chart;
                            }, options.chart['callback']);
                        },

                        // Update chart with new data
                        updateWithData: function (data){
                            if (data) {
                                // remove whole svg element with old data
                                d3.select(element[0]).select('svg').remove();

                                var h, w;

                                // Select the current element to add <svg> element and to render the chart in
                                scope.svg = d3.select(element[0]).append('svg');
                                if (h = scope.options.chart.height) {
                                    if (!isNaN(+h)) h += 'px'; //check if height is number
                                    scope.svg.attr('height', h).style({height: h});
                                }
                                if (w = scope.options.chart.width) {
                                    if (!isNaN(+w)) w += 'px'; //check if width is number
                                    scope.svg.attr('width', w).style({width: w});
                                } else {
                                    scope.svg.attr('width', '100%').style({width: '100%'});
                                }

                                scope.svg.datum(data).call(scope.chart);
                            }
                        },

                        // Fully clear directive element
                        clearElement: function (){
                            element.find('.title').remove();
                            element.find('.subtitle').remove();
                            element.find('.caption').remove();
                            element.empty();

                            // remove tooltip if exists
                            if (scope.chart && scope.chart.tooltip && scope.chart.tooltip.id) {
                                d3.select('#' + scope.chart.tooltip.id()).remove();
                            }

                            // To be compatible with old nvd3 (v1.7.1)
                            if (nv.graphs && scope.chart) {
                                for (var i = nv.graphs.length - 1; i >= 0; i--) {
                                    if (nv.graphs[i] && (nv.graphs[i].id === scope.chart.id)) {
                                        nv.graphs.splice(i, 1);
                                    }
                                }
                            }
                            if (nv.tooltip && nv.tooltip.cleanup) {
                                nv.tooltip.cleanup();
                            }
                            if (scope.chart && scope.chart.resizeHandler) scope.chart.resizeHandler.clear();
                            scope.chart = null;
                        },

                        // Get full directive scope
                        getScope: function(){ return scope; },

                        // Get directive element
                        getElement: function(){ return element; }
                    };

                    // Configure the chart model with the passed options
                    function configure(chart, options, chartType){
                        if (chart && options){
                            angular.forEach(chart, function(value, key){
                                if (key[0] === '_');
                                else if (key === 'dispatch') {
                                    if (options[key] === undefined || options[key] === null) {
                                        if (scope._config.extended) options[key] = {};
                                    }
                                    configureEvents(value, options[key]);
                                }
                                else if (key === 'tooltip') {
                                    if (options[key] === undefined || options[key] === null) {
                                        if (scope._config.extended) options[key] = {};
                                    }
                                    configure(chart[key], options[key], chartType);
                                }
                                else if (key === 'contentGenerator') {
                                    if (options[key]) chart[key](options[key]);
                                }
                                else if ([
                                        'axis',
                                        'clearHighlights',
                                        'defined',
                                        'highlightPoint',
                                        'nvPointerEventsClass',
                                        'options',
                                        'rangeBand',
                                        'rangeBands',
                                        'scatter',
                                        'open',
                                        'close'
                                    ].indexOf(key) === -1) {
                                    if (options[key] === undefined || options[key] === null){
                                        if (scope._config.extended) options[key] = value();
                                    }
                                    else chart[key](options[key]);
                                }
                            });
                        }
                    }

                    // Subscribe to the chart events (contained in 'dispatch')
                    // and pass eventHandler functions in the 'options' parameter
                    function configureEvents(dispatch, options){
                        if (dispatch && options){
                            angular.forEach(dispatch, function(value, key){
                                if (options[key] === undefined || options[key] === null){
                                    if (scope._config.extended) options[key] = value.on;
                                }
                                else dispatch.on(key + '._', options[key]);
                            });
                        }
                    }

                    // Configure 'title', 'subtitle', 'caption'.
                    // nvd3 has no sufficient models for it yet.
                    function configureWrapper(name){
                        var _ = nvd3Utils.deepExtend(defaultWrapper(name), scope.options[name] || {});

                        if (scope._config.extended) scope.options[name] = _;

                        var wrapElement = angular.element('<div></div>').html(_['html'] || '')
                            .addClass(name).addClass(_.className)
                            .removeAttr('style')
                            .css(_.css);

                        if (!_['html']) wrapElement.text(_.text);

                        if (_.enable) {
                            if (name === 'title') element.prepend(wrapElement);
                            else if (name === 'subtitle') angular.element(element[0].querySelector('.title')).after(wrapElement);
                            else if (name === 'caption') element.append(wrapElement);
                        }
                    }

                    // Add some styles to the whole directive element
                    function configureStyles(){
                        var _ = nvd3Utils.deepExtend(defaultStyles(), scope.options['styles'] || {});

                        if (scope._config.extended) scope.options['styles'] = _;

                        angular.forEach(_.classes, function(value, key){
                            value ? element.addClass(key) : element.removeClass(key);
                        });

                        element.removeAttr('style').css(_.css);
                    }

                    // Default values for 'title', 'subtitle', 'caption'
                    function defaultWrapper(_){
                        switch (_){
                            case 'title': return {
                                enable: false,
                                text: 'Write Your Title',
                                className: 'h4',
                                css: {
                                    width: scope.options.chart.width + 'px',
                                    textAlign: 'center'
                                }
                            };
                            case 'subtitle': return {
                                enable: false,
                                text: 'Write Your Subtitle',
                                css: {
                                    width: scope.options.chart.width + 'px',
                                    textAlign: 'center'
                                }
                            };
                            case 'caption': return {
                                enable: false,
                                text: 'Figure 1. Write Your Caption text.',
                                css: {
                                    width: scope.options.chart.width + 'px',
                                    textAlign: 'center'
                                }
                            };
                        }
                    }

                    // Default values for styles
                    function defaultStyles(){
                        return {
                            classes: {
                                'with-3d-shadow': true,
                                'with-transitions': true,
                                'gallery': false
                            },
                            css: {}
                        };
                    }

                    /* Event Handling */
                    // Watching on options changing
                    if (scope._config.deepWatchOptions) {
                        scope.$watch('options', nvd3Utils.debounce(function(newOptions){
                            if (!scope._config.disabled) scope.api.refresh();
                        }, scope._config.debounce, true), true);
                    }

                    // Watching on data changing
                    function dataWatchFn(newData, oldData) {
                        if (newData !== oldData){
                            if (!scope._config.disabled) {
                                scope._config.refreshDataOnly ? scope.api.update() : scope.api.refresh(); // if wanted to refresh data only, use update method, otherwise use full refresh.
                            }
                        }
                    }
                    if (scope._config.deepWatchData) {
                        if (scope._config.deepWatchDataDepth === 1) {
                            scope.$watchCollection('data', dataWatchFn);
                        } else {
                            scope.$watch('data', dataWatchFn, scope._config.deepWatchDataDepth === 2);
                        }
                    }

                    // Watching on config changing
                    scope.$watch('config', function(newConfig, oldConfig){
                        if (newConfig !== oldConfig){
                            scope._config = angular.extend(defaultConfig, newConfig);
                            scope.api.refresh();
                        }
                    }, true);

                    // Refresh chart first time if deepWatchOptions and deepWatchData are false
                    if (!scope._config.deepWatchOptions && !scope._config.deepWatchData) {
                        scope.api.refresh();
                    }

                    //subscribe on global events
                    angular.forEach(scope.events, function(eventHandler, event){
                        scope.$on(event, function(e, args){
                            return eventHandler(e, scope, args);
                        });
                    });

                    // remove completely when directive is destroyed
                    element.on('$destroy', function () {
                        scope.api.clearElement();
                    });

                    // trigger onReady callback if directive is ready
                    scope.$watch('isReady', function(isReady){
                        if (isReady) {
                            if (scope.onReady && typeof scope.onReady() === 'function') scope.onReady()(scope, element);
                        }
                    });
                }
            };
        }])

        .factory('nvd3Utils', function(){
            return {
                debounce: function(func, wait, immediate) {
                    var timeout;
                    return function() {
                        var context = this, args = arguments;
                        var later = function() {
                            timeout = null;
                            if (!immediate) func.apply(context, args);
                        };
                        var callNow = immediate && !timeout;
                        clearTimeout(timeout);
                        timeout = setTimeout(later, wait);
                        if (callNow) func.apply(context, args);
                    };
                },
                deepExtend: function(dst){
                    var me = this;
                    angular.forEach(arguments, function(obj) {
                        if (obj !== dst) {
                            angular.forEach(obj, function(value, key) {
                                if (dst[key] && dst[key].constructor && dst[key].constructor === Object) {
                                    me.deepExtend(dst[key], value);
                                } else {
                                    dst[key] = value;
                                }
                            });
                        }
                    });
                    return dst;
                },
                zoom: function(scope, options) {
                    var zoom = options.chart.zoom;

                    // check if zoom enabled
                    var enabled = (typeof zoom.enabled === 'undefined' || zoom.enabled === null) ? true : zoom.enabled;
                    if (!enabled) return;

                    var xScale = scope.chart.xAxis.scale()
                        , yScale = scope.chart.yAxis.scale()
                        , xDomain = scope.chart.xDomain || xScale.domain
                        , yDomain = scope.chart.yDomain || yScale.domain
                        , x_boundary = xScale.domain().slice()
                        , y_boundary = yScale.domain().slice()

                    // initialize zoom options
                        , scale = zoom.scale || 1
                        , translate = zoom.translate || [0, 0]
                        , scaleExtent = zoom.scaleExtent || [1, 10]
                        , useFixedDomain = zoom.useFixedDomain || false
                        , useNiceScale = zoom.useNiceScale || false
                        , horizontalOff = zoom.horizontalOff || false
                        , verticalOff = zoom.verticalOff || false
                        , unzoomEventType = zoom.unzoomEventType || 'dblclick.zoom'

                    // auxiliary functions
                        , fixDomain
                        , d3zoom
                        , zoomed
                        , unzoomed
                        ;

                    // ensure nice axis
                    if (useNiceScale) {
                        xScale.nice();
                        yScale.nice();
                    }

                    // fix domain
                    fixDomain = function (domain, boundary) {
                        domain[0] = Math.min(Math.max(domain[0], boundary[0]), boundary[1] - boundary[1] / scaleExtent[1]);
                        domain[1] = Math.max(boundary[0] + boundary[1] / scaleExtent[1], Math.min(domain[1], boundary[1]));
                        return domain;
                    };

                    // zoom event handler
                    zoomed = function () {
                        if (zoom.zoomed !== undefined) {
                            var domains = zoom.zoomed(xScale.domain(), yScale.domain());
                            if (!horizontalOff) xDomain([domains.x1, domains.x2]);
                            if (!verticalOff) yDomain([domains.y1, domains.y2]);
                        } else {
                            if (!horizontalOff) xDomain(useFixedDomain ? fixDomain(xScale.domain(), x_boundary) : xScale.domain());
                            if (!verticalOff) yDomain(useFixedDomain ? fixDomain(yScale.domain(), y_boundary) : yScale.domain());
                        }
                        scope.chart.update();
                    };

                    // unzoomed event handler
                    unzoomed = function () {
                        if (zoom.unzoomed !== undefined) {
                            var domains = zoom.unzoomed(xScale.domain(), yScale.domain());
                            if (!horizontalOff) xDomain([domains.x1, domains.x2]);
                            if (!verticalOff) yDomain([domains.y1, domains.y2]);
                        } else {
                            if (!horizontalOff) xDomain(x_boundary);
                            if (!verticalOff) yDomain(y_boundary);
                        }
                        d3zoom.scale(scale).translate(translate);
                        scope.chart.update();
                    };

                    // create d3 zoom handler
                    d3zoom = d3.behavior.zoom()
                        .x(xScale)
                        .y(yScale)
                        .scaleExtent(scaleExtent)
                        .on('zoom', zoomed);

                    scope.svg.call(d3zoom);

                    d3zoom.scale(scale).translate(translate).event(scope.svg);

                    if (unzoomEventType !== 'none') scope.svg.on(unzoomEventType, unzoomed);
                }
            };
        });
})();
