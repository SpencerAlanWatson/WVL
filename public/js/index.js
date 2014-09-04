/*global $, _, console, document, window, setTimeout, setInterval */
(function () {
    'use strict';

    window.matchHistory = [];
    window.match = [];
    // Load the Visualization API and the piechart package.
    console.time("googleLoad");
    google.load('visualization', '1.0', {
        'packages': ['corechart']
    });
    window.socket = io();

    // Set a callback to run when the Google Visualization API is loaded.
    google.setOnLoadCallback(function () {
        console.timeEnd("googleLoad");
    });

    var names = [
        'Robo The Pichu',
        'PaperLuigi',
        'Kusmondo',
        'gunmage alpha',
        'Superchomat',
        'zero1goblin',
        'Dyrus',
        'Reginald',
        'Reginaid',
        'TheOddOne',
        'TheRainMan',
        'Chaox',
        'Robo The Pichu',
        'PaperLuigi',
        'Kusmondo',
        'gunmage alpha',
        'Superchomat',
        'zero1goblin',
        'Dyrus',
        'Reginald',
        'Reginaid',
        'TheOddOne',
        'TheRainMan',
        'Chaox'
    ];

    function sendGetJSON(url, data, func) {
        jQuery.getJSON(url, data, func);
    }

    function createItemImageElement(itemImageInfo) {

        /*
        <div class="img " style="height:48px; width:48px; background: url('//ddragon.leagueoflegends.com/cdn/4.15.1/img/sprite/item0.png') -0px -0px no-repeat;"></div>
        */
        /*
           "image": {
      "w": 48,
      "full": "3158.png",
      "sprite": "item1.png",
      "group": "item",
      "h": 48,
      "y": 144,
      "x": 432
   }
        */
        var cdnUrl = "//ddragon.leagueoflegends.com/cdn/4.15.1/img/sprite/" + itemImageInfo.sprite,
            style = 'height:' + itemImageInfo.h + 'px;';
        style += 'width:' + itemImageInfo.w + 'px;';
        style += 'background: url(\'' + cdnUrl + '\') ';
        style += '-' + itemImageInfo.x + 'px ';
        style += '-' + itemImageInfo.y + 'px ';
        style += 'no-repeat;';
        return $('<div class="img item-img" style="' + style + '">');
    }

    function onGetJSON(data) {
        console.info(data);
        $("#response").html($("#response").html() + js_beautify(JSON.stringify(data)) + "<br>");
    }

    function getItemImage(region, itemID, callback) {
        var url = "/riotAPI/GetItemImage?itemid=" + itemID + "&region=" + region;
        console.log(url);
        jQuery.get(url, null, function (data) {
            console.log(region, itemID, data);
            var img_div = createItemImageElement(data);
            $('#item_container').append(img_div);
            //callback(data);
        });
    }

    function onGetMatchHistoryJSON(data) {
        console.info(data);
        $("#response").html($("#response").html() + js_beautify(JSON.stringify(data)) + "<br>");
        plotSpentToEarned(data);
    }

    function getAllMatchHistory(region, summonerName) {
        var datatables = new google.visualization.DataTable(),
            maxEarned = 0,
            maxSpent = 0,
            percentAdd = 0.1,
            amountGames = 0,
            amountWins = 0,
            items = {},
            options = {
                title: 'Earned vs. Spent comparison',
                colors: ['red', 'green'],
                hAxis: {
                    title: 'Earned',
                    minValue: 0,
                    maxValue: maxEarned + (maxEarned * percentAdd),
                },
                vAxis: {
                    title: 'Spent',
                    minValue: 0,
                    maxValue: maxSpent + (maxSpent * percentAdd)
                },
                legend: 'none',
            },
            chart_div = document.createElement('div'),
            chart = new google.visualization.ScatterChart(chart_div);

        $(chart_div).addClass("chart");
        $("#chart_container").append(chart_div);

        datatables.addColumn('number', 'Earned');
        datatables.addColumn('number', 'Spent');
        datatables.addColumn('number', 'Spent won');
        /*{
            type: 'boolean',
            role: 'emphasis'
        });*/
        socket.emit('getAllMatchHistory', {
            'region': region,
            'summonerName': summonerName
        });
        socket.on('match', function (jsonData) {
            window.match.push(jsonData);
            console.log(jsonData);
        });
        socket.on('matchHistory', function (jsonData) {
            window.matchHistory.push(jsonData);
            _.each(jsonData.matches, function (element, index, list) {
                var stats = element['participants'][0].stats;

                maxEarned = stats.goldEarned > maxEarned ? stats.goldEarned : maxEarned;
                maxSpent = stats.goldSpent > maxSpent ? stats.goldSpent : maxSpent;
                amountGames++;
                if (stats.winner) {
                    amountWins++;
                    datatables.addRow([stats.goldEarned, null, stats.goldSpent]);

                } else {
                    datatables.addRow([stats.goldEarned, stats.goldSpent, null]);

                }

                options.hAxis.maxValue = maxEarned;
                options.vAxis.maxValue = maxSpent;
                chart.draw(datatables, options);

                for (var i = 0; i < 7; i++) {
                    var itemId = stats["item" + i];
                    if (!items[itemId])
                        items[itemId] = 0;
                    items[itemId]++;
                }
            });
        });

        socket.on('doneMatchHistory', function (data) {

            chart.draw(datatables, options);

            console.group();
            console.info("Most Earned:", maxEarned);
            console.info("Max Spent", maxSpent);
            console.info("Amount of Games Played", amountGames);
            console.info("Amount of Games Won", amountWins);
            console.info("Items", items);
            window.amountMatches = [amountWins, amountGames];
            window.items = items;
            console.groupEnd();
        });
    }
    window.getAllMatchHistory = getAllMatchHistory;
    $(document).ready(function () {
        $("#submit").click(function (event) {
            var url = "/riotAPI/GetID?name=" + $("#summonerName").val() + "&region=" + $("#region").val();
            sendGetJSON(url, null, onGetJSON);
        });
        $("#submitRF").click(function (event) {
            var url = '/riotAPI/GetID?region=na&name=';
            _.each(names, function (element, index, list) {
                sendGetJSON(url + element, null, onGetJSON);
            })
        });
        $("#submitMatchHistory").click(function (event) {
            var url = "/riotAPI/GetMatchHistory?name=" + $("#summonerName").val() +
                "&region=" + $("#region").val() +
                "&beginindex=" + 0 +
                "&endindex=" + 10;
            sendGetJSON(url, null, onGetMatchHistoryJSON);
        });
        $("#clearResponse").click(function () {
            $("#response").html('');
        });
    });

    function plotSpentToEarned(jsonData) {
        var data = new google.visualization.DataTable(),
            maxEarned = 0,
            maxSpent = 0,
            percentAdd = 0.1;
        data.addColumn('number', 'Earned');
        data.addColumn('number', 'Spent');
        data.addColumn({
            type: 'boolean',
            role: 'emphasis'
        });

        _.each(jsonData.matches, function (element, index, list) {
            var stats = element['participants'][0].stats;
            maxEarned = stats.goldEarned > maxEarned ? stats.goldEarned : maxEarned;
            maxSpent = stats.goldSpent > maxSpent ? stats.goldSpent : maxSpent;
            console.log(stats, stats.goldEarned, maxEarned)

            data.addRow([stats.goldEarned, stats.goldSpent, stats.winner]);
            for (var i = 0; i < 7; i++) {
                getItemImage(element.region, stats["item" + i], function (data) {});

            }
        });

        var options = {
            title: 'Earned vs. Spent comparison',
            hAxis: {
                title: 'Earned',
                minValue: 0,
                maxValue: maxEarned + (maxEarned * percentAdd),
            },
            vAxis: {
                title: 'Spent',
                minValue: 0,
                maxValue: maxSpent + (maxSpent * percentAdd)
            },
            legend: 'none',
        };
        console.log(options);
        var chart_div = document.createElement('div'),
            chart = new google.visualization.ScatterChart(chart_div);

        $(chart_div).addClass("chart");
        document.getElementById('chart_container').appendChild(chart_div);

        chart.draw(data, options);
    }
}());