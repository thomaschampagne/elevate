var AbstractDataView = Fiber.extend(function(base) {

    return {

        content: '',

        init: function() {
            console.log('AbstractDataView::init');
        },

        render: function() {
            console.log('AbstractDataView::render');

            //this.content = 'AbstractDataView html...';
        },

        getContent: function() {
            return this.content;
        },

        generateGenericDistributionGraph: function() {

        },

        makeGrid: function(columns, rows) {

            var grid = '';
            grid += '<table>';

            for (var i = 0; i < rows; i++) {
                grid += '<tr>';

                for (var j = 0; j < columns; j++) {

                    grid += '<td data-column="' + j + '" data-row="' + i + '">';
                    grid += 'data'; // place data here
                    grid += '</td>';
                }
                grid += '</tr>';
            }

            grid += '</table>';
            return grid;
        },

        insertContentAtGridPosition: function(columnId, rowId, content) {
            console.error('Must be implement');
        }
    }
});
