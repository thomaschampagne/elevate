var FeaturedDataView = AbstractDataView.extend(function(base) {

    return {

        analysisData: null,

        init: function(analysisData) {

            console.log('FeaturedDataView::init');

            base.init.call(this);

            this.hasGraph = false;

            if (!analysisData) {
                console.error('analysisData are empty');
            }

            this.analysisData = analysisData;

        },

        render: function() {

            console.log('FeaturedDataView::render');

            base.render.call(this);

            this.setViewId('FeaturedDataView_0as19sdqfd7f98q');

            // Add a title
            this.content += this.generateSectionTitle('Highlighted Stats');

            this.makeGrid(6, 1); // (col, row)

            this.insertFeaturedDataIntoGrid();

            this.content += '<div class="featuredData">' + this.grid.html() + '</div>';
        },


        insertFeaturedDataIntoGrid: function() {

            var speedUnitsData = this.getSpeedUnitData();
            var speedUnitPerhour = speedUnitsData[0];
            var speedUnitFactor = speedUnitsData[1];

            this.insertContentAtGridPosition(0, 0, this.analysisData.moveRatio.toFixed(2), 'Move Ratio', '', 'displayActivityRatio'); // Move ration
            this.insertContentAtGridPosition(1, 0, this.analysisData.toughnessScore.toFixed(0), 'Toughness Factor', '', 'displayMotivationScore'); // Toughness score
            this.insertContentAtGridPosition(2, 0, (this.analysisData.speedData.upperQuartileSpeed * speedUnitFactor).toFixed(1), '75% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData'); // Q3 Speed
            this.insertContentAtGridPosition(3, 0, this.analysisData.heartRateData.TRIMP.toFixed(0), 'TRaining IMPulse', '', 'displayAdvancedHrData');
            this.insertContentAtGridPosition(4, 0, this.analysisData.heartRateData.activityHeartRateReserve, '%Heart Rate Reserve Avg', '', 'displayAdvancedHrData');
            this.insertContentAtGridPosition(5, 0, 'TODO', 'Avg watt/kg', 'kph', 'displayAdvancedSpeedData'); // Avg watt /kg
        }
    }
});
