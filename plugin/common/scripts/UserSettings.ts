import {IUserSettings} from "./interfaces/IUserSettings";

export let userSettings: IUserSettings = {
    autoSyncMinutes: 60,
    localStorageMustBeCleared: false,
    userGender: "men",
    userMaxHr: 190,
    userRestHr: 65,
    userFTP: null,
    userSwimFTP: null,
    userWeight: 70,
    zones: {
        speed: [{from: 0, to: 7}, {from: 7, to: 9}, {from: 9, to: 11}, {from: 11, to: 13}, {
            from: 13,
            to: 15,
        }, {from: 15, to: 18}, {from: 18, to: 21}, {from: 21, to: 24}, {from: 24, to: 27}, {
            from: 27,
            to: 30,
        }, {from: 30, to: 32}, {from: 32, to: 34}, {from: 34, to: 36}, {from: 36, to: 38}, {
            from: 38,
            to: 40,
        }, {from: 40, to: 42}, {from: 42, to: 44}, {from: 44, to: 47}, {from: 47, to: 50}, {
            from: 50,
            to: 60,
        }, {from: 60, to: 75}, {from: 75, to: 100}],
        pace: [{from: 60, to: 90}, {from: 90, to: 120}, {from: 120, to: 150}, {
            from: 150,
            to: 180,
        }, {from: 180, to: 210}, {from: 210, to: 240}, {from: 240, to: 270}, {
            from: 270,
            to: 300,
        }, {from: 300, to: 330}, {from: 330, to: 360}, {from: 360, to: 390}, {
            from: 390,
            to: 420,
        }, {from: 420, to: 450}, {from: 450, to: 480}, {from: 480, to: 540}, {
            from: 540,
            to: 570,
        }, {from: 570, to: 720}, {from: 720, to: 900}],
        heartRate: [{from: 120, to: 140}, {from: 140, to: 150}, {from: 150, to: 160}, {from: 160, to: 170}, {
            from: 170,
            to: 180,
        }, {from: 180, to: 185}, {from: 185, to: 190}, {from: 190, to: 195}, {from: 195, to: 210}],
        power: [{from: 0, to: 25}, {from: 25, to: 50}, {from: 50, to: 75}, {
            from: 75,
            to: 100,
        }, {from: 100, to: 125}, {from: 125, to: 150}, {from: 150, to: 175}, {
            from: 175,
            to: 200,
        }, {from: 200, to: 225}, {from: 225, to: 250}, {from: 250, to: 275}, {
            from: 275,
            to: 300,
        }, {from: 300, to: 325}, {from: 325, to: 350}, {from: 350, to: 375}, {
            from: 375,
            to: 400,
        }, {from: 400, to: 425}, {from: 425, to: 450}, {from: 450, to: 475}, {
            from: 475,
            to: 500,
        }, {from: 500, to: 525}, {from: 525, to: 550}, {from: 550, to: 575}, {
            from: 575,
            to: 600,
        }, {from: 600, to: 625}, {from: 625, to: 650}, {from: 650, to: 675}, {
            from: 675,
            to: 700,
        }, {from: 700, to: 725}, {from: 725, to: 750}, {from: 750, to: 775}, {
            from: 775,
            to: 800,
        }, {from: 800, to: 825}, {from: 825, to: 850}, {from: 850, to: 875}, {
            from: 875,
            to: 900,
        }, {from: 900, to: 925}, {from: 925, to: 950}, {from: 950, to: 975}, {
            from: 975,
            to: 1000,
        }, {from: 1000, to: 1025}, {from: 1025, to: 1050}, {from: 1050, to: 1075}, {
            from: 1075,
            to: 1100,
        }, {from: 1100, to: 1125}, {from: 1125, to: 1150}, {from: 1150, to: 1175}, {
            from: 1175,
            to: 1200,
        }, {from: 1200, to: 1225}, {from: 1225, to: 1250}],
        runningPower: [{from: 0, to: 25}, {from: 25, to: 50}, {from: 50, to: 75}, {
            from: 75,
            to: 100,
        }, {from: 100, to: 125}, {from: 125, to: 150}, {from: 150, to: 175}, {
            from: 175,
            to: 200,
        }, {from: 200, to: 225}, {from: 225, to: 250}, {from: 250, to: 275}, {
            from: 275,
            to: 300,
        }, {from: 300, to: 325}, {from: 325, to: 350}, {from: 350, to: 375}, {
            from: 375,
            to: 400,
        }, {from: 400, to: 425}, {from: 425, to: 450}, {from: 450, to: 475}, {
            from: 475,
            to: 500,
        }, {from: 500, to: 525}, {from: 525, to: 550}, {from: 550, to: 575}, {
            from: 575,
            to: 600,
        }, {from: 600, to: 625}, {from: 625, to: 650}, {from: 650, to: 675}, {
            from: 675,
            to: 700,
        }],
        cyclingCadence: [{from: 0, to: 5}, {from: 5, to: 10}, {from: 10, to: 15}, {
            from: 15,
            to: 20,
        }, {from: 20, to: 25}, {from: 25, to: 30}, {from: 30, to: 35}, {from: 35, to: 40}, {
            from: 40,
            to: 45,
        }, {from: 45, to: 50}, {from: 50, to: 55}, {from: 55, to: 60}, {from: 60, to: 65}, {
            from: 65,
            to: 70,
        }, {from: 70, to: 75}, {from: 75, to: 80}, {from: 80, to: 85}, {from: 85, to: 90}, {
            from: 90,
            to: 95,
        }, {from: 95, to: 100}, {from: 100, to: 105}, {from: 105, to: 110}, {
            from: 110,
            to: 115,
        }, {from: 115, to: 125}, {from: 125, to: 150}],
        runningCadence: [{from: 65, to: 67}, {from: 67, to: 69}, {from: 69, to: 71}, {
            from: 71,
            to: 73,
        }, {from: 73, to: 75}, {from: 75, to: 77}, {from: 77, to: 79}, {from: 79, to: 81}, {
            from: 81,
            to: 83,
        }, {from: 83, to: 85}, {from: 85, to: 87}, {from: 87, to: 89}, {from: 89, to: 91}, {
            from: 91,
            to: 93,
        }, {from: 93, to: 95}, {from: 95, to: 97}, {from: 97, to: 99}, {
            from: 99,
            to: 101,
        }, {from: 101, to: 103}, {from: 103, to: 105}, {from: 105, to: 107}, {
            from: 107,
            to: 109,
        }, {from: 109, to: 111}, {from: 111, to: 115}, {from: 115, to: 120}],
        grade: [{from: -20, to: -17}, {from: -17, to: -14}, {from: -14, to: -12}, {
            from: -12,
            to: -9,
        }, {from: -9, to: -6}, {from: -6, to: -3}, {from: -3, to: -2}, {from: -2, to: -1}, {
            from: -1,
            to: -0.5,
        }, {from: -0.5, to: 0.5}, {from: 0.5, to: 1}, {from: 1, to: 2}, {from: 2, to: 3}, {
            from: 3,
            to: 4,
        }, {from: 4, to: 5}, {from: 5, to: 6}, {from: 6, to: 7}, {from: 7, to: 8}, {
            from: 8,
            to: 9,
        }, {from: 9, to: 10}, {from: 10, to: 11}, {from: 11, to: 12}, {from: 12, to: 13}, {
            from: 13,
            to: 14,
        }, {from: 14, to: 15}, {from: 15, to: 16}, {from: 16, to: 17}, {from: 17, to: 18}, {
            from: 18,
            to: 20,
        }, {from: 20, to: 25}],
        elevation: [{from: 0, to: 100}, {from: 100, to: 200}, {from: 200, to: 300}, {
            from: 300,
            to: 400,
        }, {from: 400, to: 500}, {from: 500, to: 600}, {from: 600, to: 700}, {
            from: 700,
            to: 800,
        }, {from: 800, to: 900}, {from: 900, to: 1000}, {from: 1000, to: 1200}, {
            from: 1200,
            to: 1400,
        }, {from: 1400, to: 1600}, {from: 1600, to: 1800}, {from: 1800, to: 2000}, {
            from: 2000,
            to: 2200,
        }, {from: 2200, to: 2400}, {from: 2400, to: 2600}, {from: 2600, to: 2800}, {
            from: 2800,
            to: 3000,
        }, {from: 3000, to: 3500}, {from: 3500, to: 4000}, {from: 4000, to: 5000}],
        ascent: [{from: 0, to: 100}, {from: 100, to: 200}, {from: 200, to: 300}, {
            from: 300,
            to: 400,
        }, {from: 400, to: 500}, {from: 500, to: 600}, {from: 600, to: 700}, {
            from: 700,
            to: 800,
        }, {from: 800, to: 900}, {from: 900, to: 1000}, {from: 1000, to: 1100}, {
            from: 1100,
            to: 1200,
        }, {from: 1200, to: 1300}, {from: 1300, to: 1400}, {from: 1400, to: 1500}, {
            from: 1500,
            to: 1600,
        }, {from: 1600, to: 1700}, {from: 1700, to: 1800}, {from: 1800, to: 1900}, {
            from: 1900,
            to: 2000,
        }, {from: 2000, to: 2100}, {from: 2100, to: 2200}, {from: 2200, to: 2300}, {
            from: 2300,
            to: 2400,
        }, {from: 2400, to: 2500}, {from: 2500, to: 2600}, {from: 2600, to: 2700}, {
            from: 2700,
            to: 2800,
        }, {from: 2800, to: 2900}, {from: 2900, to: 3000}, {from: 3000, to: 3100}, {
            from: 3100,
            to: 3200,
        }, {from: 3200, to: 3300}, {from: 3300, to: 3400}, {from: 3400, to: 3500}, {
            from: 3500,
            to: 3600,
        }, {from: 3600, to: 3700}, {from: 3700, to: 3800}, {from: 3800, to: 3900}, {
            from: 3900,
            to: 4000,
        }, {from: 4000, to: 4100}, {from: 4100, to: 4200}, {from: 4200, to: 4300}, {
            from: 4300,
            to: 4400,
        }, {from: 4400, to: 4500}, {from: 4500, to: 4600}, {from: 4600, to: 4700}, {
            from: 4700,
            to: 5000,
        }, {from: 5000, to: 5500}],
    },
    targetsYearRide: 5000,
    targetsYearRun: 750,
    remoteLinks: true,
    feedAutoScroll: true,
    defaultLeaderBoardFilter: "overall",
    activateRunningGradeAdjustedPace: true,
    activateRunningHeartRate: true,
    activateRunningCadence: true,
    activateRunningTemperature: true,
    activityStravaMapType: "terrain",
    displaySegmentRankPercentage: true,
    displayNearbySegments: true,
    displayMotivationScore: true,
    displayActivityRatio: true,
    displayAdvancedPowerData: true,
    displayAdvancedSpeedData: true,
    displayAdvancedHrData: true,
    displayCadenceData: true,
    displayAdvancedGradeData: true,
    displayAdvancedElevationData: true,
    displayBikeOdoInActivity: true,
    enableBothLegsCadence: true,
    feedHideChallenges: false,
    feedHideCreatedRoutes: false,
    feedHideSuggestedAthletes: false,
    feedHideVirtualRides: false,
    feedHideRideActivitiesUnderDistance: 0,
    feedHideRunActivitiesUnderDistance: 0,
    displaySegmentTimeComparisonToKOM: true,
    displaySegmentTimeComparisonToPR: true,
    displaySegmentTimeComparisonToCurrentYearPR: true,
    displaySegmentTimeComparisonPosition: true,
    displayRecentEffortsHRAdjustedPacePower: false,
    reviveGoogleMaps: true,
    displayRunningPowerEstimation: true,
    reviveGoogleMapsLayerType: "terrain",
    displayActivityBestSplits: true,
    bestSplitsConfiguration: null,
    temperatureUnit: "F",
    windUnit: "mph",
    showHiddenBetaFeatures: false,
    displayReliveCCLink: true,
};
