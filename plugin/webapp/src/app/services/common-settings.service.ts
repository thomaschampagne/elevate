import { Injectable } from '@angular/core';

export interface ISection {
	title: string;
	options: IOption[];
}

export interface IOption {
	key: string;
	type: string;
	title: string;
	labels: string[];
	html: string;
	list?: IListItem[];
	enableSubOption?: string[];
	active?: any;
	hidden?: boolean;
	value?: any;
	min?: number; // For input number type only
	max?: number; // For input number type only
	step?: number; // For input number type only
	disableTooltip?: boolean; // For input number type only
}

export interface IListItem {
	key: string;
	name: string;
}

@Injectable()
export class CommonSettingsService {

	public static TYPE_OPTION_CHECKBOX: string = "checkbox";
	public static TYPE_OPTION_LIST: string = "list";
	public static TYPE_OPTION_NUMBER: string = "number";

	private _sections: ISection[] = [{
		title: "Athlete History Synchronisation",
		options: [{
			key: "autoSyncMinutes",
			type: "number",
			title: "Auto sync every X minutes while browsing strava.com",
			labels: ["All"],
			html: "Allow you to synchronise automatically your history while browsing strava.com.<br/><br />Auto sync is triggered if X minutes have been flow out since your last synchronisation.<br /><br />- Default is 60 minutes.<br /><br />- Min: 10 minutes, Max: 43200 minutes (~30 days)",
			min: 10,
			max: 43200, // 30 days
			step: 1,
			disableTooltip: true,
		}],
	}, {
		title: "Activities Extended Data",
		options: [{
			key: "displayActivityRatio",
			type: "checkbox",
			title: "Move Ratio",
			labels: ["Cycling", "Running"],
			html: "Add your activity ratio in activity page. Try to always reach the value of <strong>1</strong>. The value <strong>1</strong> means that you got no rest during your activity. <br /><br /><strong>MOVE YOURSELF !!</strong>",
		}, {
			key: "displayMotivationScore",
			type: "checkbox",
			title: "Toughness Factor",
			labels: ["Cycling"],
			html: "Add a represention of how much you involved yourself in the cycling activity performed. A higher score indicates a better toughness.",
		}, {
			key: "displayAdvancedPowerData",
			type: "checkbox",
			title: "Power data",
			labels: ["Cycling", "Running"],
			html: "<strong style=\"font-size: 18px;\">Weighted Power (or estimated...):</strong><br /><br /><strong>If you own a power meter, the true weighted power will be of course computed. Estimated Weighted Power is only a estimation for cyclist who don't have this sensor</strong> <br /> <br />The <i>Estimated Weighted Power</i> is basically the <i>Estimated Average Power</i> given by Strava which has been normalized... Weighted Power or estimated is more meaningfull than <i>Average Power</i>. Why? While average power simply takes all of the samples of power and divides them by the number of samples, <i>Weighted Power</i> uses a tricky weighting system to come up with a number that is more in line with the true physiological effort for your given activity. <br/> <br/><i>Weighted Power</i> is basically the power that you could have maintainted for the same physiological \"cost\" if your power output had been constant. <br/> <br/><i>Weighted Power</i> is calculated from an algorithm introduced by Dr. Andy Coggan to weight this variability according to its physiological difficulty. Here's the formula: <br/> <br/><img src=\"img/np_equation.png\" /> <br /> <br />Remember that <i>Estimated Weighted Power</i> is an estimation because it's based on <i>Estimated Average Power</i> ! <br /> <br /><strong style=\"font-size: 18px; \">Variability Index:</strong> <br/><br/>Variability Index is an indication of how your activity was paced. This indication shows how smooth or evenly paced the power output was during a race or work out. Basically Variability Index is <i>Weighted Power</i> over <i>Average watts</i>:<br/><br/> <img src=\"https://latex.codecogs.com/png.latex?\\inline&space;VariabilityIndex&space;=&space;\\frac{WeigthedPower}{Average&space;watts}\" /> <br /> <br /><strong style=\"font-size: 18px; \">Intensity:</strong> <br /> <br />Although <i>Weighted Power</i> is a better measure of training intensity than average power, it does not take into account differences in fitness within or between individuals.<br/><br/>Intensity is simply the ratio of the <i>Weighted Power</i> as above over your Functional Threshold Power (FTP) (entered in athlete settings):.</br></br> <img src=\"https://latex.codecogs.com/png.latex?\\inline&space;Intensity&space;=&space;\\frac{WeigthedPower}{Cycling&space;FTP}\" /> <br/> <br />For example, if your <i>Weighted Power</i> for a long training ride done early in the year is 210 W and your threshold power at the time is 280 W, then the PF for that workout would be 0.75. However, if you did that same exact ride later in the year after your threshold power had risen to 300 W, then the PF would be lower, i.e., 0.70. <strong>Intensity</strong> therefore provides a valid and convenient way of comparing the relative intensity of a training session or race either within or between riders, taking into account changes or differences in threshold power. <br/> <br /> Typical <strong>Intensity</strong> values for various training sessions or races are as follows: <br /> <br/> Less than 0.75 are recovery rides <br /> <br/> 0.75-0.85 endurance-paced training rides <br /> <br/> 0.85-0.95 tempo rides, aerobic and anaerobic interval workouts (work and rest periods combined), longer (>2.5 h) road races <br/> <br /> 0.95-1.05 lactate threshold intervals (work period only), shorter (<2.5 h) road races, criteriums, circuit races, longer (e.g., 40 km) Tts <br/> <br /> 1.05-1.15 shorter (e.g., 15 km) TTs, track points race <br /> <br/> Greater than 1.15 prologue TT, track pursuit, track miss-and-o; <br /><br />" +
			"<strong style=\"font-size: 18px; \">Power Score Score:</strong><br /><br />If you own a cycling power meter then you get get the \"Power Stress Score (PSS)\" into your cycling activities. PSS formula is:<br/></br><img src=\"https://latex.codecogs.com/png.latex?%5Cinline%20PowerStressScore(PSS)%3D%20%5Cfrac%7BEffortInSeconds%5C%20.%20%5C%20WeightedPower%5C%20.%20%5C%20Intensity%7D%7BCyclingFTP%5C%20.%20%5C%203600%7D%5C%20.%20%5C%20100\"/>" +
			"<br/></br><strong style=\"font-size: 18px; \">Average Watts / Kg:</strong><br /><br />\"Average Watts / Kg\" is basically the power per Kilogram you maintained during an activity <br/></br>That's simply your <i>Average Power</i> over your weight. <br /></br><strong style=\"font-size: 18px; \">Weighted Watts / Kg:</strong> <br /> <br />\"Weighted Watts / Kg\" is basically an estimation of the power per Killogram that you could have maintainted for the same physiological \"cost\" if your power output had been constant <br/></br>That's simply your <i>Weighted Power</i> over your weight. <br/> <br/><strong style=\"font-size: 18px; \">Quartiles and median</strong> <br/> <br/>For understanding these indicators, we assume that 0% to 100% are all the heart rates sorted ascending you obtained during an activity. <br/> <br/> <strong>25% Quartile:</strong>This indicator represents the power you maintained at the position \"25%\". This is commonly called \"Lower quartile\" or Q1. <br/> <br/> <strong>50% Median:</strong>This indicator represents the power you maintained at the position \"50%\". It's simply the median... <br/> <br/> <strong>75% Quartile:</strong>This indicator represents the power you maintained at the position \"75%\". This is commonly called \"Upper quartile\" or Q3. <br/> <br/> <br/><i>These indicators can be more meaningfull than average power itself to analyse activity power. For example, you upload an activity in which you ride pretty fast for a long time. Then, you expect to have a good average power. Unfortunately, you have to go through the city to go home where many red lights and cars behavior slow you down. Your average power then drops very quickly and do not highlight your effort of \"riding with power\". In this example, the 75% quartile power is representative of the effort you made (eliminating low power associated with the cross of the city).</i> <br/> <br/> <br/><a href=\"http://en.wikipedia.org/wiki/Quartile\" target=\"_blank\">Understand lower quartile, median and upper quartile here</a> </div>",
		}, {
			key: "displayAdvancedHrData",
			type: "checkbox",
			title: "Heart rate data",
			labels: ["Cycling", "Running"],
			html: "<div style=\"font-size: 14px;\"><strong>First of all... You need to record heart rate data inside Strava activities to enjoy these features. Good reading...</strong><br/> <br/> <strong style=\"font-size: 18px; \"><u>TR</u>aining <u>IMP</u>ulse or TRIMP</strong><br/><br/>Represents the amount of heart stress during an activity. The longer you ride at full throttle, the more you SCORE !! So go outside suffer for twelve hours! Or stay here to understand what it returns... <i>TRIMP</i> is a way to model the human athletic performance. This concept has been introduced by Dr Eric Banister. <br/> <br/>Ok, Cool... But how this works?! <br/> <br/>StravistiX computes <i>TRIMP</i> on activities using the most sophisticated approach: <i>TRIMP Exponental Heart Rate Scaling</i> which use your <i>Heart Rate Reserve or HRR</i>. <i>HRR</i> is basically your heart effort level according to your heart capacity . <br/> <br/>What are all these terms?! Don't panic... Here is an explanation from a Math view (you may hate that, sorry...). <br/> <br/> <img src=\"img/trimp_equation.png\" /> <br/> <br/>Where&nbsp;&nbsp; <img src=\"img/kMen_equation.png\" />&nbsp;&nbsp;(For Mens) &nbsp;&nbsp;or&nbsp;&nbsp; <img src=\"img/kWomen_equation.png\" />&nbsp;&nbsp;(For Womens) <br/> <br/>And <i>HRR = Heart Rate Reserve = Heart effort level according to heart capacity</i> defined by <br/> <br/> <img src=\"img/hrr_equation.png\" /> <br/> <br/>According this <i>TRIMP Exponental Heart Rate Scaling</i> formula, the longer you ride at full throttle, the more you SCORE ! <br/> <br/>But this heart score seems to be <i>Strava Suffer Score</i>?! Not really... <i>Strava Suffer Score</i> is only inspired by the TRIMP concept. However the idea is same and both score are correlated. <br/> <br/>Need more infos? Then read more about <a href=\"http://fellrnr.com/wiki/Heart_Rate_Reserve\" target=\"_blank\">HRR here</a> and <a href=\"http://fellrnr.com/wiki/TRIMP\" target=\"_blank\">TRIMP here</a> <br/> <br/> <strong style=\"font-size: 18px; \">%Heart Rate Reserve Average</strong><br/><br/>Represents the stress level reached during an activity according to your heart capacity. As mentionned into <i><u>TR</u>aining <u>IMP</u>ulse</i> explanation section, Heart Rate Reserve is basically a heart effort level according to a heart capacity: <br/> <br/> <img src=\"img/hrr_equation.png\" /> <br/> <br/>This indicator is scaled on a complete activity, then average heart rate participates to the party. <br/> <br/>Consequently <i>%Heart Rate Reserve Average</i> is defined by <br/> <br/> <img src=\"img/hrrAvg_equation.png\" /> <br/> <br/>If you rode with a %HRR Avg of 100% this seems you were at full capacity of your heart during the whole activity. It's impossible... But try to get the higher percentage ;) You will get a better <i>TRIMP</i> score in the same way. <br/> <br/> <strong style=\"font-size: 18px; \">Quartiles and median</strong> <br/> <br/>For understanding these indicators, we assume that 0% to 100% are all the heart rates sorted ascending you obtained during an activity. <br/> <br/> <strong>25% Quartile:</strong>This indicator represents the heart rate you maintained at the position \"25%\". This is commonly called \"Lower quartile\" or Q1. <br/> <br/> <strong>50% Median:</strong>This indicator represents the heart rate you maintained at the position \"50%\". It's simply the median... <br/> <br/> <strong>75% Quartile:</strong>This indicator represents the heart rate you maintained at the position \"75%\". This is commonly called \"Upper quartile\" or Q3. <br/> <br/> <br/><i>These indicators can be more meaningfull than average heart rate itself to analyse activity heart rate. For example, you upload an activity in which you ride pretty fast for a long time. Then, you expect to have a good average heart rate. Unfortunately, you have to go through the city to go home where many red lights and cars behavior slow you down. Your average heart rate then drops very quickly and do not highlight your effort of \"riding fast\". In this example, the 75% quartile heart rate is representative of the effort you made (eliminating low heart rate associated with the cross of the city).</i> <br/> <br/> <br/><a href=\"http://en.wikipedia.org/wiki/Quartile\" target=\"_blank\">Understand lower quartile, median and upper quartile here</a> </div>",
		}, {
			key: "displayAdvancedSpeedData",
			type: "checkbox",
			title: "Speed data",
			labels: ["Cycling", "Running"],
			html: "This option adds new speed data to your activity panel.<br/><br/>For understanding these indicators, we assume that 0% to 100% are all the speeds sorted ascending you obtained during an activity.<br/><br/><strong>25% Quartile:</strong> This indicator represents the speed you maintained at the position \"25%\". This is commonly called \"Lower quartile\" or Q1.<br/><br/><strong>50% Median:</strong> This indicator represents the speed you maintained at the position \"50%\". It's simply the median...<br/><br/><strong>75% Quartile:</strong> This indicator represents the speed you maintained at the position \"75%\". This is commonly called \"Upper quartile\" or Q3.<br/><br/><br/><i>These indicators can be more meaningfull than average speed itself to analyse activity speed. For example, you upload an activity in which you ride pretty fast for a long time. Then, you expect to have a good average speed. Unfortunately, you have to go through the city to go home where many red lights and cars behavior slow you down. Your average speed then drops very quickly and do not highlight your effort of \"riding fast\". In this example, the 75% quartile speed is representative of the effort you made (eliminating low speeds associated with the cross of the city).</i><br/><br/><br/><strong>Standard Deviation Speed &sigma;:</strong> This indicator represents the amount of variation or dispersion of speeds from your average speed. It gives a good estimation of how your ride was paced (like variability index). From a mathematical view, this is the square root of the variance computed through this formula (<i>X is speed</i>):<br/><br/><img src=\"img/stdDeviation.png\"/><br/><br/><br/><br/><a href=\"http://en.wikipedia.org/wiki/Quartile\" target=\"_blank\">Understand lower quartile, median and upper quartile here</a><br/><br/><a href=\"http://en.wikipedia.org/wiki/Standard_deviation\" target=\"_blank\">Understand Standard deviation here</a>",
		}, {
			key: "displayCadenceData",
			type: "checkbox",
			title: "Cadence data",
			labels: ["Cycling", "Running"],
			html: "Add cadence data for your cycling & running activities<br/><br/>Of course, a cadence sensor is required to get this feature.",
		}, {
			key: "displayAdvancedGradeData",
			type: "checkbox",
			title: "Grade data",
			labels: ["Cycling", "Running"],
			html: "<h3>Grade Profile</h3> Tell you if your activity was \"Hilly\" with climbs and downhills or \"Flat\" is you activity has been performed on... flat. <h3>Quartiles</h3> For understanding these indicators, we assume that 0% to 100% are all the grades sorted ascending you obtained during an activity.</br></br> <strong>25% Quartile</strong>: This indicator represents the grades you maintained at the position \"25%\". This is commonly called \"Lower quartile\" or Q1.</br></br> <strong>50% Median</strong>: This indicator represents the grades you maintained at the position \"50%\". It's simply the median...</br></br> <strong>75% Quartile</strong>: This indicator represents the grades you maintai</strong>ned at the position \"75%\". This is commonly called \"Upper quartile\" or Q3. <h3>Times and percentages during climbs, flats and downhills</h3> Do what section title describes... :)",
		}, {
			key: "displayAdvancedElevationData",
			type: "checkbox",
			title: "Elevation data",
			labels: ["Cycling", "Running"],
			html: "<h3>Average Elevation</h3> The... average elevation of your activity :) <h3>Elevation Quartiles</h3> For understanding these indicators, we assume that 0% to 100% are all the elevations sorted ascending you obtained during an activity.</br> </br> <strong>25% Quartile</strong>: This indicator represents the elevations you maintained at the position \"25%\". This is commonly called \"Lower quartile\" or Q1.</br> </br> <strong>50% Median</strong>: This indicator represents the elevations you maintained at the position \"50%\". It's simply the median...</br> </br> <strong>75% Quartile</strong>: This indicator represents the elevations you maintai</strong>ned at the position \"75%\". This is commonly called \"Upper quartile\" or Q3. <h3>Average Ascent Speed or VAM</h3> VAM is an abbreviation for the Italian term \"Velocità Ascensionale Media\", translated in English to mean \"average ascent speed\" or \"mean ascent velocity\". This is basically your average ascent speed while climbing. The unit used in StravistiX to represent this indicator is \"Vm/h\" for vertical metres per hour. <h3>Ascent Speed Quartiles</h3> For understanding these indicators, we assume that 0% to 100% are all the ascent speeds sorted ascending you obtained during an activity.  The unit used in StravistiX to represent this indicator is \"Vm/h\" for vertical metres per hour.</br> </br> <strong>25% Quartile</strong>: This indicator represents the ascent speed you maintained at the position \"25%\". This is commonly called \"Lower quartile\" or Q1.</br> </br> <strong>50% Median</strong>: This indicator represents the ascent speed you maintained at the position \"50%\". It's simply the median...</br> </br> <strong>75% Quartile</strong>: This indicator represents the ascent speed you maintained at the position \"75%\". This is commonly called \"Upper quartile\" or Q3. <h3>Ascent</h3> Computed ascents for different smoothing values <h3>Descent</h3> Computed descents for different smoothing values ",
		}],
	}, {
		title: "Activity viewing options",
		options: [{
			key: "enableBothLegsCadence",
			type: "checkbox",
			title: "Enable both legs extended cadence data",
			labels: ["Running"],
			html: "This will display StravistiX extended cadence data for 2 legs instead of 1 e.g 180 SPM, not 90 SPM.",
		}, {
			key: "displayBikeOdoInActivity",
			type: "checkbox",
			title: "Enable bike odo display",
			labels: ["Cycling"],
			html: "This option allows you to display the total distance traveled with the bike which has done the activity.<br /><br />This value is displayed alongside your bike name in an activity page and is refreshed each 2 hours.<br /><br />Of course, it implies that you have declared at least 1 bike in Strava.",
		}, {
			key: "activateRunningGradeAdjustedPace",
			type: "checkbox",
			title: "Enable Grade Adjusted Pace graph",
			labels: ["Running"],
			html: "Activate running \"Grade Adjusted Pace\" graph by default in running activity analysis.<br /><br /><img src=\"img/activateRunningGradeAdjustedPace.png\"/>",
		}, {
			key: "activateRunningHeartRate",
			type: "checkbox",
			title: "Enable Heart Rate graph",
			labels: ["Running"],
			html: "Activate running heart rate graph by default in running activity analysis.<br /><br /><img src=\"img/activateRunningHeartRate.png\"/>",
		}, {
			key: "activateRunningTemperature",
			type: "checkbox",
			title: "Enable Temperature graph",
			labels: ["Running"],
			html: "Activate temperature graph by default in running activity analysis",
		}, {
			key: "activateRunningCadence",
			type: "checkbox",
			title: "Enable Cadence graph",
			labels: ["Running"],
			html: "Activate running cadence graph by default in running activity analysis.",
		}, {
			key: "activityStravaMapType",
			type: "list",
			labels: ["All"],
			list: [{
				key: "terrain",
				name: "Terrain",
			}, {
				key: "standard",
				name: "Standard",
			}, {
				key: "satellite",
				name: "Satellite",
			}],
			title: "Default Strava Map type displayed in activities",
			html: "Do what title describes...",
		}, {
			key: "displaySegmentTimeComparisonToKOM",
			type: "checkbox",
			title: "Enabled segment time comparison to KOM/QOM display",
			labels: ["All"],
			html: "This option allows you to display the time difference between segment KOM/QOM time and the time from the activity for that segment.",
		}, {
			key: "displaySegmentTimeComparisonToPR",
			type: "checkbox",
			title: "Enabled segment time comparison to PR display",
			labels: ["All"],
			html: "This option allows you to display the time difference between segment PR time and the time from the activity for that segment.",
		}, {
			key: "displaySegmentTimeComparisonToCurrentYearPR",
			type: "checkbox",
			title: "Enabled segment time comparison to current year PR display",
			labels: ["All"],
			html: "This option allow you to display the time difference between segment current year PR time and the time from the activity for that segment.",
		}, {
			key: "displaySegmentTimeComparisonPosition",
			type: "checkbox",
			title: "Enabled segment time comparison rank column",
			labels: ["All"],
			html: "This option allow you to display as \"fast reading\" your current rank on segments in a new column on segments efforts rows.",
		}, {
			key: "reviveGoogleMaps",
			type: "checkbox",
			title: "Revive Google Maps on activities",
			labels: ["All"],
			html: "Strava has discontinued Google Maps inside the web version to use \"MapBox+OpenStreetMap\" maps.<br/><br/>This option allows you revive Google Maps and Street view features with an orange button placed near Strava native maps.<br/><br/><strong>Note:</strong> This feature is currently working only on activity pages at the moment.",
			enableSubOption: ["reviveGoogleMapsLayerType"],
		}, {
			key: "reviveGoogleMapsLayerType",
			type: "list",
			labels: ["All"],
			list: [{
				key: "roadmap",
				name: "Roadmap",
			}, {
				key: "satellite",
				name: "Satellite",
			}, {
				key: "hybrid",
				name: "Satellite + Legends",
			}, {
				key: "terrain",
				name: "Terrain",
			}],
			title: "Default Google Maps layer type",
			html: "Do what title describes...",
		}, {
			key: "displayActivityBestSplits",
			type: "checkbox",
			title: "Enable best splits into your cycling activities",
			labels: ["Cycling"],
			html: "This option allows to enable best splits into your cycling activities.",
		}, {
			key: "defaultLeaderBoardFilter",
			type: "list",
			labels: ["All"],
			list: [{
				key: "overall",
				name: "Overall",
			}, {
				key: "men",
				name: "Men",
			}, {
				key: "women",
				name: "Women",
			}, {
				key: "following",
				name: "Following",
			}, {
				key: "my_results",
				name: "My Results",
			}],
			title: "Default Leaderboard Filter",
			html: "Choose your default leaderboard filter inside related segments pages. Select filter among:<br /><br />&diams; Overall<br />&diams; Men<br />&diams; Women<br />&diams; Your following/followers<br />&diams; Your results",
		}, {
			key: "displayReliveCCLink",
			type: "checkbox",
			title: "Relive your rides/runs with relive.cc",
			labels: ["Cycling", "Running"],
			html: "This will display an embedded video of your rides/runs from relive.cc service. Make sure to connect your strava account to <a href=\"http://relive.cc\" target=\"_blank\">relive.cc</a>. <br/><br/><strong>Note:</strong> Only rides/runs done after a relive.cc subscription can get a \"Relive\".",
		}],
	}, {
		title: "Segments viewing options",
		options: [{
			key: "displaySegmentRankPercentage",
			type: "checkbox",
			title: "Segment Rank %",
			labels: ["All"],
			html: "Add your segment rank percentage on segment page. <br /><br /><img src=\"img/displaySegmentRankPercentage.png\"/>",
		}, {
			key: "displayNearbySegments",
			type: "checkbox",
			title: "Nearby Segments",
			labels: ["Cycling", "Running"],
			html: "This option displays cycling and running nearby segments on a segment page.",
		}],

	}, {
		title: "Activities and Segments viewing options",
		options: [{
			key: "remoteLinks",
			type: "checkbox",
			title: "Enable veloviewer + surface + segment details remote views",
			labels: ["All"],
			html: "<strong>This enable on activities page</strong><br /><br />VeloViewer activity shortcut & raceshape activity surface.<br /><br /><strong>And on segments pages...</strong><br /><br />VeloViewer segment shortcut & Jonathan Okeeffe segment details.",
		}],
	}, {
		title: "Dashboard",
		options: [{
			key: "feedAutoScroll",
			type: "checkbox",
			title: "Feed auto-scroll",
			labels: ["All"],
			html: "Automatic scrolling on activity dashboard<br /><br /><img src=\"img/feedAutoScroll.png\"/>",
		}, {
			key: "feedHideChallenges",
			type: "checkbox",
			title: "Hide challenges",
			labels: ["All"],
			html: "This will hide all related challenge items in the dashboard feed (joined, milestones reached and completed).",
		}, {
			key: "feedHideCreatedRoutes",
			type: "checkbox",
			title: "Hide created routes",
			labels: ["All"],
			html: "This will hide all routes created in the dashboard feed.",
		}, {
			key: "feedHideSuggestedAthletes",
			type: "checkbox",
			title: "Hide suggested athletes",
			labels: ["All"],
			html: "This will hide the \"You Should Follow\" section from the dashboard feed sidebar",
		}, {
			key: "feedHideVirtualRides",
			type: "checkbox",
			title: "Hide virtual rides.",
			labels: ["Cycling"],
			html: "This will hide all virtual rides in the dashboard feed.",
			min: 0,
		}, {
			key: "feedHideRideActivitiesUnderDistance",
			type: "number",
			title: "Hide rides activities under distance.",
			labels: ["Cycling"],
			html: "This will hide all cycling rides (also virtual rides) in the dashboard feed if they are under distance you set (KM or MI). Set empty value or \"0\" to display all cycling rides in your feed",
			min: 0,
		}, {
			key: "feedHideRunActivitiesUnderDistance",
			type: "number",
			title: "Hide running activities under distance.",
			labels: ["Running"],
			html: "This will hide all running activities in the dashboard feed if they are under distance you set (KM or MI). Set empty value or \"0\" to display all running activities in your feed",
			min: 0,
		}],
	}, {
		title: "Weather units",
		options: [{
			key: "temperatureUnit",
			type: "list",
			labels: ["All"],
			list: [{
				key: "F",
				name: "Fahrenheit",
			}, {
				key: "C",
				name: "Celsius",
			}],
			title: "Temperature",
			html: "This selects which units to use when displaying temperature on weather activity overlay.",
		}, {
			key: "windUnit",
			type: "list",
			labels: ["All"],
			list: [{
				key: "mph",
				name: "Miles per hour",
			}, {
				key: "km/h",
				name: "Kilometers per hour",
			}, {
				key: "m/s",
				name: "Meters per second",
			}, {
				key: "kn",
				name: "Knots",
			}, {
				key: "bft",
				name: "Beaufort scale",
			}],
			title: "Wind Speed",
			html: "This selects which units to use when displaying wind speed on weather pages.",
		}],
	}, {
		title: "StravistiX Year progression targets for " + (new Date()).getFullYear(),
		options: [{
			key: "targetsYearRide",
			type: "number",
			title: "Cycling distance target for " + (new Date()).getFullYear(),
			labels: ["Cycling"],
			html: "Note: this target/goal is independent from strava premium annual goal",
			min: 0,
		}, {
			key: "targetsYearRun",
			type: "number",
			title: "Running distance target for " + (new Date()).getFullYear(),
			labels: ["Running"],
			html: "Note: this target/goal is independent from strava premium annual goal",
			min: 0,
		}],
	}, {
		title: "Hidden/Beta features",
		options: [{
			key: "showHiddenBetaFeatures",
			type: "checkbox",
			title: "Enable Hidden/Beta features",
			labels: ["All"],
			enableSubOption: ["displayRunningPowerEstimation", "displayRecentEffortsHRAdjustedPacePower"],
			html: "Show features which are hidden. Example: BETA features.",
		}, {
			key: "displayRunningPowerEstimation",
			type: "checkbox",
			title: "Display running power estimation on your activities",
			labels: ["Running"],
			html: "Display a running power estimation of your running activities. This estimation can be compared with cycling power (in watts) for a given running pace: especially useful for triathletes.<br/><br/>- Only works on <strong>your</strong> running activities which don\'t have any power data mapped to strava. (FYI: Real running power data coming from sensors like \"Stryd\" are no longer mapped in strava activities)<br/>- Make sure to <strong>setup your weight</strong> properly in athlete settings<br/><br/><i>Algorithm designed by Alan Couzens, Master of Science. Learn more about this feature <a target='_blank' href='https://alancouzens.com/blog/Run_Power.html'>here</a>.</i>",
		}, {
			key: "displayRecentEffortsHRAdjustedPacePower",
			type: "checkbox",
			title: "Display running estimated paces & cycling estimated powers from most painful effort on a segment (Experimental)",
			labels: ["Cycling", "Running"],
			html: "Experimental at the moment. This feature gives you a fitness trend in your segments. You can see estimations in \"Your recent efforts\" graph displayed on a segment page.<br /><br /><strong>Running:</strong> Display estimated <strong>paces</strong> based on best average heart rate of all efforts in a segment.<br /><br /><strong>Cycling:</strong> Display estimated <strong>powers</strong> based on best average heart rate of all efforts in a segment.",
		}]
	}];

	get sections(): ISection[] {
		return this._sections;
	}
}
