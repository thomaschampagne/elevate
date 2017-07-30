
import {AthleteUpdate} from "../../plugin/core/scripts/Follow";
import {IAthleteUpdate} from "../../plugin/core/scripts/interfaces/IAthleteUpdate";

describe('Generate Athlete Update', () => {

    it('should return compliant AthleteUpdate (free)', () => {

        let doe: IAthleteUpdate = AthleteUpdate.create(
            123,
            'John Doe',
            '5.0.0',
            false, // premium true
            false, // pro false
            'France',
            65,
            190
        );
        expect(doe).not.toBeNull();
        expect(doe.stravaId).toEqual(123);
        expect(doe.name).toEqual('John Doe');
        expect(doe.version).toEqual('5.0.0');
        expect(doe.status).toEqual(0);
        expect(doe.country).toEqual('France');
        expect(doe.hrMin).toEqual(65);
        expect(doe.hrMax).toEqual(190);
    });


    it('should return compliant AthleteUpdate (premium)', () => {

        let doe: IAthleteUpdate = AthleteUpdate.create(
            777,
            'My Self',
            '5.0.0',
            true, // premium true
            false, // pro false
            'France',
            65,
            190
        );
        expect(doe).not.toBeNull();
        expect(doe.stravaId).toEqual(777);
        expect(doe.name).toEqual('My Self');
        expect(doe.version).toEqual('5.0.0');
        expect(doe.status).toEqual(1);
        expect(doe.country).toEqual('France');
        expect(doe.hrMax).toEqual(190);
        expect(doe.hrMin).toEqual(65);
    });

    it('should return compliant AthleteUpdate (pro)', () => {

        let froom: IAthleteUpdate = AthleteUpdate.create(
            999,
            'Chris Froome',
            '5.1.0',
            false, // premium true
            true, // pro false
            'United KingHome'
        );

        expect(froom).not.toBeNull();
        expect(froom.stravaId).toEqual(999);
        expect(froom.name).toEqual('Chris Froome');
        expect(froom.name).not.toEqual('John Doe');
        expect(froom.version).toEqual('5.1.0');
        expect(froom.status).toEqual(2);
        expect(froom.country).toEqual('United KingHome');

        // Another pro
        let cavendish: IAthleteUpdate = AthleteUpdate.create(
            888,
            'Cavendish',
            '5.1.0',
            true, // premium true
            true, // pro true
            '' // empty test
        );
        expect(cavendish).not.toBeNull();
        expect(cavendish.status).toEqual(2);
        expect(cavendish.country).toBeUndefined();

    });

    it('should pass monkey tests', () => {

        let monkey_01: IAthleteUpdate = AthleteUpdate.create(
            888,
            '',
            '5.1.0',
            true, // premium true
            true, // pro true
            '' // empty test
        );
        expect(monkey_01).toBeNull();

        //...

        let monkey_02: IAthleteUpdate = AthleteUpdate.create(
            888,
            'Monkey',
            '',
            false, // premium true
            false, // pro true
            '' // empty test
        );
        expect(monkey_02).toBeNull();
        //...
        let monkey_03: IAthleteUpdate = AthleteUpdate.create(
            888,
            null,
            null,
            false, // premium true
            false // pro true
        );
        expect(monkey_03).toBeNull();
    });
});

