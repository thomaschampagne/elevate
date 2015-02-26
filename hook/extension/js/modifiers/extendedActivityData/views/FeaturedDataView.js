var FeaturedDataView = AbstractDataView.extend(function(base) {

    return {

        init: function() {
            console.log('FeaturedDataView::init');
            base.init.call(this);
        },

        render: function() {
            console.log('FeaturedDataView::render');
            base.render.call(this);
            this.content += 'FeaturedDataView html...';
        }
    }
});
