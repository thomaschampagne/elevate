var HeartRateDataView = AbstractDataView.extend(function(base) {

    return {

        heartRateData: null,

        init: function(heartRateData) {
            console.log('HeartRateDataView::init');
            base.init.call(this);

            this.heartRateData = heartRateData;
        },

        render: function() {
            console.log('HeartRateDataView::render');
            base.render.call(this);

            this.setViewId('HeartRateDataView_i79a78d98s9a7g7');

            // Add a title
            this.content += this.generateSectionTitle('HeartRate Data');

            // Creates a grid
            this.makeGrid(3, 3); // (col, row)

            this.insertSpeedDataIntoGrid();
            this.generateGenericDistributionGraph();
            this.generateGenericDistributionTable();

            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();
        },

        insertSpeedDataIntoGrid: function() {

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
