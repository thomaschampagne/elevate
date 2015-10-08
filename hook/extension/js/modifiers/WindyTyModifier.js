/**
 *   WindyTyModifier is responsible of ...
 */
function WindyTyModifier(activityId, appResources) {
    this.activityId = activityId;
    this.appResources = appResources;
}
/**
 * Define prototype
 */

WindyTyModifier.prototype = {

    modify: function modify() {

        if (_.isUndefined(window.pageView)) {
            return;
        }

        this.getActivityBaryCenter(function(baryCenterPosition) {

            if(!baryCenterPosition) {
                console.log('Skipping WindyTyModifier execution, no baryCenterPosition available');
                return;
            }

            this.baryCenterPosition = baryCenterPosition;
            this.modifyPage_();
        }.bind(this));

    },

    // Externalize this to vacuum !!
    getActivityBaryCenter: function(callback) {

        var url = "/activities/" + this.activityId + "/streams?stream_types[]=latlng";

        $.ajax(url).done(function(jsonResponse) {

            if (_.isEmpty(jsonResponse.latlng)) {
                callback(null);
                return;
            }

            // Store first, middle and last position from latlng. These 3 position will help to findout barycenter position of th activity
            var firstMiddleLastPosition = [];
            firstMiddleLastPosition.push(jsonResponse.latlng[0]);
            firstMiddleLastPosition.push(jsonResponse.latlng[parseInt((jsonResponse.latlng.length - 1) / 2)]);
            firstMiddleLastPosition.push(jsonResponse.latlng[jsonResponse.latlng.length - 1]);


            var startPoint = jsonResponse.latlng[0];
            var midPoint = jsonResponse.latlng[parseInt((jsonResponse.latlng.length - 1) / 2)];
            var endPoint = jsonResponse.latlng[jsonResponse.latlng.length - 1];

            var approximativeBaryCenterPoint = [];

            // Add start + end vector
            approximativeBaryCenterPoint[0] = (startPoint[0] + endPoint[0]) / 2;
            approximativeBaryCenterPoint[1] = (startPoint[1] + endPoint[1]) / 2;

            // Add middPoint
            approximativeBaryCenterPoint[0] = (approximativeBaryCenterPoint[0] + midPoint[0]) / 2;
            approximativeBaryCenterPoint[1] = (approximativeBaryCenterPoint[1] + midPoint[1]) / 2;

            callback(new LatLon(approximativeBaryCenterPoint[0], approximativeBaryCenterPoint[1]));

        }.bind(this));
    },


    modifyPage_: function modifyPage_() {

        this.htmlWheatherStyle = 'background: #fc4c02; color: #333;';
        this.htmlRemoteViewTextStyle = 'color: white;';

        var remoteViewActivityLinksArray = [
            ['Wind', 'wind'],
            ['Temp', 'temp'],
            ['Clouds', 'clouds'],
            ['Humidity', 'rh'],
        ];

        var htmlWheather = "<li class='group'>";
        htmlWheather += "<div class='title'><span style='font-size: 14px;'><a id='stravistix_weather_title'>Weather</a></span> <img style='vertical-align:middle;width:16px' src='" + this.appResources.wheatherIcon + "'/></div>";
        htmlWheather += "<ul style='display: none;' id='stravistix_weatherList'>";
        $.each(remoteViewActivityLinksArray, function() {
            htmlWheather += "<li>";
            htmlWheather += "<a data-wheater-windyty='" + this[1] + "' href='#'>" + this[0] + "</a>";
            htmlWheather += "</li>";
        });
        htmlWheather += "</ul>";
        htmlWheather = $(htmlWheather);

        var self = this;

        $("#pagenav").append(htmlWheather).each(function() {

            $('[data-wheater-windyty]').click(function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                self.showWeather(this.getAttribute('data-wheater-windyty'));
            });

            $('#stravistix_weather_title').click(function(evt) {

                evt.preventDefault();
                evt.stopPropagation();

                if ($('#stravistix_weatherList').is(':visible')) {
                    $('#stravistix_weatherList').slideUp();
                } else {
                    $('#stravistix_weatherList').slideDown();
                }

            });

        });
    },

    showWeather: function(type) {

        var date = new Date(pageView.activity().get('startDateLocal') * 1000);
        var windyTyHour = Math.round(date.getUTCHours() / 6) * 6;
        windyTyHour = this.pad(windyTyHour, 2);
        var url = 'https://embed.windyty.com/?surface,' + type + ',' + date.toISOString().split('T')[0] + '-' + windyTyHour + ',' + this.baryCenterPosition.lat() + ',' + this.baryCenterPosition.lon() + ',20,,,message,';

        $.fancybox({
            'width': '100%',
            'height': '100%',
            'autoScale': true,
            'transitionIn': 'fade',
            'transitionOut': 'fade',
            'type': 'iframe',
            'content': '<iframe src="' + url + '" width="1000" height="700" frameborder="0"></iframe>'
        });
    },

    pad: function(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

};
