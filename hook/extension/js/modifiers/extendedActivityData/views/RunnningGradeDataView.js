var RunnningGradeDataView = AbstractGradeDataView.extend(function(base) {

    return {

        init: function(gradeData, units) {

            this.setViewId('RunnningGradeDataView_pdskdj4475');

            base.init.call(this, gradeData, units);
        },

        insertGradeDataIntoGrid: function() {

            base.insertGradeDataIntoGrid.call(this);

            var speedUnitPerhour = this.speedUnitsData[0];
            var speedUnitFactor = this.speedUnitsData[1];
            var distanceUnits = this.speedUnitsData[2];

            this.gradeData.upFlatDownMoveData.up = this.convertSpeedToPace(this.gradeData.upFlatDownMoveData.up);
            this.gradeData.upFlatDownMoveData.flat = this.convertSpeedToPace(this.gradeData.upFlatDownMoveData.flat);
            this.gradeData.upFlatDownMoveData.down = this.convertSpeedToPace(this.gradeData.upFlatDownMoveData.down);

            this.insertContentAtGridPosition(0, 4, (this.gradeData.upFlatDownMoveData.up / speedUnitFactor != 0) ? Helper.secondsToHHMMSS((this.gradeData.upFlatDownMoveData.up / speedUnitFactor).toFixed(0)).replace('00:', '') : '-', 'Avg climbing pace', '/' + distanceUnits, 'displayAdvancedGradeData');
            this.insertContentAtGridPosition(1, 4, (this.gradeData.upFlatDownMoveData.flat / speedUnitFactor != 0) ? Helper.secondsToHHMMSS((this.gradeData.upFlatDownMoveData.flat / speedUnitFactor).toFixed(0)).replace('00:', '') : '-', 'Avg flat pace', '/' + distanceUnits, 'displayAdvancedGradeData');
            this.insertContentAtGridPosition(2, 4, (this.gradeData.upFlatDownMoveData.down / speedUnitFactor != 0) ? Helper.secondsToHHMMSS((this.gradeData.upFlatDownMoveData.down / speedUnitFactor).toFixed(0)).replace('00:', '') : '-', 'Avg downhill pace', '/' + distanceUnits, 'displayAdvancedGradeData');
        }
    }
});
