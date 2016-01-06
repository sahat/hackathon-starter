var apiGateway = apiGateway || {};
apiGateway.core = apiGateway.core || {};

apiGateway.core.utils = {
    assertDefined: function (object, name) {
        if (object === undefined) {
            throw name + ' must be defined';
        } else {
            return object;
        }
    },
    assertParametersDefined: function (params, keys, ignore) {
        if (keys === undefined) {
            return;
        }
        if (keys.length > 0 && params === undefined) {
            params = {};
        }
        for (var i = 0; i < keys.length; i++) {
            if(!apiGateway.core.utils.contains(ignore, keys[i])) {
                apiGateway.core.utils.assertDefined(params[keys[i]], keys[i]);
            }
        }
    },
    parseParametersToObject: function (params, keys) {
        if (params === undefined) {
            return {};
        }
        var object = { };
        for (var i = 0; i < keys.length; i++) {
            object[keys[i]] = params[keys[i]];
        }
        return object;
    },
    contains: function(a, obj) {
        if(a === undefined) { return false;}
        var i = a.length;
        while (i--) {
            if (a[i] === obj) {
                return true;
            }
        }
        return false;
    },
    copy: function (obj) {
        if (null == obj || "object" != typeof obj) return obj;
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }
        return copy;
    },
    mergeInto: function (baseObj, additionalProps) {
        if (null == baseObj || "object" != typeof baseObj) return baseObj;
        var merged = baseObj.constructor();
        for (var attr in baseObj) {
            if (baseObj.hasOwnProperty(attr)) merged[attr] = baseObj[attr];
        }
        if (null == additionalProps || "object" != typeof additionalProps) return baseObj;
        for (attr in additionalProps) {
            if (additionalProps.hasOwnProperty(attr)) merged[attr] = additionalProps[attr];
        }
        return merged;
    }
};
