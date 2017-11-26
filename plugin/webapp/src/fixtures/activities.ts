import { ISyncActivityComputed } from "../../../common/scripts/interfaces/ISync";

export const UNIT_TEST_ACTIVITIES: ISyncActivityComputed[] = JSON.parse(`[
	{
		"bike_id": 2042105,
		"calories": 3846.37527972,
		"commute": false,
		"display_type": "Sortie à vélo",
		"distance_raw": 141925,
		"elapsed_time_raw": 22033,
		"elevation_gain_raw": 2052,
		"elevation_unit": "m",
		"extendedStats": {
			"cadenceData": {
				"averageCadenceMoving": 78.26958228367215,
				"cadencePercentageMoving": 85.61344279904857,
				"cadenceTimeMoving": 17069,
				"cadenceZones": null,
				"crankRevolutions": 22470.74166666663,
				"lowerQuartileCadence": 69,
				"medianCadence": 81,
				"standardDeviationCadence": 15.9,
				"upperQuartileCadence": 89
			},
			"elevationData": {
				"accumulatedElevationAscent": 1851.508366132939,
				"accumulatedElevationDescent": 1830.3073322196683,
				"ascentSpeed": {
					"avg": 697.1837977440092,
					"lowerQuartile": 580,
					"median": 743,
					"upperQuartile": 838
				},
				"ascentSpeedZones": null,
				"avgElevation": 642,
				"elevationZones": null,
				"lowerQuartileElevation": 318,
				"medianElevation": 454,
				"upperQuartileElevation": 726
			},
			"gradeData": {
				"avgGrade": 0.014636373504306013,
				"gradeProfile": "HILLY",
				"gradeZones": null,
				"lowerQuartileGrade": -2.2,
				"medianGrade": 0,
				"upFlatDownDistanceData": {
					"down": 40.96589999999991,
					"flat": 58.9553000000001,
					"up": 41.9524
				},
				"upFlatDownInSeconds": {
					"down": 3895,
					"flat": 6761,
					"total": 19926,
					"up": 9270
				},
				"upFlatDownMoveData": {
					"down": 37.863219512195045,
					"flat": 31.391669871320865,
					"up": 16.29219417475728
				},
				"upperQuartileGrade": 2.2
			},
			"heartRateData": {
				"TRIMP": 481.13929017945264,
				"TRIMPPerHour": 88.63480936680122,
				"activityHeartRateReserve": 64.5141851855773,
				"activityHeartRateReserveMax": 82.06896551724138,
				"averageHeartRate": 148.54556851908708,
				"hrrZones": null,
				"lowerQuartileHeartRate": 143,
				"maxHeartRate": 174,
				"medianHeartRate": 151,
				"upperQuartileHeartRate": 157
			},
			"moveRatio": 0.9043707166522943,
			"paceData": {
				"avgPace": 140,
				"lowerQuartilePace": 285.7142857142857,
				"medianPace": 142.85714285714286,
				"paceZones": null,
				"upperQuartilePace": 105.26315789473684,
				"variancePace": 17.040162103832152
			},
			"powerData": {
				"avgWatts": 176.3188517040221,
				"avgWattsPerKg": 2.5188407386288874,
				"hasPowerMeter": false,
				"lowerQuartileWatts": 48,
				"medianWatts": 161,
				"powerZones": null,
				"punchFactor": null,
				"upperQuartileWatts": 256,
				"variabilityIndex": 1.164589041955528,
				"weightedPower": 205.33900258468591,
				"weightedWattsPerKg": 2.93341432263837
			},
			"speedData": {
				"avgPace": 140,
				"genuineAvgSpeed": 25.675447154471208,
				"lowerQuartileSpeed": 12.6,
				"medianSpeed": 25.2,
				"speedZones": null,
				"standardDeviationSpeed": 14.534978356899025,
				"totalAvgSpeed": 23.220122543457236,
				"upperQuartileSpeed": 34.2,
				"varianceSpeed": 211.26559583552307
			},
			"toughnessScore": null
		},
		"hasPowerMeter": false,
		"id": 343080886,
		"moving_time_raw": 19671,
		"name": "Alpe d'Huez",
		"private": false,
		"short_unit": "km",
		"start_time": "2015-07-10T08:58:32+0000",
		"trainer": false,
		"type": "Ride"
	},
	{
		"bike_id": 2042105,
		"calories": 2565.4956504,
		"commute": false,
		"display_type": "Entraînement",
		"distance_raw": 95313.4,
		"elapsed_time_raw": 16819,
		"elevation_gain_raw": 1748,
		"elevation_unit": "m",
		"extendedStats": {
			"cadenceData": {
				"averageCadenceMoving": 73.09367614701328,
				"cadencePercentageMoving": 78.41685101471579,
				"cadenceTimeMoving": 12271,
				"cadenceZones": null,
				"crankRevolutions": 15122.933333333325,
				"lowerQuartileCadence": 64,
				"medianCadence": 74,
				"standardDeviationCadence": 14.7,
				"upperQuartileCadence": 83
			},
			"elevationData": {
				"accumulatedElevationAscent": 1438.0128548201394,
				"accumulatedElevationDescent": 1425.1383731174562,
				"ascentSpeed": {
					"avg": 657.9941120984514,
					"lowerQuartile": 456,
					"median": 588,
					"upperQuartile": 736
				},
				"ascentSpeedZones": null,
				"avgElevation": 456,
				"elevationZones": null,
				"lowerQuartileElevation": 242,
				"medianElevation": 404,
				"upperQuartileElevation": 691
			},
			"gradeData": {
				"avgGrade": 0.014115701420969741,
				"gradeProfile": "HILLY",
				"gradeZones": null,
				"lowerQuartileGrade": -3.1,
				"medianGrade": 0,
				"upFlatDownDistanceData": {
					"down": 32.033999999999956,
					"flat": 32.71319999999999,
					"up": 30.518700000000063
				},
				"upFlatDownInSeconds": {
					"down": 3051,
					"flat": 4275,
					"total": 15272,
					"up": 7946
				},
				"upFlatDownMoveData": {
					"down": 37.79823008849553,
					"flat": 27.547957894736836,
					"up": 13.826745532343347
				},
				"upperQuartileGrade": 3
			},
			"heartRateData": {
				"TRIMP": 360.6368254576357,
				"TRIMPPerHour": 85.33538659441886,
				"activityHeartRateReserve": 62.943908287738616,
				"activityHeartRateReserveMax": 82.06896551724138,
				"averageHeartRate": 146.268667017221,
				"hrrZones": null,
				"lowerQuartileHeartRate": 137,
				"maxHeartRate": 174,
				"medianHeartRate": 149,
				"upperQuartileHeartRate": 158
			},
			"moveRatio": 0.9080206908853082,
			"paceData": {
				"avgPace": 160,
				"lowerQuartilePace": 312.49999999999994,
				"medianPace": 185.18518518518516,
				"paceZones": null,
				"upperQuartilePace": 117.64705882352942,
				"variancePace": 18.288136490477513
			},
			"powerData": {
				"avgWatts": 150.90669777836203,
				"avgWattsPerKg": 2.155809968262315,
				"hasPowerMeter": false,
				"lowerQuartileWatts": 38,
				"medianWatts": 159,
				"powerZones": null,
				"punchFactor": null,
				"upperQuartileWatts": 227,
				"variabilityIndex": 1.2421043065100532,
				"weightedPower": 187.44185919171457,
				"weightedWattsPerKg": 2.6777408455959226
			},
			"speedData": {
				"avgPace": 160,
				"genuineAvgSpeed": 22.438345992666438,
				"lowerQuartileSpeed": 11.520000000000001,
				"medianSpeed": 19.44,
				"speedZones": null,
				"standardDeviationSpeed": 14.030285975007054,
				"totalAvgSpeed": 20.374482430584568,
				"upperQuartileSpeed": 30.6,
				"varianceSpeed": 196.84892454047963
			},
			"toughnessScore": null
		},
		"hasPowerMeter": false,
		"id": 628842674,
		"moving_time_raw": 15280,
		"name": "4 Seigneurs & Balcons de Belledonne - https://www.relive.cc/view/628842674",
		"private": false,
		"short_unit": "km",
		"start_time": "2016-07-03T11:20:16+0000",
		"trainer": false,
		"type": "Ride"
	},
	{
		"bike_id": 2042105,
		"calories": 825.2350710999999,
		"commute": false,
		"display_type": "Sortie à vélo",
		"distance_raw": 31184.9,
		"elapsed_time_raw": 5293,
		"elevation_gain_raw": 508,
		"elevation_unit": "m",
		"extendedStats": {
			"cadenceData": {
				"averageCadenceMoving": 73.25215845606907,
				"cadencePercentageMoving": 78.46153846153847,
				"cadenceTimeMoving": 3938,
				"cadenceZones": null,
				"crankRevolutions": 4865.666666666663,
				"lowerQuartileCadence": 66,
				"medianCadence": 74,
				"standardDeviationCadence": 14.1,
				"upperQuartileCadence": 83
			},
			"elevationData": {
				"accumulatedElevationAscent": 507.9203524207486,
				"accumulatedElevationDescent": 509.5425401267901,
				"ascentSpeed": {
					"avg": 701.0269580454387,
					"lowerQuartile": 508,
					"median": 710,
					"upperQuartile": 808
				},
				"ascentSpeedZones": null,
				"avgElevation": 342,
				"elevationZones": null,
				"lowerQuartileElevation": 210,
				"medianElevation": 233,
				"upperQuartileElevation": 507
			},
			"gradeData": {
				"avgGrade": -0.0032079951233564942,
				"gradeProfile": "HILLY",
				"gradeZones": null,
				"lowerQuartileGrade": -2.5,
				"medianGrade": 0,
				"upFlatDownDistanceData": {
					"down": 9.158199999999987,
					"flat": 12.835500000000009,
					"up": 9.175300000000004
				},
				"upFlatDownInSeconds": {
					"down": 923,
					"flat": 1719,
					"total": 5049,
					"up": 2407
				},
				"upFlatDownMoveData": {
					"down": 35.71995666305521,
					"flat": 26.88062827225133,
					"up": 13.722924802658916
				},
				"upperQuartileGrade": 2.4
			},
			"heartRateData": {
				"TRIMP": 158.83672750460482,
				"TRIMPPerHour": 113.6803616335144,
				"activityHeartRateReserve": 71.04949612668814,
				"activityHeartRateReserveMax": 91.0344827586207,
				"averageHeartRate": 158.0217693836978,
				"hrrZones": null,
				"lowerQuartileHeartRate": 146,
				"maxHeartRate": 187,
				"medianHeartRate": 164,
				"upperQuartileHeartRate": 172
			},
			"moveRatio": 0.9539013791800491,
			"paceData": {
				"avgPace": 162,
				"lowerQuartilePace": 312.49999999999994,
				"medianPace": 185.18518518518516,
				"paceZones": null,
				"upperQuartilePace": 116.27906976744185,
				"variancePace": 24.746869898189885
			},
			"powerData": {
				"avgWatts": 146.468986083499,
				"avgWattsPerKg": 2.092414086907129,
				"hasPowerMeter": false,
				"lowerQuartileWatts": 16,
				"medianWatts": 161,
				"powerZones": null,
				"punchFactor": null,
				"upperQuartileWatts": 205,
				"variabilityIndex": 1.2285005681251542,
				"weightedPower": 179.9372326162938,
				"weightedWattsPerKg": 2.570531894518483
			},
			"speedData": {
				"avgPace": 162,
				"genuineAvgSpeed": 22.212156862745147,
				"lowerQuartileSpeed": 11.520000000000001,
				"medianSpeed": 19.44,
				"speedZones": null,
				"standardDeviationSpeed": 12.061216490772848,
				"totalAvgSpeed": 21.18820706593619,
				"upperQuartileSpeed": 30.96,
				"varianceSpeed": 145.4729432372909
			},
			"toughnessScore": null
		},
		"hasPowerMeter": false,
		"id": 717815211,
		"moving_time_raw": 5060,
		"name": "Afternoon Ride",
		"private": false,
		"short_unit": "km",
		"start_time": "2016-09-19T14:12:46+0000",
		"trainer": false,
		"type": "Ride"
	},
	{
		"bike_id": null,
		"calories": 554.0288906520001,
		"commute": false,
		"display_type": "Randonnée",
		"distance_raw": 6350.9,
		"elapsed_time_raw": 6568,
		"elevation_gain_raw": 594.8,
		"elevation_unit": "m",
		"extendedStats": {
			"cadenceData": null,
			"elevationData": {
				"accumulatedElevationAscent": 330.3546420566828,
				"accumulatedElevationDescent": 529.1669035447756,
				"ascentSpeed": {
					"avg": 655.3661328303131,
					"lowerQuartile": 349,
					"median": 593,
					"upperQuartile": 808
				},
				"ascentSpeedZones": null,
				"avgElevation": 1040,
				"elevationZones": null,
				"lowerQuartileElevation": 880,
				"medianElevation": 1048,
				"upperQuartileElevation": 1206
			},
			"gradeData": {
				"avgGrade": -0.19952961754831472,
				"gradeProfile": "HILLY",
				"gradeZones": null,
				"lowerQuartileGrade": -19.3,
				"medianGrade": 0,
				"upFlatDownDistanceData": {
					"down": 3.1197999999999997,
					"flat": 0.15709999999999946,
					"up": 3.069000000000001
				},
				"upFlatDownInSeconds": {
					"down": 2491,
					"flat": 154,
					"total": 5969,
					"up": 3324
				},
				"upFlatDownMoveData": {
					"down": 4.5087434765154555,
					"flat": 3.67246753246752,
					"up": 3.323826714801445
				},
				"upperQuartileGrade": 19
			},
			"heartRateData": {
				"TRIMP": 57.36887054887593,
				"TRIMPPerHour": 54.723882876511226,
				"activityHeartRateReserve": 51.05239113352703,
				"activityHeartRateReserveMax": 73.10344827586206,
				"averageHeartRate": 129.0259671436142,
				"hrrZones": null,
				"lowerQuartileHeartRate": 118,
				"maxHeartRate": 161,
				"medianHeartRate": 126,
				"upperQuartileHeartRate": 142
			},
			"moveRatio": 0.9088002436053593,
			"paceData": {
				"avgPace": 940,
				"lowerQuartilePace": 1249.9999999999998,
				"medianPace": 1000.0000000000001,
				"paceZones": null,
				"upperQuartilePace": 769.230769230769,
				"variancePace": 1099.6609337705063
			},
			"powerData": null,
			"speedData": {
				"avgPace": 940,
				"genuineAvgSpeed": 3.8299681688725107,
				"lowerQuartileSpeed": 2.8800000000000003,
				"medianSpeed": 3.6,
				"speedZones": null,
				"standardDeviationSpeed": 1.809346947343991,
				"totalAvgSpeed": 3.4806760048721093,
				"upperQuartileSpeed": 4.680000000000001,
				"varianceSpeed": 3.2737363758630185
			},
			"toughnessScore": null
		},
		"hasPowerMeter": false,
		"id": 722210052,
		"moving_time_raw": 5830,
		"name": "Fort saint eynard",
		"private": false,
		"short_unit": "km",
		"start_time": "2016-09-23T13:46:54+0000",
		"trainer": false,
		"type": "Hike"
	},
	{
		"bike_id": 2042105,
		"calories": 1444.437008,
		"commute": false,
		"display_type": "Sortie à vélo",
		"distance_raw": 56283.2,
		"elapsed_time_raw": 6128,
		"elevation_gain_raw": 390,
		"elevation_unit": "m",
		"extendedStats": {
			"cadenceData": {
				"averageCadenceMoving": 84.16877173714076,
				"cadencePercentageMoving": 89.20640104506859,
				"cadenceTimeMoving": 5463,
				"cadenceZones": null,
				"crankRevolutions": 7740.983333333314,
				"lowerQuartileCadence": 79,
				"medianCadence": 87,
				"standardDeviationCadence": 15.7,
				"upperQuartileCadence": 93
			},
			"elevationData": {
				"accumulatedElevationAscent": 389.8135095003674,
				"accumulatedElevationDescent": 374.2319520937469,
				"ascentSpeed": {
					"avg": 680.7097343766151,
					"lowerQuartile": 582,
					"median": 703,
					"upperQuartile": 820
				},
				"ascentSpeedZones": null,
				"avgElevation": 240,
				"elevationZones": null,
				"lowerQuartileElevation": 215,
				"medianElevation": 231,
				"upperQuartileElevation": 245
			},
			"gradeData": {
				"avgGrade": 0.016110032040401574,
				"gradeProfile": "HILLY",
				"gradeZones": null,
				"lowerQuartileGrade": -1.3,
				"medianGrade": 0,
				"upFlatDownDistanceData": {
					"down": 12.025700000000024,
					"flat": 31.471999999999966,
					"up": 12.775000000000013
				},
				"upFlatDownInSeconds": {
					"down": 1103,
					"flat": 3278,
					"total": 6126,
					"up": 1745
				},
				"upFlatDownMoveData": {
					"down": 39.24979147778793,
					"flat": 34.56351433801095,
					"up": 26.35530085959888
				},
				"upperQuartileGrade": 1.5
			},
			"heartRateData": {
				"TRIMP": 218.15685306127534,
				"TRIMPPerHour": 128.2018725139718,
				"activityHeartRateReserve": 75.40556362367299,
				"activityHeartRateReserveMax": 93.10344827586206,
				"averageHeartRate": 164.33806725432584,
				"hrrZones": null,
				"lowerQuartileHeartRate": 161,
				"maxHeartRate": 190,
				"medianHeartRate": 167,
				"upperQuartileHeartRate": 174
			},
			"moveRatio": 0.9996736292428199,
			"paceData": {
				"avgPace": 109,
				"lowerQuartilePace": 131.57894736842104,
				"medianPace": 107.5268817204301,
				"paceZones": null,
				"upperQuartilePace": 92.59259259259258,
				"variancePace": 47.99505236265758
			},
			"powerData": {
				"avgWatts": 211.45788442703233,
				"avgWattsPerKg": 3.020826920386176,
				"hasPowerMeter": false,
				"lowerQuartileWatts": 91,
				"medianWatts": 205,
				"powerZones": null,
				"punchFactor": null,
				"upperQuartileWatts": 305,
				"variabilityIndex": 1.1639365992694912,
				"weightedPower": 246.12357088872113,
				"weightedWattsPerKg": 3.5160510126960163
			},
			"speedData": {
				"avgPace": 109,
				"genuineAvgSpeed": 33.063408423114524,
				"lowerQuartileSpeed": 27.36,
				"medianSpeed": 33.480000000000004,
				"speedZones": null,
				"standardDeviationSpeed": 8.660700403562975,
				"totalAvgSpeed": 33.05261749347252,
				"upperQuartileSpeed": 38.88,
				"varianceSpeed": 75.00773148027588
			},
			"toughnessScore": null
		},
		"hasPowerMeter": false,
		"id": 723224273,
		"moving_time_raw": 6128,
		"name": "Bon rythme ! 33 KPH !!",
		"private": false,
		"short_unit": "km",
		"start_time": "2016-09-24T12:30:27+0000",
		"trainer": false,
		"type": "Ride"
	},
	{
		"bike_id": 2042105,
		"calories": 536.3377348500001,
		"commute": false,
		"display_type": "Sortie à vélo",
		"distance_raw": 24780,
		"elapsed_time_raw": 3184,
		"elevation_gain_raw": 111,
		"elevation_unit": "m",
		"extendedStats": {
			"cadenceData": {
				"averageCadenceMoving": 80.66152968036529,
				"cadencePercentageMoving": 85.77023498694517,
				"cadenceTimeMoving": 2628,
				"cadenceZones": null,
				"crankRevolutions": 3565.900000000002,
				"lowerQuartileCadence": 76,
				"medianCadence": 83,
				"standardDeviationCadence": 13.9,
				"upperQuartileCadence": 88
			},
			"elevationData": {
				"accumulatedElevationAscent": 110.84308471434869,
				"accumulatedElevationDescent": 105.59411080277124,
				"ascentSpeed": {
					"avg": 511.9574622833229,
					"lowerQuartile": 424,
					"median": 495,
					"upperQuartile": 581
				},
				"ascentSpeedZones": null,
				"avgElevation": 221,
				"elevationZones": null,
				"lowerQuartileElevation": 217,
				"medianElevation": 221,
				"upperQuartileElevation": 224
			},
			"gradeData": {
				"avgGrade": 0.024684305714794286,
				"gradeProfile": "FLAT",
				"gradeZones": null,
				"lowerQuartileGrade": -1,
				"medianGrade": 0,
				"upFlatDownDistanceData": {
					"down": 3.9078999999999886,
					"flat": 16.860300000000016,
					"up": 4.00259999999999
				},
				"upFlatDownInSeconds": {
					"down": 464,
					"flat": 1995,
					"total": 3096,
					"up": 637
				},
				"upFlatDownMoveData": {
					"down": 30.31991379310336,
					"flat": 30.424601503759433,
					"up": 22.620659340659287
				},
				"upperQuartileGrade": 1
			},
			"heartRateData": {
				"TRIMP": 64.47022126362747,
				"TRIMPPerHour": 75.74830174577639,
				"activityHeartRateReserve": 59.612519132078866,
				"activityHeartRateReserveMax": 88.27586206896552,
				"averageHeartRate": 141.43815274151436,
				"hrrZones": null,
				"lowerQuartileHeartRate": 133,
				"maxHeartRate": 183,
				"medianHeartRate": 139,
				"upperQuartileHeartRate": 148
			},
			"moveRatio": 0.9723618090452262,
			"paceData": {
				"avgPace": 125,
				"lowerQuartilePace": 153.84615384615384,
				"medianPace": 120.48192771084338,
				"paceZones": null,
				"upperQuartilePace": 107.5268817204301,
				"variancePace": 53.52949234605023
			},
			"powerData": {
				"avgWatts": 155.30890992167102,
				"avgWattsPerKg": 2.2186987131667286,
				"hasPowerMeter": false,
				"lowerQuartileWatts": 46,
				"medianWatts": 138,
				"powerZones": null,
				"punchFactor": null,
				"upperQuartileWatts": 226,
				"variabilityIndex": 1.239706690062989,
				"weightedPower": 192.53749465628567,
				"weightedWattsPerKg": 2.750535637946938
			},
			"speedData": {
				"avgPace": 125,
				"genuineAvgSpeed": 28.72761627906971,
				"lowerQuartileSpeed": 23.400000000000002,
				"medianSpeed": 29.880000000000003,
				"speedZones": null,
				"standardDeviationSpeed": 8.200771062096281,
				"totalAvgSpeed": 27.933636934673313,
				"upperQuartileSpeed": 33.480000000000004,
				"varianceSpeed": 67.25264601291576
			},
			"toughnessScore": null
		},
		"hasPowerMeter": false,
		"id": 727632286,
		"moving_time_raw": 3105,
		"name": "Lunch Ride",
		"private": false,
		"short_unit": "km",
		"start_time": "2016-09-28T10:06:35+0000",
		"trainer": false,
		"type": "Ride"
	},
	{
		"bike_id": null,
		"calories": 357.37026476759996,
		"commute": false,
		"display_type": "Course",
		"distance_raw": 4014.8,
		"elapsed_time_raw": 2358,
		"elevation_gain_raw": 17.2,
		"elevation_unit": "m",
		"extendedStats": {
			"cadenceData": null,
			"elevationData": {
				"accumulatedElevationAscent": 17.0370699742856,
				"accumulatedElevationDescent": 17.061282282660926,
				"ascentSpeed": {
					"avg": 112.55573036546497,
					"lowerQuartile": 87,
					"median": 113,
					"upperQuartile": 133
				},
				"ascentSpeedZones": null,
				"avgElevation": 228,
				"elevationZones": null,
				"lowerQuartileElevation": 224,
				"medianElevation": 225,
				"upperQuartileElevation": 231
			},
			"gradeData": {
				"avgGrade": 0.07918047079337277,
				"gradeProfile": "FLAT",
				"gradeZones": null,
				"lowerQuartileGrade": -0.8,
				"medianGrade": 0,
				"upFlatDownDistanceData": {
					"down": 0.5511000000000004,
					"flat": 2.8705999999999983,
					"up": 0.5928000000000013
				},
				"upFlatDownInSeconds": {
					"down": 331,
					"flat": 1497,
					"total": 2295,
					"up": 467
				},
				"upFlatDownMoveData": {
					"down": 5.993836858006047,
					"flat": 6.903246492985967,
					"up": 4.569764453961467
				},
				"upperQuartileGrade": 0.8
			},
			"heartRateData": {
				"TRIMP": 50.19714310347935,
				"TRIMPPerHour": 82.66684134150304,
				"activityHeartRateReserve": 60.9925229516989,
				"activityHeartRateReserveMax": 88.96551724137932,
				"averageHeartRate": 143.4391582799634,
				"hrrZones": null,
				"lowerQuartileHeartRate": 129,
				"maxHeartRate": 184,
				"medianHeartRate": 133,
				"upperQuartileHeartRate": 161
			},
			"moveRatio": 0.9732824427480916,
			"paceData": {
				"avgPace": 569,
				"lowerQuartilePace": 769.230769230769,
				"medianPace": 714.2857142857142,
				"paceZones": null,
				"upperQuartilePace": 399.99999999999994,
				"variancePace": 765.5372777470138
			},
			"powerData": null,
			"speedData": {
				"avgPace": 569,
				"genuineAvgSpeed": 6.323450980392158,
				"lowerQuartileSpeed": 4.680000000000001,
				"medianSpeed": 5.04,
				"speedZones": null,
				"standardDeviationSpeed": 2.1685432020384816,
				"totalAvgSpeed": 6.154503816793894,
				"upperQuartileSpeed": 9,
				"varianceSpeed": 4.702579619107311
			},
			"toughnessScore": null
		},
		"hasPowerMeter": false,
		"id": 799672885,
		"moving_time_raw": 2196,
		"name": "Running back... Hard !",
		"private": true,
		"short_unit": "km",
		"start_time": "2016-12-11T14:45:50+0000",
		"trainer": false,
		"type": "Run"
	}
]`);
