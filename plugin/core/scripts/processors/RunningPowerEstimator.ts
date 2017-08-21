import * as _ from "lodash";
import {InconsistentParameters} from "../../../common/scripts/exceptions/InconsistentParameters";

export class RunningPowerEstimator {
    /**
     * Create Running Power stream estimation
     * @param athleteWeight Mass of athlete in KG
     * @param distanceArray
     * @param timeArray
     * @param altitudeArray
     * @returns {Array<number>} Array of power
     */
    public static createRunningPowerEstimationStream(athleteWeight: number, distanceArray: Array<number>,
                                                     timeArray: Array<number>, altitudeArray: Array<number>): Array<number> {

        console.log("Estimating power data stream from athleteWeight (%d kg) and grade adjusted distance", athleteWeight);

        if (!_.isNumber(athleteWeight)) {
            throw new InconsistentParameters("athleteWeight required as number");
        }

        if (!_.isArray(distanceArray)) {
            throw new InconsistentParameters("distanceArray required as array");
        }

        if (!_.isArray(timeArray)) {
            throw new InconsistentParameters("timeArray required as array");
        }

        let powerStream: Array<number> = [];
        for (let i = 0; i < timeArray.length; i++) {
            let power = 0;
            if (i > 0) {
                const time = timeArray[i] - timeArray[i - 1];
                const distanceAdjusted = distanceArray[i] - distanceArray[i - 1];
                const elevationGain = altitudeArray[i] - altitudeArray[i - 1];
                power = this.estimateRunningPower(athleteWeight, distanceAdjusted, time, elevationGain);
            }
            powerStream.push(power);
        }
        return powerStream;
    }

    /**
     * Return a power estimation from athlete weight and speed (m/s)
     * https://alancouzens.com/blog/Run_Power.html (iframe https://alancouzens.com/blog/run_power.html)
     * http://sprott.physics.wisc.edu/technote/walkrun.htm
     * @param {number} weightKg
     * @param {number} meters
     * @param {number} seconds
     * @param elevationGain
     * @returns {number} power watts
     */
    public static estimateRunningPower(weightKg: number, meters: number, seconds: number, elevationGain: number): number {
        const speed = meters / seconds;
        const speedKph = (meters / seconds) / 3600;
        const minutes = seconds / 60;
        const km = meters / 1000;
        const minPerKmPace = minutes / km;
        const VO2Reserve = 210 / minPerKmPace;
        const VO2A = (VO2Reserve * weightKg) / 1000;
        const horizontalWatts = (75 * VO2A);
        // const VWatts = 0; //((9.8 * weight) * (elevationGain)) / (minutes * 60);
        // const verticalWatts = (9.8 * weightKg)  / seconds;
        // const verticalWatts = ((weightKg * 9.81 * speed ) / 4) / seconds;
        // const verticalWatts = ((weightKg * 9.81) / 25) / seconds;

        // const elevation = _.clamp(elevationGain, 0, elevationGain);
        // elevationGain = elevationGain;
        // console.log(elevationGain);
        // elevationGain = Math.abs(elevationGain) / 2.5;

        // Not bad:
        // elevationGain = Math.sqrt(Math.abs(elevationGain)) / 4.35;

        // elevationGain = (elevationGain < 0 ) ? 0 : elevationGain;

        const factor = elevationGain + Math.exp(speed * 1.2);
        const verticalWatts = (weightKg * 9.81 * factor) / seconds;

        // const verticalWatts = (weightKg * 9.81 * speed) / seconds;


        // NOT BAD
        //         elevationGain = Math.abs(elevationGain) / 3;
        //         const verticalWatts = (weightKg * 9.81 * elevationGain) / seconds;

        // TODO @ check http://www.topendsports.com/testing/running-power.htm
        // TODO correlation between Velocity & Power
        /*
        Figures are calculated from equations in: American College of Sports Medicine.
        Guidelines for Exercise Testing and Prescription,
        4th edition. Philadelphia: Lea & Febiger, 1991, p. 285-300.
         */

        // TODO https://www.researchgate.net/publication/246704204_Guidelines_for_exercise_testing_and_prescription_4th_edition_edited_by_american_college_of_sports_medicine_lea_febiger_philadelphia_1991_314_pages_illustrated_1500_isbn_0-8121-1324-1

        // elevationGain = Math.abs(elevationGain) / 3;
        // const verticalWatts = (weightKg * 9.81 * elevationGain * speed) / seconds;
        return Math.round(horizontalWatts + verticalWatts);
    }

}
