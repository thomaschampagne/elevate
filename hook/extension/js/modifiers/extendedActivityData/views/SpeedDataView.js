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

            this.content += this.makeGrid(3, 2);
        },


    }
});
