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
});
