/*
 UriTemplates Template Processor - Version: @VERSION - Dated: @DATE
 (c) marc.portier@gmail.com - 2011-2012
 Licensed under ALPv2
 */

;
var uritemplate = (function() {

// Below are the functions we originally used from jQuery.
// The implementations below are often more naive then what is inside jquery, but they suffice for our needs.

    function isFunction(fn) {
        return typeof fn == 'function';
    }

    function isEmptyObject (obj) {
        for(var name in obj){
            return false;
        }
        return true;
    }

    function extend(base, newprops) {
        for (var name in newprops) {
            base[name] = newprops[name];
        }
        return base;
    }

    /**
     * Create a runtime cache around retrieved values from the context.
     * This allows for dynamic (function) results to be kept the same for multiple
     * occuring expansions within one template.
     * Note: Uses key-value tupples to be able to cache null values as well.
     */
        //TODO move this into prep-processing
    function CachingContext(context) {
        this.raw = context;
        this.cache = {};
    }
    CachingContext.prototype.get = function(key) {
        var val = this.lookupRaw(key);
        var result = val;

        if (isFunction(val)) { // check function-result-cache
            var tupple = this.cache[key];
            if (tupple !== null && tupple !== undefined) {
                result = tupple.val;
            } else {
                result = val(this.raw);
                this.cache[key] = {key: key, val: result};
                // NOTE: by storing tupples we make sure a null return is validly consistent too in expansions
            }
        }
        return result;
    };

    CachingContext.prototype.lookupRaw = function(key) {
        return CachingContext.lookup(this, this.raw, key);
    };

    CachingContext.lookup = function(me, context, key) {
        var result = context[key];
        if (result !== undefined) {
            return result;
        } else {
            var keyparts = key.split('.');
            var i = 0, keysplits = keyparts.length - 1;
            for (i = 0; i<keysplits; i++) {
                var leadKey = keyparts.slice(0, keysplits - i).join('.');
                var trailKey = keyparts.slice(-i-1).join('.');
                var leadContext = context[leadKey];
                if (leadContext !== undefined) {
                    return CachingContext.lookup(me, leadContext, trailKey);
                }
            }
            return undefined;
        }
    };


    function UriTemplate(set) {
        this.set = set;
    }

    UriTemplate.prototype.expand = function(context) {
        var cache = new CachingContext(context);
        var res = "";
        var i = 0, cnt = this.set.length;
        for (i = 0; i<cnt; i++ ) {
            res += this.set[i].expand(cache);
        }
        return res;
    };

//TODO: change since draft-0.6 about characters in literals
    /* extract:
     The characters outside of expressions in a URI Template string are intended to be copied literally to the URI-reference if the character is allowed in a URI (reserved / unreserved / pct-encoded) or, if not allowed, copied to the URI-reference in its UTF-8 pct-encoded form.
     */
    function Literal(txt ) {
        this.txt = txt;
    }

    Literal.prototype.expand = function() {
        return this.txt;
    };



    var RESERVEDCHARS_RE = new RegExp("[:/?#\\[\\]@!$&()*+,;=']","g");
    function encodeNormal(val) {
        return encodeURIComponent(val).replace(RESERVEDCHARS_RE, function(s) {return escape(s);} );
    }

//var SELECTEDCHARS_RE = new RegExp("[]","g");
    function encodeReserved(val) {
        //return encodeURI(val).replace(SELECTEDCHARS_RE, function(s) {return escape(s)} );
        return encodeURI(val); // no need for additional replace if selected-chars is empty
    }


    function addUnNamed(name, key, val) {
        return key + (key.length > 0 ? "=" : "") + val;
    }

    function addNamed(name, key, val, noName) {
        noName = noName || false;
        if (noName) { name = ""; }

        if (!key || key.length === 0)  {
            key = name;
        }
        return key + (key.length > 0 ? "=" : "") + val;
    }

    function addLabeled(name, key, val, noName) {
        noName = noName || false;
        if (noName) { name = ""; }

        if (!key || key.length === 0)  {
            key = name;
        }
        return key + (key.length > 0 && val ? "=" : "") + val;
    }


    var simpleConf = {
        prefix : "",     joiner : ",",     encode : encodeNormal,    builder : addUnNamed
    };
    var reservedConf = {
        prefix : "",     joiner : ",",     encode : encodeReserved,  builder : addUnNamed
    };
    var fragmentConf = {
        prefix : "#",    joiner : ",",     encode : encodeReserved,  builder : addUnNamed
    };
    var pathParamConf = {
        prefix : ";",    joiner : ";",     encode : encodeNormal,    builder : addLabeled
    };
    var formParamConf = {
        prefix : "?",    joiner : "&",     encode : encodeNormal,    builder : addNamed
    };
    var formContinueConf = {
        prefix : "&",    joiner : "&",     encode : encodeNormal,    builder : addNamed
    };
    var pathHierarchyConf = {
        prefix : "/",    joiner : "/",     encode : encodeNormal,    builder : addUnNamed
    };
    var labelConf = {
        prefix : ".",    joiner : ".",     encode : encodeNormal,    builder : addUnNamed
    };


    function Expression(conf, vars ) {
        extend(this, conf);
        this.vars = vars;
    }

    Expression.build = function(ops, vars) {
        var conf;
        switch(ops) {
            case ''  : conf = simpleConf; break;
            case '+' : conf = reservedConf; break;
            case '#' : conf = fragmentConf; break;
            case ';' : conf = pathParamConf; break;
            case '?' : conf = formParamConf; break;
            case '&' : conf = formContinueConf; break;
            case '/' : conf = pathHierarchyConf; break;
            case '.' : conf = labelConf; break;
            default  : throw "Unexpected operator: '"+ops+"'";
        }
        return new Expression(conf, vars);
    };

    Expression.prototype.expand = function(context) {
        var joiner = this.prefix;
        var nextjoiner = this.joiner;
        var buildSegment = this.builder;
        var res = "";
        var i = 0, cnt = this.vars.length;

        for (i = 0 ; i< cnt; i++) {
            var varspec = this.vars[i];
            varspec.addValues(context, this.encode, function(key, val, noName) {
                var segm = buildSegment(varspec.name, key, val, noName);
                if (segm !== null && segm !== undefined) {
                    res += joiner + segm;
                    joiner = nextjoiner;
                }
            });
        }
        return res;
    };



    var UNBOUND = {};

    /**
     * Helper class to help grow a string of (possibly encoded) parts until limit is reached
     */
    function Buffer(limit) {
        this.str = "";
        if (limit === UNBOUND) {
            this.appender = Buffer.UnboundAppend;
        } else {
            this.len = 0;
            this.limit = limit;
            this.appender = Buffer.BoundAppend;
        }
    }

    Buffer.prototype.append = function(part, encoder) {
        return this.appender(this, part, encoder);
    };

    Buffer.UnboundAppend = function(me, part, encoder) {
        part = encoder ? encoder(part) : part;
        me.str += part;
        return me;
    };

    Buffer.BoundAppend = function(me, part, encoder) {
        part = part.substring(0, me.limit - me.len);
        me.len += part.length;

        part = encoder ? encoder(part) : part;
        me.str += part;
        return me;
    };


    function arrayToString(arr, encoder, maxLength) {
        var buffer = new Buffer(maxLength);
        var joiner = "";

        var i = 0, cnt = arr.length;
        for (i=0; i<cnt; i++) {
            if (arr[i] !== null && arr[i] !== undefined) {
                buffer.append(joiner).append(arr[i], encoder);
                joiner = ",";
            }
        }
        return buffer.str;
    }

    function objectToString(obj, encoder, maxLength) {
        var buffer = new Buffer(maxLength);
        var joiner = "";
        var k;

        for (k in obj) {
            if (obj.hasOwnProperty(k) ) {
                if (obj[k] !== null && obj[k] !== undefined) {
                    buffer.append(joiner + k + ',').append(obj[k], encoder);
                    joiner = ",";
                }
            }
        }
        return buffer.str;
    }


    function simpleValueHandler(me, val, valprops, encoder, adder) {
        var result;

        if (valprops.isArr) {
            result = arrayToString(val, encoder, me.maxLength);
        } else if (valprops.isObj) {
            result = objectToString(val, encoder, me.maxLength);
        } else {
            var buffer = new Buffer(me.maxLength);
            result = buffer.append(val, encoder).str;
        }

        adder("", result);
    }

    function explodeValueHandler(me, val, valprops, encoder, adder) {
        if (valprops.isArr) {
            var i = 0, cnt = val.length;
            for (i = 0; i<cnt; i++) {
                adder("", encoder(val[i]) );
            }
        } else if (valprops.isObj) {
            var k;
            for (k in val) {
                if (val.hasOwnProperty(k)) {
                    adder(k, encoder(val[k]) );
                }
            }
        } else { // explode-requested, but single value
            adder("", encoder(val));
        }
    }

    function valueProperties(val) {
        var isArr = false;
        var isObj = false;
        var isUndef = true;  //note: "" is empty but not undef

        if (val !== null && val !== undefined) {
            isArr = (val.constructor === Array);
            isObj = (val.constructor === Object);
            isUndef = (isArr && val.length === 0) || (isObj && isEmptyObject(val));
        }

        return {isArr: isArr, isObj: isObj, isUndef: isUndef};
    }


    function VarSpec (name, vhfn, nums) {
        this.name = unescape(name);
        this.valueHandler = vhfn;
        this.maxLength = nums;
    }


    VarSpec.build = function(name, expl, part, nums) {
        var valueHandler, valueModifier;

        if (!!expl) { //interprete as boolean
            valueHandler = explodeValueHandler;
        } else {
            valueHandler = simpleValueHandler;
        }

        if (!part) {
            nums = UNBOUND;
        }

        return new VarSpec(name, valueHandler, nums);
    };


    VarSpec.prototype.addValues = function(context, encoder, adder) {
        var val = context.get(this.name);
        var valprops = valueProperties(val);
        if (valprops.isUndef) { return; } // ignore empty values
        this.valueHandler(this, val, valprops, encoder, adder);
    };



//----------------------------------------------parsing logic
// How each varspec should look like
    var VARSPEC_RE=/([^*:]*)((\*)|(:)([0-9]+))?/;

    var match2varspec = function(m) {
        var name = m[1];
        var expl = m[3];
        var part = m[4];
        var nums = parseInt(m[5], 10);

        return VarSpec.build(name, expl, part, nums);
    };


// Splitting varspecs in list with:
    var LISTSEP=",";

// How each template should look like
    var TEMPL_RE=/(\{([+#.;?&\/])?(([^.*:,{}|@!=$()][^*:,{}$()]*)(\*|:([0-9]+))?(,([^.*:,{}][^*:,{}]*)(\*|:([0-9]+))?)*)\})/g;
// Note: reserved operators: |!@ are left out of the regexp in order to make those templates degrade into literals
// (as expected by the spec - see tests.html "reserved operators")


    var match2expression = function(m) {
        var expr = m[0];
        var ops = m[2] || '';
        var vars = m[3].split(LISTSEP);
        var i = 0, len = vars.length;
        for (i = 0; i<len; i++) {
            var match;
            if ( (match = vars[i].match(VARSPEC_RE)) === null) {
                throw "unexpected parse error in varspec: " + vars[i];
            }
            vars[i] = match2varspec(match);
        }

        return Expression.build(ops, vars);
    };


    var pushLiteralSubstr = function(set, src, from, to) {
        if (from < to) {
            var literal = src.substr(from, to - from);
            set.push(new Literal(literal));
        }
    };

    var parse = function(str) {
        var lastpos = 0;
        var comp = [];

        var match;
        var pattern = TEMPL_RE;
        pattern.lastIndex = 0; // just to be sure
        while ((match = pattern.exec(str)) !== null) {
            var newpos = match.index;
            pushLiteralSubstr(comp, str, lastpos, newpos);

            comp.push(match2expression(match));
            lastpos = pattern.lastIndex;
        }
        pushLiteralSubstr(comp, str, lastpos, str.length);

        return new UriTemplate(comp);
    };


//-------------------------------------------comments and ideas

//TODO: consider building cache of previously parsed uris or even parsed expressions?

    return parse;

}());
