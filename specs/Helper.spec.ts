describe('Helper', function () {
    it('should be true', function () {
        expect(Helper.heartrateFromHeartRateReserve(100, 200, 50)).toBe(200);
    });
});
