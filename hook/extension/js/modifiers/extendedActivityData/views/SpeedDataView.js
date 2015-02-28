var SpeedDataView = AbstractDataView.extend(function(base) {

    return {

        speedData: null,

        init: function(speedData) {

            console.log('SpeedDataView::init');

            base.init.call(this);

            this.speedData = speedData;

        },

        render: function() {

            console.log('SpeedDataView::render');

            // Super render () call
            base.render.call(this);

            // Add a title
            this.content += 'Speed Data';

            // Creates a grid
            this.makeGrid(3, 2);

            // Insert some data inside grid
            this.insertContentAtGridPosition(0, 1, '29 kph avg speed');

            // Push grid to content view
            this.content += this.grid.html(); 
        }
    }
});
