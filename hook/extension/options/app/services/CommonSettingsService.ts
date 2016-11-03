interface ICommonSettingsService {
    provideSections: () => Array<ISection>;
}

interface ISection {
    sectionTitle: string;
    sectionContent: Array<ISectionContent>;
}

interface ISectionContent {
    optionKey: string;
    optionType: string;
    optionTitle: string;
    optionLabels: Array<string>;
    optionHtml: string;
    optionList?: Array<IListItem>;
    optionEnableSub?: Array<string>;
    active?: any;
    hidden?: boolean;
    value?: any;
}
interface IListItem {
    key: string;
    name: string;
}

app.factory('CommonSettingsService', () => {

    let commonSettingsService: ICommonSettingsService = {
        provideSections: null
    };

    commonSettingsService.provideSections = () => {

        let sections: Array<ISection> = [{
            sectionTitle: 'Activities Extended Data',
            sectionContent: [{
                optionKey: 'displayActivityRatio',
                optionType: 'checkbox',
                optionTitle: 'Move Ratio',
                optionLabels: ['Cycling', 'Running'],
                optionHtml: 'Add your activity ratio in activity page. Try to always reach the value of <strong>1</strong>. The value <strong>1</strong> means that you got no rest during your activity. <br /><br /><strong>MOVE YOURSELF !!</strong>',
            }, {
                optionKey: 'displayMotivationScore',
                optionType: 'checkbox',
                optionTitle: 'Toughness Factor',
                optionLabels: ['Cycling'],
                optionHtml: 'Add a represention of how much you involved yourself in the cycling activity performed. A higher score indicates a better toughness.',
            }, {
                optionKey: 'displayAdvancedPowerData',
                optionType: 'checkbox',
                optionTitle: 'Power data',
                optionLabels: ['Cycling'],
                optionHtml: '<strong style="font-size: 18px; ">Estimated Weighted Power:</strong> <br /> <br /><strong>If you own a power meter, estimated weighted power value will not be displayed of course, it\'s only a estimation for cyclist who don\'t have this sensor</strong> <br /> <br />The <i>Estimated Weighted Power</i> is basically the <i>Estimated Average Power</i> given by Strava which has been normalized... This estimation is more meaningfull than <i>Estimated Average Power</i>. Why? While average power simply takes all of the samples of estimated power and divides them by the number of samples, <i>Estimated Weighted Power</i> uses a tricky weighting system to come up with a number that is more in line with the true physiological effort for your given activity. <br/> <br/><i>Weighted Power</i> is basically the power that you could have maintainted for the same physiological "cost" if your power output had been constant. <br/> <br/><i>Weighted Power</i> is calculated from an algorithm introduced by Dr. Andy Coggan to weight this variability according to its physiological difficulty. Here\'s the formula: <br/> <br/><img src="img/np_equation.png" /> <br /> <br />Remember that <i>Estimated Weighted Power</i> is an estimation because it\'s based on <i>Estimated Average Power</i> ! <br /> <br /><strong style="font-size: 18px; ">Variability Index:</strong> <br /> <br />Variability Index is an indication of how your activity was paced. This indication shows how smooth or evenly paced the power output was during a race or work out. Basically Variability Index is <i>Weighted Power</i> over <i>Average watts</i> <br /> <br /><strong style="font-size: 18px; ">Punch Factor:</strong> <br /> <br />Although <i>Weighted Power</i> is a better measure of training intensity than average power, it does not take into account differences in fitness within or between individuals. Therefore StravistiX introduce an <strong>Punch Factor</strong> (PF) for every activity. <br/> <br/><strong>Punch Factor</strong> is simply the ratio of the <i>Weighted Power</i> as above over your Functional Threshold Power (FTP) (entered in health settings). <br/> <br />For example, if your <i>Weighted Power</i> for a long training ride done early in the year is 210 W and your threshold power at the time is 280 W, then the PF for that workout would be 0.75. However, if you did that same exact ride later in the year after your threshold power had risen to 300 W, then the PF would be lower, i.e., 0.70. <strong>Punch Factor</strong> therefore provides a valid and convenient way of comparing the relative intensity of a training session or race either within or between riders, taking into account changes or differences in threshold power. <br/> <br /> Typical <strong>Punch Factor</strong> values for various training sessions or races are as follows: <br /> <br/> Less than 0.75 are recovery rides <br /> <br/> 0.75-0.85 endurance-paced training rides <br /> <br/> 0.85-0.95 tempo rides, aerobic and anaerobic interval workouts (work and rest periods combined), longer (>2.5 h) road races <br/> <br /> 0.95-1.05 lactate threshold intervals (work period only), shorter (<2.5 h) road races, criteriums, circuit races, longer (e.g., 40 km) Tts <br/> <br /> 1.05-1.15 shorter (e.g., 15 km) TTs, track points race <br /> <br/> Greater than 1.15 prologue TT, track pursuit, track miss-and-o; <br /> <br /><strong style="font-size: 18px; ">Average Watts / Kg:</strong> <br /> <br />"Average Watts / Kg" is basically the power per Killogram you maintainted during an activity <br/></br>That\'s simply your <i>Average Power</i> over your weight. <br /></br><strong style="font-size: 18px; ">Weighted Watts / Kg:</strong> <br /> <br />"Weighted Watts / Kg" is basically an estimation of the power per Killogram that you could have maintainted for the same physiological "cost" if your power output had been constant <br/></br>That\'s simply your <i>Weighted Power</i> over your weight. <br/> <br/><strong style="font-size: 18px; ">Quartiles and median</strong> <br/> <br/>For understanding these indicators, we assume that 0% to 100% are all the heart rates sorted ascending you obtained during an activity. <br/> <br/> <strong>25% Quartile:</strong>This indicator represents the power you maintained at the position "25%". This is commonly called "Lower quartile" or Q1. <br/> <br/> <strong>50% Median:</strong>This indicator represents the power you maintained at the position "50%". It\'s simply the median... <br/> <br/> <strong>75% Quartile:</strong>This indicator represents the power you maintained at the position "75%". This is commonly called "Upper quartile" or Q3. <br/> <br/> <br/><i>These indicators can be more meaningfull than average power itself to analyse activity power. For example, you upload an activity in which you ride pretty fast for a long time. Then, you expect to have a good average power. Unfortunately, you have to go through the city to go home where many red lights and cars behavior slow you down. Your average power then drops very quickly and do not highlight your effort of "riding with power". In this example, the 75% quartile power is representative of the effort you made (eliminating low power associated with the cross of the city).</i> <br/> <br/> <br/><a href="http://en.wikipedia.org/wiki/Quartile" target="_blank">Understand lower quartile, median and upper quartile here</a> </div>',
            }, {
                optionKey: 'displayAdvancedHrData',
                optionType: 'checkbox',
                optionTitle: 'Heart rate data',
                optionLabels: ['Cycling', 'Running'],
                optionHtml: '<div style="font-size: 14px;"><strong>First of all... You need to record heart rate data inside Strava activities to enjoy these features. Good reading...</strong><br/> <br/> <strong style="font-size: 18px; "><u>TR</u>aining <u>IMP</u>ulse or TRIMP</strong><br/><br/>Represents the amount of heart stress during an activity. The longer you ride at full throttle, the more you SCORE !! So go outside suffer for twelve hours! Or stay here to understand what it returns... <i>TRIMP</i> is a way to model the human athletic performance. This concept has been introduced by Dr Eric Banister. <br/> <br/>Ok, Cool... But how this works?! <br/> <br/>StravistiX computes <i>TRIMP</i> on activities using the most sophisticated approach: <i>TRIMP Exponental Heart Rate Scaling</i> which use your <i>Heart Rate Reserve or HRR</i>. <i>HRR</i> is basically your heart effort level according to your heart capacity . <br/> <br/>What are all these terms?! Don\'t panic... Here is an explanation from a Math view (you may hate that, sorry...). <br/> <br/> <img src="img/trimp_equation.png" /> <br/> <br/>Where&nbsp;&nbsp; <img src="img/kMen_equation.png" />&nbsp;&nbsp;(For Mens) &nbsp;&nbsp;or&nbsp;&nbsp; <img src="img/kWomen_equation.png" />&nbsp;&nbsp;(For Womens) <br/> <br/>And <i>HRR = Heart Rate Reserve = Heart effort level according to heart capacity</i> defined by <br/> <br/> <img src="img/hrr_equation.png" /> <br/> <br/>According this <i>TRIMP Exponental Heart Rate Scaling</i> formula, the longer you ride at full throttle, the more you SCORE ! <br/> <br/>But this heart score seems to be <i>Strava Suffer Score</i>?! Not really... <i>Strava Suffer Score</i> is only inspired by the TRIMP concept. However the idea is same and both score are correlated. <br/> <br/>Need more infos? Then read more about <a href="http://fellrnr.com/wiki/Heart_Rate_Reserve" target="_blank">HRR here</a> and <a href="http://fellrnr.com/wiki/TRIMP" target="_blank">TRIMP here</a> <br/> <br/> <strong style="font-size: 18px; ">%Heart Rate Reserve Average</strong><br/><br/>Represents the stress level reached during an activity according to your heart capacity. As mentionned into <i><u>TR</u>aining <u>IMP</u>ulse</i> explanation section, Heart Rate Reserve is basically a heart effort level according to a heart capacity: <br/> <br/> <img src="img/hrr_equation.png" /> <br/> <br/>This indicator is scaled on a complete activity, then average heart rate participates to the party. <br/> <br/>Consequently <i>%Heart Rate Reserve Average</i> is defined by <br/> <br/> <img src="img/hrrAvg_equation.png" /> <br/> <br/>If you rode with a %HRR Avg of 100% this seems you were at full capacity of your heart during the whole activity. It\'s impossible... But try to get the higher percentage ;) You will get a better <i>TRIMP</i> score in the same way. <br/> <br/> <strong style="font-size: 18px; ">Quartiles and median</strong> <br/> <br/>For understanding these indicators, we assume that 0% to 100% are all the heart rates sorted ascending you obtained during an activity. <br/> <br/> <strong>25% Quartile:</strong>This indicator represents the heart rate you maintained at the position "25%". This is commonly called "Lower quartile" or Q1. <br/> <br/> <strong>50% Median:</strong>This indicator represents the heart rate you maintained at the position "50%". It\'s simply the median... <br/> <br/> <strong>75% Quartile:</strong>This indicator represents the heart rate you maintained at the position "75%". This is commonly called "Upper quartile" or Q3. <br/> <br/> <br/><i>These indicators can be more meaningfull than average heart rate itself to analyse activity heart rate. For example, you upload an activity in which you ride pretty fast for a long time. Then, you expect to have a good average heart rate. Unfortunately, you have to go through the city to go home where many red lights and cars behavior slow you down. Your average heart rate then drops very quickly and do not highlight your effort of "riding fast". In this example, the 75% quartile heart rate is representative of the effort you made (eliminating low heart rate associated with the cross of the city).</i> <br/> <br/> <br/><a href="http://en.wikipedia.org/wiki/Quartile" target="_blank">Understand lower quartile, median and upper quartile here</a> </div>',
            }, {
                optionKey: 'displayAdvancedSpeedData',
                optionType: 'checkbox',
                optionTitle: 'Speed data',
                optionLabels: ['Cycling', 'Running'],
                optionHtml: 'This option adds new speed data to your activity panel.<br/><br/>For understanding these indicators, we assume that 0% to 100% are all the speeds sorted ascending you obtained during an activity.<br/><br/><strong>25% Quartile:</strong> This indicator represents the speed you maintained at the position "25%". This is commonly called "Lower quartile" or Q1.<br/><br/><strong>50% Median:</strong> This indicator represents the speed you maintained at the position "50%". It\'s simply the median...<br/><br/><strong>75% Quartile:</strong> This indicator represents the speed you maintained at the position "75%". This is commonly called "Upper quartile" or Q3.<br/><br/><br/><i>These indicators can be more meaningfull than average speed itself to analyse activity speed. For example, you upload an activity in which you ride pretty fast for a long time. Then, you expect to have a good average speed. Unfortunately, you have to go through the city to go home where many red lights and cars behavior slow you down. Your average speed then drops very quickly and do not highlight your effort of "riding fast". In this example, the 75% quartile speed is representative of the effort you made (eliminating low speeds associated with the cross of the city).</i><br/><br/><br/><strong>Standard Deviation Speed &sigma;:</strong> This indicator represents the amount of variation or dispersion of speeds from your average speed. It gives a good estimation of how your ride was paced (like variability index). From a mathematical view, this is the square root of the variance computed through this formula (<i>X is speed</i>):<br/><br/><img src="img/stdDeviation.png"/><br/><br/><br/><br/><a href="http://en.wikipedia.org/wiki/Quartile" target="_blank">Understand lower quartile, median and upper quartile here</a><br/><br/><a href="http://en.wikipedia.org/wiki/Standard_deviation" target="_blank">Understand Standard deviation here</a>',
            }, {
                optionKey: 'displayCadenceData',
                optionType: 'checkbox',
                optionTitle: 'Cadence data',
                optionLabels: ['Cycling', 'Running'],
                optionHtml: 'Add cadence data for your cycling activities:<br/><br/>- Cadence % while moving<br/>- Cadence Time while moving (hh:mm:ss)<br/>- Crank revolutions count.<br/><br/>Of course, a cadence sensor is required to get this feature.',
            }, {
                optionKey: 'displayAdvancedGradeData',
                optionType: 'checkbox',
                optionTitle: 'Grade data',
                optionLabels: ['Cycling', 'Running'],
                optionHtml: '<h3>Grade Profile</h3> Tell you if your activity was "Hilly" with climbs and downhills or "Flat" is you activity has been performed on... flat. <h3>Quartiles</h3> For understanding these indicators, we assume that 0% to 100% are all the grades sorted ascending you obtained during an activity.</br></br> <strong>25% Quartile</strong>: This indicator represents the grades you maintained at the position "25%". This is commonly called "Lower quartile" or Q1.</br></br> <strong>50% Median</strong>: This indicator represents the grades you maintained at the position "50%". It\'s simply the median...</br></br> <strong>75% Quartile</strong>: This indicator represents the grades you maintai</strong>ned at the position "75%". This is commonly called "Upper quartile" or Q3. <h3>Times and percentages during climbs, flats and downhills</h3> Do what section title describes... :)',
            }, {
                optionKey: 'displayAdvancedElevationData',
                optionType: 'checkbox',
                optionTitle: 'Elevation data',
                optionLabels: ['Cycling', 'Running'],
                optionHtml: '<h3>Average Elevation</h3> The... average elevation of your activity :) <h3>Elevation Quartiles</h3> For understanding these indicators, we assume that 0% to 100% are all the elevations sorted ascending you obtained during an activity.</br> </br> <strong>25% Quartile</strong>: This indicator represents the elevations you maintained at the position "25%". This is commonly called "Lower quartile" or Q1.</br> </br> <strong>50% Median</strong>: This indicator represents the elevations you maintained at the position "50%". It\'s simply the median...</br> </br> <strong>75% Quartile</strong>: This indicator represents the elevations you maintai</strong>ned at the position "75%". This is commonly called "Upper quartile" or Q3. <h3>Average Ascent Speed or VAM</h3> VAM is an abbreviation for the Italian term "Velocità Ascensionale Media", translated in English to mean "average ascent speed" or "mean ascent velocity". This is basically your average ascent speed while climbing. The unit used in StravistiX to represent this indicator is "Vm/h" for vertical metres per hour. <h3>Ascent Speed Quartiles</h3> For understanding these indicators, we assume that 0% to 100% are all the ascent speeds sorted ascending you obtained during an activity.  The unit used in StravistiX to represent this indicator is "Vm/h" for vertical metres per hour.</br> </br> <strong>25% Quartile</strong>: This indicator represents the ascent speed you maintained at the position "25%". This is commonly called "Lower quartile" or Q1.</br> </br> <strong>50% Median</strong>: This indicator represents the ascent speed you maintained at the position "50%". It\'s simply the median...</br> </br> <strong>75% Quartile</strong>: This indicator represents the ascent speed you maintained at the position "75%". This is commonly called "Upper quartile" or Q3. <h3>Ascent</h3> Computed ascents for different smoothing values <h3>Descent</h3> Computed descents for different smoothing values ',
            }]
        }, {
            sectionTitle: 'Activity viewing options',
            sectionContent: [{
                optionKey: 'enableBothLegsCadence',
                optionType: 'checkbox',
                optionTitle: 'Enable both legs extended cadence data',
                optionLabels: ['Running'],
                optionHtml: 'This will display StravistiX extended cadence data for 2 legs instead of 1 e.g 180 SPM, not 90 SPM.',
            }, {
                optionKey: 'displayBikeOdoInActivity',
                optionType: 'checkbox',
                optionTitle: 'Enable bike odo display',
                optionLabels: ['Cycling'],
                optionHtml: 'This option allows you to display the total distance traveled with the bike which has done the activity.<br /><br />This value is displayed alongside your bike name in an activity page and is refreshed each 2 hours.<br /><br />Of course, it implies that you have declared at least 1 bike in Strava.',
            }, {
                optionKey: 'activateRunningGradeAdjustedPace',
                optionType: 'checkbox',
                optionTitle: 'Enable Grade Adjusted Pace graph',
                optionLabels: ['Running'],
                optionHtml: 'Activate running "Grade Adjusted Pace" graph by default in running activity analysis.<br /><br /><img src="img/activateRunningGradeAdjustedPace.png"/>',
            }, {
                optionKey: 'activateRunningHeartRate',
                optionType: 'checkbox',
                optionTitle: 'Enable Heart Rate graph',
                optionLabels: ['Running'],
                optionHtml: 'Activate running heart rate graph by default in running activity analysis.<br /><br /><img src="img/activateRunningHeartRate.png"/>',
            }, {
                optionKey: 'activateRunningTemperature',
                optionType: 'checkbox',
                optionTitle: 'Enable Temperature graph',
                optionLabels: ['Running'],
                optionHtml: 'Activate temperature graph by default in running activity analysis',
            }, {
                optionKey: 'activateRunningCadence',
                optionType: 'checkbox',
                optionTitle: 'Enable Cadence graph',
                optionLabels: ['Running'],
                optionHtml: 'Activate running cadence graph by default in running activity analysis.',
            }, {
                optionKey: 'activityStravaMapType',
                optionType: 'list',
                optionLabels: ['All'],
                optionList: [{
                    key: 'terrain',
                    name: 'Terrain'
                }, {
                    key: 'standard',
                    name: 'Standard'
                }, {
                    key: 'satellite',
                    name: 'Satellite'
                }],
                optionTitle: 'Default Strava Map type displayed in activities',
                optionHtml: 'Do what title describes...',
            }, {
                optionKey: 'displaySegmentTimeComparisonToKOM',
                optionType: 'checkbox',
                optionTitle: 'Enabled segment time comparison to KOM/QOM display',
                optionLabels: ['All'],
                optionHtml: 'This option allows you to display the time difference between segment KOM/QOM time and the time from the activity for that segment.',
            }, {
                optionKey: 'displaySegmentTimeComparisonToPR',
                optionType: 'checkbox',
                optionTitle: 'Enabled segment time comparison to PR display',
                optionLabels: ['All'],
                optionHtml: 'This option allows you to display the time difference between segment PR time and the time from the activity for that segment.',
            }, {
                optionKey: 'displaySegmentTimeComparisonToCurrentYearPR',
                optionType: 'checkbox',
                optionTitle: 'Enabled segment time comparison to current year PR display',
                optionLabels: ['All'],
                optionHtml: 'This option allow you to display the time difference between segment current year PR time and the time from the activity for that segment.',
            }, {
                optionKey: 'displaySegmentTimeComparisonPosition',
                optionType: 'checkbox',
                optionTitle: 'Enabled segment time comparison rank column',
                optionLabels: ['All'],
                optionHtml: 'This option allow you to display as "fast reading" your current rank on segments in a new column on segments efforts rows.',
            }, {
                optionKey: 'reviveGoogleMaps',
                optionType: 'checkbox',
                optionTitle: 'Revive Google Maps on activities',
                optionLabels: ['All'],
                optionHtml: 'Strava has discontinued Google Maps inside the web version to use "MapBox+OpenStreetMap" maps.<br/><br/>This option allows you revive Google Maps and Street view features with an orange button placed near Strava native maps.<br/><br/><strong>Note:</strong> This feature is currently working only on activity pages at the moment.',
                optionEnableSub: ['reviveGoogleMapsLayerType']
            }, {
                optionKey: 'reviveGoogleMapsLayerType',
                optionType: 'list',
                optionLabels: ['All'],
                optionList: [{
                    key: 'roadmap',
                    name: 'Roadmap'
                }, {
                    key: 'satellite',
                    name: 'Satellite'
                }, {
                    key: 'hybrid',
                    name: 'Satellite + Legends'
                }, {
                    key: 'terrain',
                    name: 'Terrain'
                }],
                optionTitle: 'Default Google Maps layer type',
                optionHtml: 'Do what title describes...',
            }, {
                optionKey: 'displayActivityBestSplits',
                optionType: 'checkbox',
                optionTitle: 'Enable best splits into your cycling activities',
                optionLabels: ['Cycling'],
                optionHtml: 'This option allows to enable best splits into your cycling activities.',
            }, {
                optionKey: 'defaultLeaderBoardFilter',
                optionType: 'list',
                optionLabels: ['All'],
                optionList: [{
                    key: 'overall',
                    name: 'Overall'
                }, {
                    key: 'men',
                    name: 'Men'
                }, {
                    key: 'women',
                    name: 'Women'
                }, {
                    key: 'following',
                    name: 'Following'
                }, {
                    key: 'my_results',
                    name: 'My Results'
                }],
                optionTitle: 'Default Leaderboard Filter',
                optionHtml: 'Choose your default leaderboard filter inside related segments pages. Select filter among:<br /><br />&diams; Overall<br />&diams; Men<br />&diams; Women<br />&diams; Your following/followers<br />&diams; Your results',
            },]
        }, {
            sectionTitle: 'Segments viewing options',
            sectionContent: [{
                optionKey: 'displaySegmentRankPercentage',
                optionType: 'checkbox',
                optionTitle: 'Segment Rank %',
                optionLabels: ['All'],
                optionHtml: 'Add your segment rank percentage on segment page. <br /><br /><img src="img/displaySegmentRankPercentage.png"/>',
            }, {
                optionKey: 'displayNearbySegments',
                optionType: 'checkbox',
                optionTitle: 'Nearby Segments',
                optionLabels: ['Cycling', 'Running'],
                optionHtml: 'This option displays cycling and running nearby segments on a segment page.',
            }],

        }, {
            sectionTitle: 'Activities and Segments viewing options',
            sectionContent: [{
                optionKey: 'remoteLinks',
                optionType: 'checkbox',
                optionTitle: 'Enable veloviewer + surface + segment details remote views',
                optionLabels: ['All'],
                optionHtml: '<strong>This enable on activities page</strong><br /><br />VeloViewer activity shortcut & raceshape activity surface.<br /><br /><strong>And on segments pages...</strong><br /><br />VeloViewer segment shortcut & Jonathan Okeeffe segment details.',
            }],
        }, {
            sectionTitle: 'Dashboard',
            sectionContent: [{
                optionKey: 'feedAutoScroll',
                optionType: 'checkbox',
                optionTitle: 'Feed auto-scroll',
                optionLabels: ['All'],
                optionHtml: 'Automatic scrolling on activity dashboard<br /><br /><img src="img/feedAutoScroll.png"/>',
            }, {
                optionKey: 'feedHideChallenges',
                optionType: 'checkbox',
                optionTitle: 'Hide challenges',
                optionLabels: ['All'],
                optionHtml: 'This will hide all related challenge items in the dashboard feed (joined, milestones reached and completed).',
            }, {
                optionKey: 'feedHideCreatedRoutes',
                optionType: 'checkbox',
                optionTitle: 'Hide created routes',
                optionLabels: ['All'],
                optionHtml: 'This will hide all routes created in the dashboard feed.',
            }, {
                optionKey: 'feedHideRideActivitiesUnderDistance',
                optionType: 'integer',
                optionTitle: 'Hide rides activities under distance.',
                optionLabels: ['Cycling'],
                optionHtml: 'This will hide all cycling rides (also virtual rides) in the dashboard feed if they are under distance you set (KM or MI). Set empty value or "0" to display all cycling rides in your feed',
            }, {
                optionKey: 'feedHideRunActivitiesUnderDistance',
                optionType: 'integer',
                optionTitle: 'Hide running activities under distance.',
                optionLabels: ['Running'],
                optionHtml: 'This will hide all running activities in the dashboard feed if they are under distance you set (KM or MI). Set empty value or "0" to display all cycling rides in your feed',
            }]
        }, {
            sectionTitle: 'Weather units',
            sectionContent: [{
                optionKey: 'temperatureUnit',
                optionType: 'list',
                optionLabels: ['All'],
                optionList: [{
                    key: 'F',
                    name: 'Fahrenheit'
                }, {
                    key: 'C',
                    name: 'Celsius'
                }],
                optionTitle: 'Temperature',
                optionHtml: 'This selects which units to use when displaying temperature on weather activity overlay.',
            }, {
                optionKey: 'windUnit',
                optionType: 'list',
                optionLabels: ['All'],
                optionList: [{
                    key: 'mph',
                    name: 'Miles per hour'
                }, {
                    key: 'km/h',
                    name: 'Kilometers per hour'
                }, {
                    key: 'm/s',
                    name: 'Meters per second'
                }, {
                    key: 'kn',
                    name: 'Knots'
                }, {
                    key: 'bft',
                    name: 'Beaufort scale'
                }],
                optionTitle: 'Wind Speed',
                optionHtml: 'This selects which units to use when displaying wind speed on weather pages.',
            }]
        }, {
            sectionTitle: 'Year progression targets for ' + (new Date()).getFullYear(),
            sectionContent: [{
                optionKey: 'targetsYearRide',
                optionType: 'integer',
                optionTitle: 'Cycling distance target for ' + (new Date()).getFullYear(),
                optionLabels: ['Cycling'],
                optionHtml: '',
            }, {
                optionKey: 'targetsYearRun',
                optionType: 'integer',
                optionTitle: 'Running distance target for ' + (new Date()).getFullYear(),
                optionLabels: ['Running'],
                optionHtml: '',
            }]
        }, {
            sectionTitle: 'Miscellaneous',
            sectionContent: [{
                optionKey: 'hidePremiumFeatures',
                optionType: 'checkbox',
                optionTitle: 'Hide Premium visuals',
                optionLabels: ['All'],
                optionHtml: 'This option is not intended to remove premium features from Strava!<br/><br/>The intention is just to hide them when you aware with "I don\'t want or I will not be able to pay for it"!<br/><br/>It\'s recommended to get <a href="https://www.strava.com/premium" target="_blank">Strava Premium</a> if you can. This extension will not bring premium features to you! It just adds some to enhance the experience.<br/><br/><i>(works for free account only)</i>. ',
            }]
        }, {
            sectionTitle: 'Hidden/Beta features',
            sectionContent: [{
                optionKey: 'showHiddenBetaFeatures',
                optionType: 'checkbox',
                optionTitle: 'Enable Hidden/Beta features',
                optionLabels: ['All'],
                optionEnableSub: ['displayReliveCCLink', 'displayRecentEffortsHRAdjustedPacePower'],
                optionHtml: 'Show features which are hidden. Example: BETA features.',
            }, {
                optionKey: 'displayReliveCCLink',
                optionType: 'checkbox',
                optionTitle: 'Relive your rides',
                optionLabels: ['Cycling'],
                optionHtml: 'This will display a link in activity page to relive cycling ride. Make sure to connect your strava account to <a href="http://relive.cc" target="_blank">relive.cc</a>. <br/><br/><strong>Note:</strong> Only rides done after relive.cc registration can get a "Relive".',
            }, {
                optionKey: 'displayRecentEffortsHRAdjustedPacePower',
                optionType: 'checkbox',
                optionTitle: 'Display running estimated paces & cycling estimated powers from most painful effort on a segment.',
                optionLabels: ['Cycling', 'Running'],
                optionHtml: 'This feature gives you a fitness trend in your segments. You can see estimations in "Your recent efforts" graph displayed on a segment page.<br /><br /><strong>Running:</strong> Display estimated <strong>paces</strong> based on best average heart rate of all efforts in a segment.<br /><br /><strong>Cycling:</strong> Display estimated <strong>powers</strong> based on best average heart rate of all efforts in a segment.',
            }]
        }];

        return sections;
    };
    return commonSettingsService;
});
