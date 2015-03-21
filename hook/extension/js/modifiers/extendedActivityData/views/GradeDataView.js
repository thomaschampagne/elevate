var GradeDataView = AbstractDataView.extend(function(base) {

    return {

        gradeData: null,

        mainColor: [0, 128, 0],

        init: function(gradeData, units) {

            this.setViewId('GradeDataView_pdskdj4475');

            base.init.call(this);

            this.units = units;

            this.gradeData = gradeData;

            this.setupDistributionGraph(this.gradeData.gradeZones);

            this.setupDistributionTable(this.gradeData.gradeZones);

        },

        render: function() {

            base.render.call(this);

            // Add a title
            this.content += this.generateSectionTitle('Grade stats');

            this.setGraphTitle('Grade % distribution over ' + this.gradeData.gradeZones.length + ' zones');

            // Creates a grid
            this.makeGrid(3, 3); // (col, row)

            this.insertGradeDataIntoGrid();
            this.generateCanvasForGraph();

            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();
        },

        insertGradeDataIntoGrid: function() {

            this.insertContentAtGridPosition(0, 1, this.gradeData.lowerQuartileGrade, '25% Quartile Grade', '%', 'todo');
            this.insertContentAtGridPosition(1, 1, this.gradeData.medianGrade, '50% Quartile Grade', '%', 'todo');
            this.insertContentAtGridPosition(2, 1, this.gradeData.upperQuartileGrade, '75% Quartile Grade', '%', 'todo');

            /*
            this.insertContentAtGridPosition(0, 0, this.gradeData.weightedPower.toFixed(0), 'Weighted Power', 'W', 'displayAdvancedPowerData');
            this.insertContentAtGridPosition(1, 0, this.gradeData.variabilityIndex.toFixed(2), 'Variability Index', '', 'displayAdvancedPowerData');

            if (this.gradeData.punchFactor) {
                this.insertContentAtGridPosition(2, 0, this.gradeData.punchFactor.toFixed(2), 'Punch Factor', '', 'displayAdvancedPowerData');
            }

            this.insertContentAtGridPosition(0, 1, this.gradeData.lowerQuartileWatts, '25% Quartile Watts', 'W', 'displayAdvancedPowerData');
            this.insertContentAtGridPosition(1, 1, this.gradeData.medianWatts, '50% Quartile Watts', 'W', 'displayAdvancedPowerData');
            this.insertContentAtGridPosition(2, 1, this.gradeData.upperQuartileWatts, '75% Quartile Watts', 'W', 'displayAdvancedPowerData');

            this.insertContentAtGridPosition(0, 2, this.gradeData.weightedWattsPerKg.toFixed(2), 'Weighted Watts/Kg', 'W/Kg', 'displayAdvancedPowerData');
            */
        }
    }
});
