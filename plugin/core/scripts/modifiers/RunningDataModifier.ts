abstract class AbstractRunningDataModifier implements IModifier {

    public static INTERVAL_DELAY: number = 750;
    protected intervalId: number;
    protected dataWatch: string;

    constructor(dataWatch: string) {
        this.dataWatch = dataWatch;
    }

    public modify(): void {
        this.intervalId = setInterval(() => {
            let element: JQuery = $('#elevation-profile td[data-type=' + this.dataWatch + '] .toggle-button')
                .not('.once-only')
                .addClass('once-only');

            if (element.length === 0) {
                clearInterval(this.intervalId);
            }

            element.click();

            if ($('#elevation-profile td[data-type=' + this.dataWatch + ']').find('.active').length) {
                clearInterval(this.intervalId);
            }
        }, AbstractRunningDataModifier.INTERVAL_DELAY);
    }

}

class RunningHeartRateModifier extends AbstractRunningDataModifier {
    constructor() {
        super('heartrate');
    }
}


class RunningCadenceModifier extends AbstractRunningDataModifier {
    constructor() {
        super('cadence');
    }
}

class RunningTemperatureModifier extends AbstractRunningDataModifier {
    constructor() {
        super('temp');
    }
}

class RunningGradeAdjustedPaceModifier extends AbstractRunningDataModifier {
    constructor() {
        super('grade_adjusted_pace');
    }
}