var SpeedDataView = AbstractDataView.extend(function(base) {

    return {

        init: function() {
            console.log('SpeedDataView::init');
            base.init.call(this);
        },

        render: function() {
        	base.render.call(this);
        	console.log('SpeedDataView::render');
        }
    }
});
