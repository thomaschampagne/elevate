import Jasmine = jasmine.Jasmine;
import Spy = jasmine.Spy;
describe('VacuumProcessor', function () {

    it('should be a pro', function () {

        let vacuumProcessor: VacuumProcessor = new VacuumProcessor();

        let getCurrentAthleteSpy: Spy = spyOn(vacuumProcessor, 'getCurrentAthlete'); // Mocking getCurrentAthlete

        // getCurrentAthlete not yet called...
        expect(getCurrentAthleteSpy).not.toHaveBeenCalled();

        // getProStatus Must be false by default...
        expect(vacuumProcessor.getProStatus()).toBeFalsy();


        // ... return premium status and test...
        getCurrentAthleteSpy.and.returnValue({
            attributes: {premium: true}
        });
        expect(vacuumProcessor.getProStatus()).toEqual(false);

        // ... return pro status and test...
        getCurrentAthleteSpy.and.returnValue({
            attributes: {pro: true}
        });
        expect(vacuumProcessor.getProStatus()).toEqual(true);

        // ...
        expect(getCurrentAthleteSpy).toHaveBeenCalledTimes(3)

    });
});