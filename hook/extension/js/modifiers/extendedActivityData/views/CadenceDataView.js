var CadenceDataView = AbstractDataView.extend(function(base) {

    return {

        cadenceData: null,

        mainColor: [213, 0, 195],

        init: function(cadenceData) {

            console.log('CadenceDataView::init');

            base.init.call(this);

            this.cadenceData = cadenceData;

            this.setupDistributionGraph(this.cadenceData.cadenceZones, 'rpm');

            this.setupDistributionTable(this.cadenceData.cadenceZones, 'rpm');

        },

        render: function() {

            console.log('CadenceDataView::render');

            base.render.call(this);

            this.setViewId('CadenceDataView_p8a5d4gl56ds4');

            // Add a title
            this.content += this.generateSectionTitle('Cadence Data');

            this.setGraphTitle('Cadence distribution over ' + this.cadenceData.cadenceZones.length + ' zones');

            // Creates a grid
            this.makeGrid(3, 3); // (col, row)

            this.insertCadenceDataIntoGrid();
            this.generateCanvasForGraph();

            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();
        },

        insertCadenceDataIntoGrid: function() {

            // Insert some data inside grid
            this.insertContentAtGridPosition(0, 0, '29');
            this.insertContentAtGridPosition(1, 0, '243');
            this.insertContentAtGridPosition(2, 0, '776');

            this.insertContentAtGridPosition(0, 1, '29');
            this.insertContentAtGridPosition(1, 1, '100');
            this.insertContentAtGridPosition(2, 1, '300');
        }
    }
});
