var FeaturedDataView = AbstractDataView.extend(function(base) {

    return {

        init: function() {
            console.log('FeaturedDataView::init');
            base.init.call(this);
        },

        render: function() {
        	base.render.call(this);
        }
    }
});
