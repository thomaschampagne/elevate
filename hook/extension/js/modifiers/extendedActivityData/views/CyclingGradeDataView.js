var CyclingGradeDataView = AbstractGradeDataView.extend(function(base) {

    return {

        init: function(gradeData, units) {

            this.setViewId('CyclingGradeDataView_pdskdj4475');

            base.init.call(this, gradeData, units);
        },

        insertGradeDataIntoGrid: function() {

            base.insertGradeDataIntoGrid.call(this);

            var speedUnitPerhour = this.speedUnitsData[0];
            var speedUnitFactor = this.speedUnitsData[1];
            var distanceUnits = this.speedUnitsData[2];

            var avgClimbingSpeed = (this.gradeData.upFlatDownMoveData.up * speedUnitFactor).toFixed(1);
            var avgFlatSpeed = (this.gradeData.upFlatDownMoveData.flat * speedUnitFactor).toFixed(1);
            var avgDownhillSpeed = (this.gradeData.upFlatDownMoveData.down * speedUnitFactor).toFixed(1);

            this.insertContentAtGridPosition(0, 4, _.isNaN(avgClimbingSpeed) || avgClimbingSpeed == 'NaN' ? '-' : avgClimbingSpeed, 'Avg climbing speed', speedUnitPerhour, 'displayAdvancedGradeData', 'extendedStats/avg_climb_speed');
            this.insertContentAtGridPosition(1, 4, _.isNaN(avgFlatSpeed) || avgFlatSpeed == 'NaN' ? '-' : avgFlatSpeed, 'Avg flat speed', speedUnitPerhour, 'displayAdvancedGradeData', 'extendedStats/grade_data/avg_flt_speed');
            this.insertContentAtGridPosition(2, 4, _.isNaN(avgDownhillSpeed) || avgDownhillSpeed == 'NaN' ? '-' : avgDownhillSpeed, 'Avg downhill speed', speedUnitPerhour, 'displayAdvancedGradeData', 'extendedStats/grade_data/avg_dwnhill_speed');
        }
    }
});
