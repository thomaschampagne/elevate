var PowerDataView = AbstractDataView.extend(function(base) {

    return {

        init: function() {
            console.log('PowerDataView::init');
            base.init.call(this);
        },

        render: function() {
        	base.render.call(this);
        }
    }
});
