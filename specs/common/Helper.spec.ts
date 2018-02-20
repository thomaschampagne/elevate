import { Helper } from "../../plugin/common/scripts/Helper";

describe("Helper", () => {

	it("should give seconds from HH:MM:SS pattern", (done: Function) => {
        expect(Helper.HHMMSStoSeconds("00:05:00")).toEqual(300);
        expect(Helper.HHMMSStoSeconds("05:00")).toEqual(300);
		done();
    });

	it("should give HH:MM:SS pattern from seconds", (done: Function) => {
        expect(Helper.secondsToHHMMSS(300)).toEqual("00:05:00");
        expect(Helper.secondsToHHMMSS(300, true)).toEqual("5:00");
		done();
    });

	it("should give heart rate from heart rate reserve", (done: Function) => {
		const maxHr = 200;
		const restHr = 50;
        expect(Helper.heartrateFromHeartRateReserve(100, maxHr, restHr)).toEqual(maxHr); // 100% HRR
        expect(Helper.heartrateFromHeartRateReserve(50, maxHr, restHr)).toEqual(125); // 50% HRR
		done();
    });

	it("should give heart rate reserve from heart rate", (done: Function) => {
		const maxHr = 200;
		const restHr = 100;
        expect(Helper.heartRateReserveFromHeartrate(50, maxHr, restHr)).toEqual(-0.5);
        expect(Helper.heartRateReserveFromHeartrate(100, maxHr, restHr)).toEqual(0);
        expect(Helper.heartRateReserveFromHeartrate(150, maxHr, restHr)).toEqual(0.5);
        expect(Helper.heartRateReserveFromHeartrate(200, maxHr, restHr)).toEqual(1);
        expect(Helper.heartRateReserveFromHeartrate(250, maxHr, restHr)).toEqual(1.5);
        expect(Helper.heartRateReserveFromHeartrate(300, maxHr, restHr)).toEqual(2);
		done();
    });

	it("should compare version", (done: Function) => {
        expect(Helper.versionCompare("5.0.0", "5.0.0")).toEqual(0);
        expect(Helper.versionCompare("5.0.0", "4.9.9")).toEqual(1);
        expect(Helper.versionCompare("4.9.8", "4.9.9")).toEqual(-1);
        expect(Helper.versionCompare("", "4.9.9")).toEqual(NaN);
		done();
    });

	it("should convert meters per seconds tp KPH", (done: Function) => {
        expect(Helper.convertMetersPerSecondsToKph(10)).toEqual(36);
		done();
    });

});
