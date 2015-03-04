var SpeedDataView = AbstractDataView.extend(function(base) {

    return {

        speedData: null,

        init: function(speedData) {

            console.log('SpeedDataView::init');

            base.init.call(this);

            this.speedData = speedData;

            this.setupDistributionGraph(this.speedData.speedZones, 'kph', [9, 123, 219]);

        },

        render: function() {

            console.log('SpeedDataView::render');

            // Super render () call
            base.render.call(this);

            this.setViewId('SpeedDataView_4smf8s7aG7ss1a');

            // Add a title
            this.content += this.generateSectionTitle('Speed Data');

            // Creates a grid
            this.makeGrid(3, 2); // (col, row)

            this.insertSpeedDataIntoGrid();
            this.generateCanvasForGraph();
            this.generateGenericDistributionTable();

            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();

            console.debug(this.content);
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
