/*global require, console, exports:true */
(function () {
    'use strict';
    var underscore = require("underscore");
    
    exports.stringify = function (obj) {
        var ret = "";
        underscore.each(obj, function (element, index, list) {
            ret += index + "=" + element + "&";
        });
        ret = ret.substr(0, ret.length - 1);
        console.log(ret);
        return ret;
    };
    
    exports.parse = function (string) {
        string = decodeURI(string);
        string = string.replace("?", "");
        var keypairs = string.split("&"),
            ret = {};
        underscore.each(keypairs, function (element, index, list) {
            var keypair = element.split("="),
                key = keypair[0],
                value = keypair[1];
            if (!isNaN(value)) {
                value = parseFloat(value);
            }
            ret[key] = value;
        });
        
        return ret;
                            
    };
    
}());