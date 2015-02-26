var AbstractDataView = Fiber.extend(function(base) {

    return {

    	content: '',

        init: function() {
            console.log('AbstractDataView::init');
        },

        render: function() {
            console.log('AbstractDataView::render');
            this.content = 'AbstractDataView html...';
        },

        getContent: function () {
        	return this.content;
        }

    }
});
