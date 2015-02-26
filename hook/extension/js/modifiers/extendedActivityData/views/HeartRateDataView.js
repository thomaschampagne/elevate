var HeartRateDataView = AbstractDataView.extend(function(base) {

    return {

        init: function() {
            console.log('HeartRateDataView::init');
            base.init.call(this);
        },

        render: function() {
            console.log('HeartRateDataView::render');
            base.render.call(this);
            this.content += 'HeartRateDataView html...';
        }
    }
});
