var CadenceDataView = AbstractDataView.extend(function(base) {

    return {

        init: function() {
            console.log('CadenceDataView::init');
            base.init.call(this);
        },

        render: function() {
            console.log('CadenceDataView::render');
            base.render.call(this);
            this.content += 'CadenceDataView html...';
        }
    }
});
