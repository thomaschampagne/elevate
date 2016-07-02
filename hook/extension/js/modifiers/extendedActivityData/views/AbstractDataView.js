var AbstractDataView = Fiber.extend(function(base) {

    return {

        viewId: null,

        viewTitle: '',

        units: null,

        content: '',

        grid: null,

        hasGraph: true,

        graph: null,

        graphData: null,

        graphTitle: '',

        mainColor: [0, 0, 0],

        table: null,

        appResources: null,

        isAuthorOfViewedActivity: null,

        isSegmentEffortView: null,

        init: function() {

        },

        setViewId: function(id) {
            this.viewId = id;
        },

        setIsSegmentEffortView: function(bool) {
            this.isSegmentEffortView = bool;
        },

        setIsAuthorOfViewedActivity: function(bool) {
            this.isAuthorOfViewedActivity = bool;
        },

        setGraphTitleFromUnits: function(units) {
            this.graphTitle = (('' + units).toUpperCase() + ' distribution in minutes');
        },

        setActivityType: function (type) {
            this.activityType = type;
        },

        setAppResources: function(appResources) {
            this.appResources = appResources;
        },

        render: function() {

        },

        getContent: function() {
            return this.content;
        },

        generateSectionTitle: function(title) {
            return "<h2 style='background-color: rgb(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + "); color: white; padding-bottom: 20px; padding-top: 20px;'><span style='padding-left: 10px;'>" + title + "</span></h2>";
        },

        generateCanvasForGraph: function() {

            if (!this.units) {
                console.error('View must have unit');
                return;
            }

            var graphWidth = window.innerWidth * 0.4;
            var screenRatio = window.innerWidth / window.innerHeight;

            // Apply bigger graph width if screen over 4/3...
            if (screenRatio - 0.1 > (4 / 3)) {
                graphWidth = graphWidth * 1.3;
            }

            var graph = '';
            graph += '<div>';
            graph += '<div>';
            graph += '<canvas id="' + this.viewId + '" height="450" width="' + graphWidth + '"></canvas>';
            graph += '</div>';
            this.graph = $(graph);
        },

        setupDistributionGraph: function(zones, ratio) {

            if (!ratio) {
                ratio = 1;
            }

            var labelsData = [];
            var zone;
            for (zone in zones) {
                var label = "Z" + (parseInt(zone) + 1) + " " + (zones[zone].from * ratio).toFixed(1).replace('.0', '') + " to " + (zones[zone].to * ratio).toFixed(1).replace('.0', '')  + " " + this.units;
                labelsData.push(label);
            }

            var distributionArray = [];
            for (zone in zones) {
                distributionArray.push((zones[zone].s / 60).toFixed(2));
            }

            this.graphData = {
                labels: labelsData,
                datasets: [{
                    label: this.graphTitle,
                    backgroundColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.5)",
                    borderColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 1)",
                    borderWidth: 1,
                    hoverBackgroundColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.8)",
                    hoverBorderColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 1)",
                    data: distributionArray
                }]
            };
        },

        displayGraph: function() {

            if (!this.viewId) {
                console.error('View Id must exist in ' + typeof this);
                return;
            }

            if (!this.hasGraph) {
                return;
            }

            // Generating the chart
            var ctx = document.getElementById(this.viewId).getContext("2d");
            this.chart = new Chart(ctx, {
                type: 'bar',
                data: this.graphData,
                options: {
                    showTooltips: true,
                    tooltips: {
                        custom: this.customTooltips
                    }
                }
            });
            this.chart = this.chart.clear();
        },

        customTooltips: function(tooltip) {

            // tooltip will be false if tooltip is not visible or should be hidden
            if (!tooltip || !tooltip.body || !tooltip.body[0] || !tooltip.body[0].lines || !tooltip.body[0].lines[0]) {
                return;
            }

            var lineValue = tooltip.body[0].lines[0];
            var timeInMinutes = _.first(lineValue.match(/[+-]?\d+(\.\d+)?/g).map(function(value) {
                return parseFloat(value);
            }));

            tooltip.body[0].lines[0] = 'Zone held during ' + Helper.secondsToHHMMSS(timeInMinutes * 60);
        },

        setupDistributionTable: function(zones, ratio) {

            if (!ratio) {
                ratio = 1;
            }

            if (!this.units) {
                console.error('View must have unit');
                return;
            }

            var table = '';
            table += '<div>';
            table += '<div style="height:500px; overflow:auto;">';
            table += '<table class="distributionTable">';

            // Generate table header
            table += '<tr>'; // Zone
            table += '<td>ZONE</td>'; // Zone
            table += '<td>FROM ' + this.units.toUpperCase() + '</td>'; // bpm
            table += '<td>TO ' + this.units.toUpperCase() + '</td>'; // bpm
            table += '<td>TIME</td>'; // Time
            table += '<td>% ZONE</td>'; // % in zone
            table += '</tr>';

            var zoneId = 1;
            for (var zone in zones) {
                table += '<tr>'; // Zone
                table += '<td>Z' + zoneId + '</td>'; // Zone
                table += '<td>' + (zones[zone].from * ratio).toFixed(1) + '</th>'; // %HRR
                table += '<td>' + (zones[zone].to * ratio).toFixed(1) + '</th>'; // %HRR
                table += '<td>' + Helper.secondsToHHMMSS(zones[zone].s) + '</td>'; // Time%
                table += '<td>' + zones[zone].percentDistrib.toFixed(1) + '%</td>'; // % in zone
                table += '</tr>';
                zoneId++;
            }

            table += '</table>';
            table += '</div>';
            table += '</div>';
            this.table = $(table);
        },

        makeGrid: function(columns, rows) {

            var grid = '';
            grid += '<div>';
            grid += '<div class="grid">';
            grid += '<table>';

            for (var i = 0; i < rows; i++) {
                grid += '<tr>';
                for (var j = 0; j < columns; j++) {
                    grid += '<td data-column="' + j + '" data-row="' + i + '">';
                    grid += '</td>';
                }
                grid += '</tr>';
            }
            grid += '</table>';
            grid += '</div>';
            grid += '</div>';
            this.grid = $(grid);
        },

        insertContentAtGridPosition: function(columnId, rowId, data, title, units, userSettingKey) {

            var onClickHtmlBehaviour = "onclick='javascript:window.open(\"" + this.appResources.settingsLink + "#/commonSettings?viewOptionHelperId=" + userSettingKey + "\",\"_blank\");'";

            if (this.grid) {
                var content = '<span class="gridDataContainer" ' + onClickHtmlBehaviour + '>' + data + ' <span class="gridUnits">' + units + '</span><br /><span class="gridTitle">' + title + '</span></span>';
                this.grid.find('[data-column=' + columnId + '][data-row=' + rowId + ']').html(content);
            } else {
                console.error('Grid is not initialized');
            }
        },

        getSpeedUnitData: function() {
            var measurementPreference = currentAthlete.get('measurement_preference');
            var units = (measurementPreference == 'meters') ? 'km' : 'mi';
            var speedUnitPerhour = (measurementPreference == 'meters') ? 'km/h' : 'mi/h';
            var speedUnitFactor = (speedUnitPerhour == 'km/h') ? 1 : 0.62137;
            return [speedUnitPerhour, speedUnitFactor, units];
        },

        /**
         * @param speed in kph
         * @return pace in seconds/km
         */
        convertSpeedToPace: function(speed) {

            if (_.isNaN(speed)) {
                return 0;
            }

            return (speed === 0) ? 'infinite' : parseInt((1 / speed) * 60 * 60);
        }
    };
});
