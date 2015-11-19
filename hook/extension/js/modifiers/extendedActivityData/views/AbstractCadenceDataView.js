var AbstractCadenceDataView = AbstractDataView.extend(function(base) {

    return {

        cadenceData: null,

        mainColor: [213, 0, 195],

        init: function(cadenceData) {

            base.init.call(this);

            this.cadenceData = cadenceData;

            this.setupDistributionGraph(this.cadenceData.cadenceZones);

            this.setupDistributionTable(this.cadenceData.cadenceZones);

            this.viewTitle = 'CADENCE';

        },

        render: function() {

            base.render.call(this);

            // Add a title
            this.content += this.generateSectionTitle(this.viewTitle);
        }
    }
});
