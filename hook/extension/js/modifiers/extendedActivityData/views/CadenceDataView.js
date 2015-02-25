var CadenceDataView = AbstractDataView.extend(function(base) {

    return {

        init: function() {
            console.log('CadenceDataView::init');
            base.init.call(this);
        },

        render: function() {
        	base.render.call(this);
        }
    }
});
