/*global require, console, exports:true */
exports.setup = function (app, io, callback) {
    'use strict';
    var config = require("./config"),
        reqQueue = require("./req_queue").Start(),
        beautify = require('js-beautify').js_beautify,
        async = require("async"),
        underscore = require("underscore"),
        ItemList = {};


    function fixStringUndefined(val) {
        return typeof val === 'undefined' ? '' : val;
    }
    exports.standardizeName = function (name) {
        return name.trim().toLowerCase().replace(/ /gi, '');
    }
    exports.getSummoner = function (region, name, callback) {
        var reqObj = reqQueue.makeReqObj('summoner', region, '1.4', 'by-name/' + name, true);
        reqQueue.addReq(reqObj, callback);
    };
    exports.getMatchHistory = function (region, name, callback, beginIndex, endIndex, rankedQueues, championIds) {
        exports.getSummoner(region, name, function (err, data) {
            if (err) {
                callback(err);
                return;
            }
            console.log(summonerID, name, exports.standardizeName(name));

            var summonerID = data[exports.standardizeName(name)].id;
            var reqObj = reqQueue.makeReqObj('matchhistory', region, '2.2', summonerID, true, {
                'beginIndex': fixStringUndefined(beginIndex),
                'endIndex': fixStringUndefined(endIndex),
                'rankedQueues': fixStringUndefined(rankedQueues),
                'championIds': fixStringUndefined(championIds)
            });

            reqQueue.addReq(reqObj, callback);
        });
    };
    exports.getMatch = function (region, matchId, callback, includeTimeline) {
        var reqObj = reqQueue.makeReqObj('match', region, '2.2', matchId, true, {
            'includeTimeline': fixStringUndefined(includeTimeline),
        });

        reqQueue.addReq(reqObj, callback);
    };

    exports.getItemInfo = function (region, itemID, callback, itemData, locale, version) {
        var reqObj = reqQueue.makeReqObj('static-data', region, '1.2', 'item/' + itemID, false, {
            'itemData': fixStringUndefined(itemData),
            'locale': fixStringUndefined(locale),
            'version': fixStringUndefined(version),
        });
        console.log(reqObj);
        reqQueue.addReq(reqObj, callback)
    }

    app.get("/riotAPI/GetID", function (req, res) {
        exports.getSummoner(req.query.region, req.query.name, function (err, data) {
            if (err) {
                res.status(500);
            } else {
                res.status(200);
            }
            res.json(data);
        });
    });

    app.get("/riotAPI/GetMatchHistory", function (req, res) {
        var callbackFunc = function (err, data) {
            if (err) {
                res.status(500);
            } else {
                res.status(200);
            }
            res.json(data);
        }
        exports.getMatchHistory(req.query.region, req.query.name, callbackFunc, req.query.beginindex, req.query.endindex, req.query.rankedqueues, req.query.championids);

    });

    app.get("/riotAPI/getItemImage", function (req, res) {
        var itemId = Number(req.query.itemid);
        if (itemId === 0) {
            res.json(ItemList.basic.image);
        } else {
            res.json(ItemList.data[itemId].image);
        }
    });
    reqQueue.addReq(reqQueue.makeReqObj('static-data', 'na', '1.2', 'item', false, {
        'itemListData': 'all'
    }), function (err, data) {
        ItemList = data;
        app.get("/riotAPI/getItemList", function (req, res) {
            res.json(data);
        });
        callback();
    });
    io.on('connection', function (socket) {
        console.log('a user connected, this is in ritoAPI');
        socket.on('disconnect', function (msg) {
            console.log('a user disconnected, this is in ritoAPI')
        });
        socket.on('getAllMatchHistory', function (data) {
            var going = true,
                inc = 15,
                start = 0,
                end = inc;
            async.forever(function (next) {

                    exports.getMatchHistory(data.region, data.summonerName, function (err, matchHistoryJSON) {
                        if (err) {
                            next(err);
                            return;
                        } else if (!matchHistoryJSON || !matchHistoryJSON.matches || matchHistoryJSON.matches.length === 0) {
                            next("finished");
                            return;
                        }

                        underscore.each(matchHistoryJSON.matches, function (element, index, list) {
                            exports.getMatch(data.region, element.matchId, function (err, data) {
                                if (err) {
                                    throw err;
                                }
                                socket.emit('match', data);
                            }, true);
                        });
                    }, start, end, '', '');
                    start += inc;
                    end += inc;

                },
                function (err) {
                    socket.emit('doneMatchHistory', err);
                    if (err !== 'finished')
                        throw err;
                });

        });
    });
};