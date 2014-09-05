/*global $, _, console, document, window, setTimeout, setInterval */

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

function standardizeName(name) {
    return name.trim().toLowerCase().replace(/ /gi, '');
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
        chart_div = $('<div>').addClass("chart").appendTo("#chart_container")[0],
        chart = new google.visualization.ScatterChart(chart_div);

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
                getItem
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

function findParticipantIdInMatch(Match, summonerName) {
    _.filter(Match.participantIdentities
}