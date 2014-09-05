/*global $, _, console, document, window, setTimeout, setInterval */

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

    /**
     * A anlias for a jquery function, in case I want to remove jquery.
     * @param {String}   url  A fully formatted url to make the request to
     * @param {Object}   data Data to be sent in a post
     * @param {function} func A callback function
     */
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
        var itemImgDiv = $('<div>'),
            spritesheet = itemImageInfo.sprite.replace('.png', ''),
    
            style = '-' + itemImageInfo.x + 'px -' + itemImageInfo.y + 'px';
        
        return itemImgDiv.addClass("img item-img spritesheet-" + spritesheet).css('background-position', style);
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
            /*var url = "/riotAPI/GetMatchHistory?name=" + $("#summonerName").val() +
                "&region=" + $("#region").val() +
                "&beginindex=" + 0 +
                "&endindex=" + 10;
            sendGetJSON(url, null, onGetMatchHistoryJSON);*/
            getAllMatchHistory( $("#region").val(), $("#summonerName").val())
        });
        $("#clearResponse").click(function () {
            $("#response").html('');
            $("#chart_container").html('');
            $("#item_container").html('');
        });
    });