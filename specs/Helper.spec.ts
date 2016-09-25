describe('Helper', () => {
    it('should be true', () => {
        expect(Helper.heartrateFromHeartRateReserve(100, 200, 50)).toBe(200);
    });
});
