var AbstractDataView = Fiber.extend(function(base) {

    return {

        content: '',

        grid: null,

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
            grid += '<div>';
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
            grid += '</div>';
            this.grid = jQuery(grid);
        },

        insertContentAtGridPosition: function(columnId, rowId, content) {

            if(this.grid) {
                this.grid.find('[data-column=' + columnId + '][data-row=' + rowId + ']').html(content);
            } else {
                console.error('Grid is not initialized');
            }
        }
    }
});
