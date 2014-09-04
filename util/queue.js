/*global require, console, exports:true */

exports.Queue = function (startVal) {
    'use strict';
    var arr = [].concat(startVal),
        self = this;
    
    this.get = function (amount) {
        if (amount > arr.length) {
            amount = arr.length;
        }
        return arr.splice(0, amount);
    };
    
    this.getNext = function () {
        if (arr.length > 0) {
            return arr.shift();
        } else {
            return null;
        }
    };
    
    this.getLast = function () {
        if (arr.length > 0) {
            return arr.pop();
        } else {
            return null;
        }
    };
    
    this.add = function (val) {
        arr.push(val);
    };
    
    this.addMany = function (val) {
        arr.concat(val);
    };
    
    this.remove = function (val) {
        var index = arr.indexOf(val);
        if (index !== -1) {
            arr.splice(index, 1);
        }
    };
    
    this.removeMany = function (amount, start) {
        if (amount >= arr.length) {
            self.empty();
            return;
        }
        arr.splice(start, amount);
    };
    
    this.empty = function () {
        arr = [];
    };
    
    
};