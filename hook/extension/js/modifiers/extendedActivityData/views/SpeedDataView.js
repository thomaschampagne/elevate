var SpeedDataView = AbstractDataView.extend(function(base) {

    return {

        init: function() {
            console.log('SpeedDataView::init');
            base.init.call(this);
        },

        render: function() {
            console.log('SpeedDataView::render');
            base.render.call(this);
            this.content += 'SpeedDataView html...';
        }
    }
});
