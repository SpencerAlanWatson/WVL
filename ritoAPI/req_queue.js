/*global require, console, exports:true, global */
exports.Start = function() {
    'use strict';
    var config = require("./config"),
        async = require("async"),
        request = require("request"),
        util = require(global.APP_DIR + "/util"),
        querystring = util.querystring,
        startedAt = new Date().getTime(),
        rateTimeObj = {
            'current': {
                'sec': 0,
                'min': 0
            },
            'startTime': {
                'sec': startedAt,
                'min': startedAt
            },
            'endTime': {
                'sec': startedAt + 10000,
                'min': startedAt + 600000
            },
            'nextTime': startedAt,
            'incCurrent': function() {
                this.current.sec += 1;
                this.current.min += 1;
            },
            'setStartTimeSec': function(start) {
                this.startTime.sec = start;
                this.endTime.sec = start + 10000;
            },
            'setStartTimeMin': function(start) {
                this.startTime.min = start;
                this.endTime.min = start + 600000;
            },
            'setStartTimes': function(startSec, startMin) {
                this.setStartTimeSec(startSec);
                this.setSTartTimeMin(startMin);
            }
        },
        timeoutID = 0,
        requestQueue = new util.Queue([]),
        requestCache = {};

    function checkRateLimit() {
        var rt = rateTimeObj,
            curTime = new Date().getTime();

        if (curTime >= rt.endTime.sec) {
            rt.current.sec = 0;
            rt.startTime.sec = curTime;
            rt.nextTime.sec = curTime;
            rt.endTime.sec = curTime + 10000;

        }
        if (curTime >= rt.endTime.min) {
            rt.current.min = 0;
            rt.startTime.min = curTime;
            rt.nextTime.min = curTime;
            rt.endTime.min = curTime + 600000;
        }
    }

    function getRate() {
        var rt = rateTimeObj,
            secRate = -1,
            minRate = -1,
            percentFilledSec = rt.current.sec / config.rateLimitPer10S,
            percentFilledMin = rt.current.min / config.rateLimitPer10M,
            remainingTimeSec = rt.endTime.sec - new Date().getTime(),
            remainingTimeMin = rt.endTime.min - new Date().getTime();

        if (percentFilledSec < 1.0) {
            secRate = 10000 / (config.rateLimitPer10S);
        }
        /* else if (percentFilledSec >= 0.50 && percentFilledSec < 0.75) {
            secRate = 10000 / (config.rateLimitPer10S);
        } else if (percentFilledSec >= 0.75 && percentFilledSec < 1.00) {
            secRate = remainingTimeSec / (config.rateLimitPer10S * (1 - percentFilledSec));
        }*/

        if (percentFilledMin < 0.90) {
            minRate = secRate;
        } else if (percentFilledMin >= 0.90 && percentFilledMin < 1) {
            minRate = remainingTimeMin / (config.rateLimitPer10M * (1 - percentFilledMin));
        }

        return secRate <= minRate ? secRate : minRate;
    }


    /*
        The req object:
        *region : string that signfies the region this request is for ex na
        *version: string for version of api ex: 1.2
        *api: the api you are making the request for ex: champion
        *rateLimit: bool stating whether or not this request counts towards the rate limit
        *pathParams: string containing parameters to go in the path of the req url, must be in order and be seperated by /
            *queryParams:  object containing parameters that go into the query string

    */
    function setupReqURL(req) {
        var URL = "https://" + req.region + config.baseURL,
            regionAndVersion = req.region + "/v" + req.version + "/",
            pathAndQueryParams = req.pathParams + "?api_key=" + config.riotApiKey + "&" + querystring.stringify(req.queryParams);

        if (req.api === "static-data") {
            URL += "static-data/" + regionAndVersion + pathAndQueryParams;
            console.log(URL);
        } else {
            URL += regionAndVersion + req.api + "/" + pathAndQueryParams;
        }
        //console.info(URL);
        return URL;
    }

    function sendReq(url, callback) {
        request({
            url: url,
            json: true
        }, callback);
    }

    function CheckCache(url, callback) {
        if (requestCache[url] && requestCache[url].time + 30000 > new Date().getTime()) {
            callback(null, requestCache[url].data);
            return true;
        }
        return false;
    }

    function addReq(req, callback) {
        var url = setupReqURL(req);
                    console.log(url);

        if (CheckCache(url, callback))
            return;
        if (req.rateLimit) {
            requestQueue.add({
                'url': url,
                'callback': callback
            });
        } else {
            sendReq(url, function(error, incMsg, jsonData) {
                callback(error, jsonData);
            });
        }
    }


    function requestQueueLoop(next) {
        checkRateLimit();
        /*if (new Date().getTime() < rateTimeObj.nextTime) {
            console.log("curTime is less than nextTime", new Date().getTime(), rateTimeObj.nextTime);
            timeoutID = setTimeout(next, rateTimeObj.nextTime - new Date().getTime());
            return;
        }*/

        var rate = getRate(),
            curTime = new Date().getTime(),
            nextReq = requestQueue.getNext();

        if (nextReq !== null) {
            if (CheckCache(nextReq.url, nextReq.callback)) {
                timeoutID = setTimeout(next, 0);
                return;
            }
            rateTimeObj.nextTime = curTime + rate;
            rateTimeObj.incCurrent();
            console.info(rate);
            sendReq(nextReq.url,
                function(error, incMsg, jsonData) {
                    if (jsonData.status && jsonData.status.status_code === 429) {
                        console.warn("Warning: Rate limit exceeded");
                    } else {
                        requestCache[nextReq.url] = {
                            'time': new Date().getTime(),
                            'data': jsonData
                        }
                    }
                    nextReq.callback(error, jsonData);
                    timeoutID = setTimeout(next, rate);

                });
        } else {
            timeoutID = setTimeout(next, 0);
        }


    }


    function makeReqObj(api, region, version, pathParams, rateLimit, queryParams) {
        return {
            'api': api,
            'region': region,
            'version': version,
            'rateLimit': rateLimit,
            'pathParams': pathParams,
            'queryParams': queryParams
        };
    }
    exports.addReq = addReq;
    exports.makeReqObj = makeReqObj;

    async.forever(requestQueueLoop, function(err) {
        throw err;
    });
    return exports;
};