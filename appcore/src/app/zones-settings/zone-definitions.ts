import moment from "moment";
import { ZoneDefinitionModel } from "../shared/models/zone-definition.model";
import { Constant } from "@elevate/shared/constants";
import { ZoneType } from "@elevate/shared/enums";

export const ZONE_DEFINITIONS: ZoneDefinitionModel[] = [
  {
    name: "Cycling Speed",
    value: ZoneType.SPEED,
    units: "KPH",
    step: 0.1,
    min: 0,
    max: 9999,
    customDisplay: {
      name: "Miles Conversion",
      zoneValue: "speed",
      output: (speedKph: number) => {
        return (speedKph * Constant.KM_TO_MILE_FACTOR).toFixed(1) + " mph";
      }
    }
  },
  {
    name: "Running Pace",
    value: ZoneType.PACE,
    units: "Seconds",
    step: 1,
    min: 0,
    max: 3599,
    customDisplay: {
      name: "Pace format mm:ss/distance",
      zoneValue: "pace",
      output: (seconds: number) => {
        const paceMetric = moment().startOf("day").seconds(seconds).format("mm:ss") + "/km";
        const paceImperial =
          moment()
            .startOf("day")
            .seconds(seconds / Constant.KM_TO_MILE_FACTOR)
            .format("mm:ss") + "/mi";
        return paceMetric + "  | " + paceImperial;
      }
    }
  },
  {
    name: "Heart Rate",
    value: ZoneType.HEART_RATE,
    units: "BPM",
    step: 1,
    min: 0,
    max: 9999,
    customDisplay: null
  },
  {
    name: "Cycling Power",
    value: ZoneType.POWER,
    units: "Watts",
    step: 1,
    min: 0,
    max: 9999,
    customDisplay: null
  },
  {
    name: "Running Power",
    value: ZoneType.RUNNING_POWER,
    units: "Watts",
    step: 1,
    min: 0,
    max: 9999,
    customDisplay: null
  },
  {
    name: "Cycling Cadence",
    value: ZoneType.CYCLING_CADENCE,
    units: "RPM",
    step: 1,
    min: 0,
    max: 9999,
    customDisplay: null
  },
  {
    name: "Running Cadence",
    value: ZoneType.RUNNING_CADENCE,
    units: "SPM",
    step: 0.1,
    min: 0,
    max: 9999,
    customDisplay: null
  },
  {
    name: "Grade",
    value: ZoneType.GRADE,
    units: "%",
    step: 0.1,
    min: -9999,
    max: 9999,
    customDisplay: null
  },
  {
    name: "Elevation",
    value: ZoneType.ELEVATION,
    units: "m",
    step: 5,
    min: 0,
    max: 9999,
    customDisplay: null
  },
  {
    name: "Ascent speed",
    value: ZoneType.ASCENT,
    units: "Vm/h",
    step: 5,
    min: 0,
    max: 9999,
    customDisplay: null
  }
];
