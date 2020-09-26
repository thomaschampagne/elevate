import _ from "lodash";
import { SpeedUnitDataModel } from "@elevate/shared/models";
import { Constant } from "@elevate/shared/constants";

export class Helper {
  public static getSpeedUnitData(measurementPreference: string): SpeedUnitDataModel {
    const units: string = measurementPreference === "meters" ? "km" : "mi";
    const speedUnitPerHour: string = measurementPreference === "meters" ? "km/h" : "mi/h";
    const speedUnitFactor: number = speedUnitPerHour === "km/h" ? 1 : Constant.KM_TO_MILE_FACTOR;

    return {
      speedUnitPerHour,
      speedUnitFactor,
      units
    };
  }

  public static heartrateFromHeartRateReserve(hrr: number, maxHr: number, restHr: number): number {
    return Math.abs(Math.floor((hrr / 100) * (maxHr - restHr) + restHr));
  }

  public static heartRateReserveFromHeartrate(hr: number, maxHr: number, restHr: number): number {
    return (hr - restHr) / (maxHr - restHr);
  }

  public static formatNumber(n: any, c?: any, d?: any, t?: any): string {
    (c = isNaN((c = Math.abs(c))) ? 2 : c), (d = d === undefined ? "." : d), (t = t === undefined ? "," : t);

    const s: any = n < 0 ? "-" : "";

    const i: any = parseInt((n = Math.abs(+n || 0).toFixed(c)), 10) + "";

    let j: any;
    j = (j = i.length) > 3 ? j % 3 : 0;

    return (
      s +
      (j ? i.substr(0, j) + t : "") +
      i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
      (c
        ? d +
          Math.abs(n - i)
            .toFixed(c)
            .slice(2)
        : "")
    );
  }

  public static secondsToDHM(secNum: number, trimZeros?: boolean): string {
    const days: number = Math.floor(secNum / 86400);
    const hours: number = Math.floor((secNum - days * 86400) / 3600);
    const minutes: number = Math.floor((secNum - days * 86400 - hours * 3600) / 60);
    if (trimZeros && days === 0) {
      if (hours === 0) {
        return minutes + "m";
      }
      return hours + "h " + minutes + "m";
    }
    return days + "d " + hours + "h " + minutes + "m";
  }

  public static guid(): string {
    // from http://stackoverflow.com/a/105074
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
  }

  public static params(urlLocation: Location): any {
    const params: any = {};

    if (urlLocation) {
      const parts = urlLocation.search.substring(1).split("&");
      for (let i = 0; i < parts.length; i++) {
        const nv: string[] = parts[i].split("=");
        if (!nv[0]) {
          continue;
        }
        params[nv[0]] = nv[1] || true;
      }
    }
    return params;
  }

  public static safeMax(a: number, b: number): number {
    return a === null ? b : Math.max(a, b);
  }

  public static safeMin(a: number, b: number): number {
    return a === null ? b : Math.min(a, b);
  }

  public static convertMetersPerSecondsToKph(meterPerSeconds: number): number {
    return meterPerSeconds * 3.6;
  }

  /**
   * @param speed in kph
   * @return pace in seconds/km, if NaN/Infinite then return -1
   */
  public static convertSpeedToPace(speed: number): number {
    if (!_.isFinite(speed) || speed <= 0) {
      return -1;
    }
    return (1 / speed) * 60 * 60;
  }
}
