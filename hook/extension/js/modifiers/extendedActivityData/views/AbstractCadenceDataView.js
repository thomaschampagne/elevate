var AbstractCadenceDataView = AbstractDataView.extend(function(base) {

    return {

        cadenceData: null,

        mainColor: [213, 0, 195],

        init: function(cadenceData) {

            console.log('AbstractCadenceDataView::init');

            base.init.call(this);

            this.cadenceData = cadenceData;

            this.setupDistributionGraph(this.cadenceData.cadenceZones);

            this.setupDistributionTable(this.cadenceData.cadenceZones);

        },

        render: function() {

            console.log('AbstractCadenceDataView::render');

            base.render.call(this);

            // Add a title
            this.content += this.generateSectionTitle('Cadence stats');

            this.setGraphTitle('Cadence distribution over ' + this.cadenceData.cadenceZones.length + ' zones');
        }
    }
});
