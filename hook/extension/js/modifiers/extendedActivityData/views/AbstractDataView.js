var AbstractDataView = Fiber.extend(function(base) {

    return {

        content: '',

        grid: null,

        graph: null,

        table: null,

        init: function() {
            console.log('AbstractDataView::init');
        },

        render: function() {
            console.log('AbstractDataView::render');
        },

        getContent: function() {
            return this.content;
        },

        generateSectionTitle: function(title) {
            return "<h3>" + title + "</h3>"
        },

        generateGenericDistributionGraph: function() {
            var graph = '';
            graph += '<div>';
            graph += '<div style="display: inline-block;">';
            graph += 'graph here';
            graph += '</div>';
            graph += '</div>';
            this.graph = jQuery(graph);
            console.warn(this.graph.html());
        },

        generateGenericDistributionTable: function() {
            var table = '';
            table += '<div>';
            table += '<div style="display: inline-block;">';
            table += 'table here';
            table += '</div>';
            table += '</div>';
            this.table = jQuery(table);
        },

        makeGrid: function(columns, rows) {

            var grid = '';
            grid += '<div>';
            grid += '<div style="display: inline-block;">';
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
            grid += '</div>';
            this.grid = jQuery(grid);
        },

        insertContentAtGridPosition: function(columnId, rowId, content) {

            if (this.grid) {
                this.grid.find('[data-column=' + columnId + '][data-row=' + rowId + ']').html(content);
            } else {
                console.error('Grid is not initialized');
            }
        }
    }
});
