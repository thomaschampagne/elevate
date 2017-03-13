/// <reference path="./typings/specs.d.ts" />

describe('Helper', () => {
    it('should give seconds from HH:MM:SS pattern', () => {
        expect(Helper.HHMMSStoSeconds('00:05:00')).toEqual(300);
        expect(Helper.HHMMSStoSeconds('05:00')).toEqual(300);
    });

    it('should give HH:MM:SS pattern from seconds', () => {
        expect(Helper.secondsToHHMMSS(300)).toEqual('00:05:00');
        expect(Helper.secondsToHHMMSS(300, true)).toEqual('5:00');
    });

    it('should give heart rate from heart rate reserve', () => {
        let maxHr: number = 200;
        let restHr: number = 50;
        expect(Helper.heartrateFromHeartRateReserve(100, maxHr, restHr)).toEqual(maxHr); // 100% HRR
        expect(Helper.heartrateFromHeartRateReserve(50, maxHr, restHr)).toEqual(125); // 50% HRR
    });

    it('should give heart rate reserve from heart rate', () => {
        let maxHr: number = 200;
        let restHr: number = 50;
        expect(Helper.heartRateReserveFromHeartrate(125, maxHr, restHr)).toEqual(0.5);
    });

    it('should compare version', () => {
        expect(Helper.versionCompare('5.0.0', '5.0.0')).toEqual(0);
        expect(Helper.versionCompare('5.0.0', '4.9.9')).toEqual(1);
        expect(Helper.versionCompare('4.9.8', '4.9.9')).toEqual(-1);
        expect(Helper.versionCompare('', '4.9.9')).toEqual(NaN);
    });
});
