var RunningExtendedActivityDataModifier = AbstractExtendedActivityDataModifier.extend(function(base) {

    return {


        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {
            base.init.call(this, analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity);
        },

        modify: function() {
            base.modify.call(this); // Super call
        },

        setDataViewsNeeded: function() {

            base.setDataViewsNeeded.call(this);

            // Pace view
            if (this.analysisData_.paceData && this.userSettings_.displayAdvancedSpeedData) {

                var measurementPreference = currentAthlete.get('measurement_preference');
                var units = (measurementPreference == 'meters') ? '/km' : '/mi';

                var paceDataView = new PaceDataView(this.analysisData_.paceData, units);
                paceDataView.setAppResources(this.appResources_);
                paceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(paceDataView);
            }

            if (this.analysisData_.cadenceData && this.userSettings_.displayCadenceData) {
                var runningCadenceDataView = new RunningCadenceDataView(this.analysisData_.cadenceData, 'spm', this.userSettings_);
                runningCadenceDataView.setAppResources(this.appResources_);
                runningCadenceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(runningCadenceDataView);
            }
            
            if (this.analysisData_.gradeData && this.userSettings_.displayAdvancedGradeData) {
                var gradeDataView = new GradeDataView(this.analysisData_.gradeData, '%');
                gradeDataView.setAppResources(this.appResources_);
                gradeDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(gradeDataView);
            }
        }
    }
});
