import * as _ from "lodash";
import { InconsistentParameters } from "../../../common/scripts/exceptions/InconsistentParameters";

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
     * Return run power estimation from athlete weight and speed (m/s) into the equivalent bike watts
     * From https://alancouzens.com/blog/Run_Power.html
     * @param {number} weightKg
     * @param {number} meters
     * @param {number} seconds
     * @param elevationGain
     * @returns {number} power watts
     */
    public static estimateRunningPower(weightKg: number, meters: number, seconds: number, elevationGain: number): number {

        const runningEcoVolumeO2PerKm = 210; // Units: (ml/kg/km)
        const cyclingEcoWattsPerVolumeO2 = 75; // Units: W/L // ??

        const minutes = seconds / 60;
        const km = meters / 1000;
        const minPerKmPace = minutes / km; // Units: min/km
        const RelativeVO2 = runningEcoVolumeO2PerKm / minPerKmPace; // (ml/kg/km) / (min/km), Units: (ml/kg/min) equals to a "V02"
        const AbsoluteVO2 = RelativeVO2 * weightKg; // Units: ml/min
		const horizontalWatts = cyclingEcoWattsPerVolumeO2 * AbsoluteVO2 / 1000 /* divide per 1000 to get ml?!  */; // Units: W / min
        const verticalWatts = (weightKg * 9.81 * elevationGain) / seconds; // Units kg/
		const power = Math.round(horizontalWatts + verticalWatts);
		return (power > 0) ? power : 0;
    }
}
