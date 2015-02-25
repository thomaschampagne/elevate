var HeartRateDataView = AbstractDataView.extend(function(base) {

    return {

        init: function() {
            console.log('HeartRateDataView::init');
            base.init.call(this);
        },

        render: function() {
        	base.render.call(this);
        	console.log('HeartRateDataView::render');
        }
    }
});
