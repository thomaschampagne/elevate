var PowerDataView = AbstractDataView.extend(function(base) {

    return {

        init: function() {
            console.log('PowerDataView::init');
            base.init.call(this);
        },

        render: function() {
            console.log('PowerDataView::render');
            base.render.call(this);
            this.content += 'PowerDataView html...';
        }
    }
});
