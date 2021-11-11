export class Time {
  /**
   * Converts seconds to military time (HH:MM:SS)
   */
  public static secToMilitary(secondsParam: number, trimZeros: boolean = false): string {
    secondsParam = Math.round(secondsParam);
    const hours = Math.floor(secondsParam / 3600);
    const minutes = Math.floor(secondsParam / 60) % 60;
    const seconds = Math.round(secondsParam % 60);
    const resultAsArray = [hours, minutes, seconds];

    const militaryTime = resultAsArray
      .map(value => (value < 10 ? "0" + value : value))
      .filter((value, index) => value !== "00" || index > 0)
      .join(":");

    if (trimZeros && militaryTime[0] === "0") {
      return militaryTime.slice(1);
    }

    return militaryTime;
  }

  /**
   * Converts military time (HH:MM:SS) to seconds
   */
  public static militaryToSec(hhMmSs: string): number {
    const p = hhMmSs.split(":");
    let s = 0;
    let m = 1;

    while (p.length > 0) {
      s += m * parseInt(p.pop(), 10);
      m *= 60;
    }
    return s;
  }
}
