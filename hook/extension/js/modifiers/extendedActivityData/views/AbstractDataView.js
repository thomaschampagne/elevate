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

        tooltipTemplate: "<%if (label){%><%=label%> during <%}%><%= Helper.secondsToHHMMSS(value * 60) %>",

        init: function() {

        },

        setViewId: function(id) {
            this.viewId = id;
        },

        setIsAuthorOfViewedActivity: function(bool) {
            this.isAuthorOfViewedActivity = bool;
        },

        setGraphTitle: function(title) {
            this.graphTitle = title;
        },

        setAppResources: function(appResources) {
            this.appResources = appResources;
        },

        render: function() {
            this.setGraphTitle((new String(this.units)).toUpperCase() + ' distribution in minutes');
        },

        getContent: function() {
            return this.content;
        },

        generateSectionTitle: function(title) {
            return "<h3 style='border-bottom: 3px solid rgb(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + "); color: rgb(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + "); padding-bottom: 5px;'># " + title + "</h3>";
        },

        generateCanvasForGraph: function() {

            if (!this.units) {
                console.error('View must have unit');
                return;
            }

            var graph = '';
            graph += '<div>';
            graph += '<div>';
            graph += '<div class="distributionGraphTitle">' + this.graphTitle + '</div>';
            graph += '<canvas id="' + this.viewId + '" height="450" width="450"></canvas>';
            graph += '</div>';
            graph += '</div>';
            this.graph = $(graph);
        },

        setupDistributionGraph: function(zones, ratio) {

            if (!ratio) {
                ratio = 1;
            }

            var labelsData = [];
            for (var zone in zones) {
                var label = "Z" + (parseInt(zone) + 1) + " " + (zones[zone].from * ratio).toFixed(1) + " to " + (zones[zone].to * ratio).toFixed(1) + " " + this.units;
                labelsData.push(label);
            }

            var distributionArray = [];
            for (var zone in zones) {
                distributionArray.push((zones[zone].s / 60).toFixed(2));
            }

            this.graphData = {
                labels: labelsData,
                datasets: [{
                    label: "Distribution",
                    fillColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.5)",
                    strokeColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.8)",
                    highlightFill: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.75)",
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
            var chart = new Chart(document.getElementById(this.viewId).getContext("2d")).Bar(this.graphData, {
                barShowStroke: false,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                showTooltips: true,
                tooltipTemplate: this.tooltipTemplate
            });

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
            table += '<div>';
            table += '<table class="distributionTable">';

            // Generate table header
            table += '<tr>'; // Zone
            table += '<td><strong>Zone</strong></td>'; // Zone
            table += '<td><strong>From ' + this.units.toUpperCase() + '</strong></td>'; // bpm
            table += '<td><strong>To ' + this.units.toUpperCase() + '</strong></td>'; // bpm
            table += '<td><strong>Time<br/>(hh:mm:ss)</strong></td>'; // Time
            table += '<td><strong>% in zone</strong></td>'; // % in zone
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

            if(_.isNaN(speed)) {
                return 0;
            }

            return (speed === 0) ? 'infinite' : parseInt((1 / speed) * 60 * 60);
        },
    }
});
