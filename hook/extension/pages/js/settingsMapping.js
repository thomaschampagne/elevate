var section = 'section';
var sectionTitle = 'sectionTitle';
var sectionContent = 'sectionContent';
var optionTitle = 'optionTitle';
var optionHtml = 'optionHtml';
var optionType = 'optionType';
var optionList = 'optionList';

// Define options structure
var optionsSectionMapping = {

    '0002': {
        sectionTitle: 'Global+ features',
        sectionContent: {
            'hidePremiumFeatures': {
                optionType: 'checkbox',
                optionTitle: 'Hide Premium visuals',
                optionHtml: 'This option is not intended to remove premium features from Strava!<br/><br/>The intention is just to hide them when you aware with "I don\'t want or i will not be able to pay for it"!<br/><br/>It\'s recommended to get <a href="https://www.strava.com/premium" target="_blank">Strava Premium</a> if you can. This extension will not bring premium features to you! It just add some to enhance the experience.<br/><br/><i>(works for free account only)</i>. ',
            },
            'remoteLinks': {
                optionType: 'checkbox',
                optionTitle: 'Integration of VeloViewer / FlyBy',
                optionHtml: 'This enable VeloViewer and FlyBy remote links on activities and segments page.<br/><br/>VeloViewer is another Strava connected plateform designed to analyze your activities.<br/><br/>FlyBy allows you to see riders/runners having an activity in the same time range than you.',
            },
            'displayShopHeaderLink': {
                optionType: 'checkbox',
                optionTitle: 'Hide "Shop" header link',
                optionHtml: 'This option is not intended to remove Strava Shop from website.<br/><br/>The intention is just to gain space in strava header bar. Especially for french users who have a long....header bar.',
            },
        },
    },
    '00032': {
        sectionTitle: 'Cycling activity features',
        sectionContent: {
            'displayActivityRatio': {
                optionType: 'checkbox',
                optionTitle: 'Move Ratio',
                optionHtml: 'Add your activity ratio in activity page. Try to always reach the value of <strong>1</strong>. The value <strong>1</strong> means that you got no rest during your cycling activity. <br /><br /><strong>MOVE YOURSELF !!</strong>',
            },
            'displayMotivationScore': {
                optionType: 'checkbox',
                optionTitle: 'Toughness Factor',
                optionHtml: 'Add Represention of how much you involved yourself in the cycling activity performed. An higher score involve a better toughness.',
            },
            'displayNormalizedPower': {
                optionType: 'checkbox',
                optionTitle: 'Estimated Normalized Power',
                optionHtml: 'The "Estimated Normalized Power" is a better statistic to "Estimated Average Power" given by Strava. Why? While average power simply takes all of the samples of "Estimated power" and divides them by the number of samples, Normalized Power uses a tricky weighting system to come up with a number that is more in line with the true physiological effort for your given activity.<br/><br/>"Estimated Normalized Power" is basically the power that you could have maintainted for the same physiological "cost" if your power output had been constant.<br/><br/>"Estimated Normalized Power" is calculated from an algorithm introduced by Dr. Andy Coggan to weight this variability according to its physiological difficulty.',
            },
            'displayVariabilityIndex': {
                optionType: 'checkbox',
                optionTitle: 'Estimated Variability Index',
                optionHtml: 'Variability Index is an indication of how your activity was paced. This indication shows how smooth or evenly paced the power output was during a race or work out.',
            },
            'displayCurrentIntensityFactor': {
                optionType: 'checkbox',
                optionTitle: 'Estimated Intensity Factor',
                optionHtml: 'Although normalized power is a better measure of training intensity than average power, it does not take into account differences in fitness within or between individuals. Therefore StravaPlus introduce an intensity factor (IF) for every activity. IF is simply the ratio of the estimated normalized power as described above to your Functional Threshold Power (FTP) (entered in settings page). For example, if your estimated normalized power for a long training ride done early in the year is 210 W and your threshold power at the time is 280 W, then the IF for that workout would be 0.75. However, if you did that same exact ride later in the year after your threshold power had risen to 300 W, then the IF would be lower, i.e., 0.70. IF therefore provides a valid and convenient way of comparing the relative intensity of a training session or race either within or between riders, taking into account changes or differences in threshold power.<br/><br/>Typical IF values for various training sessions or races are as follows:<br/><br/><span style="font-size: 14px;">&#8226; Less than 0.75 recovery rides<br/>&#8226; 0.75-0.85 endurance-paced training rides<br/>&#8226; 0.85-0.95 tempo rides, aerobic and anaerobic interval workouts (work and rest periods combined), longer (>2.5 h) road races<br/>&#8226; 0.95-1.05 lactate threshold intervals (work period only), shorter (<2.5 h) road races, criteriums, circuit races, longer (e.g., 40 km) TTs<br/>&#8226; 1.05-1.15 shorter (e.g., 15 km) TTs, track points race<br/>&#8226; Greater than 1.15 prologue TT, track pursuit, track miss-and-out</span>',
            },
            'displayNormalizedWattsPerKg': {
                optionType: 'checkbox',
                optionTitle: 'Normalized Watts / Kg',
                optionHtml: '"Normalized Watts / Kg" is basically an estimation of the power per Killogram that you could have maintainted for the same physiological "cost" if your power output had been constant<br/></br>That\'s simply your "Estimated Normalized Power" over your weight in Kg',
            },
            'displayAdvancedHrData': {
                optionType: 'checkbox',
                optionTitle: 'Display advanced heart rate data',
                optionHtml: '<div style="font-size: 14px;"><strong>First of all... You need to record heart rate data inside Strava activities to enjoy these features. Good reading...</strong><br/> <br/> <strong style="font-size: 18px; color: #fc4c02;"><u>TR</u>aining <u>IMP</u>ulse or TRIMP</strong> <i>(Displayed if you are the activity athlete)</i><br/><br/>Represents the amount of heart stress during an activity. The longer you ride at full throttle, the more you SCORE !! So go outside suffer for twelve hours! Or stay here to understand what it returns... <i>TRIMP</i> is a way to model the human athletic performance. This concept has been introduced by Dr Eric Banister. <br/> <br/>Ok, Cool... But how this works?! <br/> <br/>StravaPlus computes <i>TRIMP</i> on activities using the more sophisticated approach: <i>TRIMP Exponental Heart Rate Scaling</i> which use your <i>Heart Rate Reserve or HRR</i>. <i>HRR</i> is basically your heart effort level according to your heart capacity . <br/> <br/>What are all these terms?! Don\'t panic... Here is an explanation from a Math view (you may hate that, sorry...). <br/> <br/> <img src="img/trimp_equation.png" /> <br/> <br/>Where&nbsp;&nbsp; <img src="img/kMen_equation.png" />&nbsp;&nbsp;(For Mens) &nbsp;&nbsp;or&nbsp;&nbsp; <img src="img/kWomen_equation.png" />&nbsp;&nbsp;(For Womens) <br/> <br/>And <i>HRR = Heart Rate Reserve = Heart effort level according to heart capacity</i> defined by <br/> <br/> <img src="img/hrr_equation.png" /> <br/> <br/>According this <i>TRIMP Exponental Heart Rate Scaling</i> formula, the longer you ride at full throttle, the more you SCORE ! <br/> <br/>But this heart score seems to be <i>Strava Suffer Score</i>?! Not really... <i>Strava Suffer Score</i> is only inspired by the TRIMP concept. However the idea is same and both score are correlated. <br/> <br/>Need more infos? Then read more about <a href="http://fellrnr.com/wiki/Heart_Rate_Reserve" target="_blank">HRR here</a> and <a href="http://fellrnr.com/wiki/TRIMP" target="_blank">TRIMP here</a> <br/> <br/> <strong style="font-size: 18px; color: #fc4c02;">%Heart Rate Reserve Average</strong> <i>(Displayed if you are the activity athlete)</i> <br/> <br/>Represents the stress level reached during an activity according to your heart capacity. As mentionned into <i><u>TR</u>aining <u>IMP</u>ulse</i> explanation section, Heart Rate Reserve is basically a heart effort level according to a heart capacity: <br/> <br/> <img src="img/hrr_equation.png" /> <br/> <br/>This indicator is scaled on a complete activity, then average heart rate participates to the party. <br/> <br/>Consequently <i>%Heart Rate Reserve Average</i> is defined by <br/> <br/> <img src="img/hrrAvg_equation.png" /> <br/> <br/>If you rode with a %HRR Avg of 100% this seems you were at full capacity of your heart during the whole activity. It\'s impossible... But try to get the higher percentage ;) You will get a better <i>TRIMP</i> score in the same way. <br/> <br/> <strong style="font-size: 18px; color: #fc4c02;">%Heart Rate Reserve Octo Zones Distribution in minutes</strong> <i>(Displayed if you are the activity athlete)</i><br/> <br/>To display this graph you need heart rate data on your activity. Next hit the link <i>Click to display %HRR Octo Zones Distribution</i> inside activity page. You\'ll get a graph like this: <br/> <br/> <img src="img/hrr_graph.png" /> <br/> <br/>No explanations anymore about <i>%Heart Rate Reserve Octo Zones Distribution in minutes</i>... This above screenshot does the work :D <br/> <br/> <strong style="font-size: 18px; color: #fc4c02;">Quartiles and median</strong> <br/> <br/>For understanding these indicators, we assume that 0% to 100% are all the heart rates sorted ascending you obtained during an activity. <br/> <br/> <strong>25% Quartile:</strong>This indicator represents the heart rate you maintained at the position "25%". This is commonly called "Lower quartile" or Q1. <br/> <br/> <strong>50% Median:</strong>This indicator represents the heart rate you maintained at the position "50%". It\'s simply the median... <br/> <br/> <strong>75% Quartile:</strong>This indicator represents the heart rate you maintained at the position "75%". This is commonly called "Upper quartile" or Q3. <br/> <br/> <br/><i>These indicators can be more meaningfull than average heart rate itself to analyse activity heart rate. For example, you upload an activity in which you ride pretty fast for a long time. Then, you expect to have a good average heart rate. Unfortunately, you have to go through the city to go home where many red lights and cars behavior slow you down. Your average heart rate then drops very quickly and do not highlight your effort of "riding fast". In this example, the 75% quartile speed is representative of the effort you made (eliminating low heart rate associated with the cross of the city).</i> <br/> <br/> <br/><a href="http://en.wikipedia.org/wiki/Quartile" target="_blank">Understand lower quartile, median and upper quartile here</a> </div>',
            },
            'displayAdvancedSpeedData': {
                optionType: 'checkbox',
                optionTitle: 'Display advanced speed data',
                optionHtml: 'This option adds new speed data to your activity panel.<br/><br/>For understanding these indicators, we assume that 0% to 100% are all the speeds sorted ascending you obtained during an activity.<br/><br/><strong>25% Quartile:</strong> This indicator represents the speed you maintained at the position "25%". This is commonly called "Lower quartile" or Q1.<br/><br/><strong>50% Median:</strong> This indicator represents the speed you maintained at the position "50%". It\'s simply the median...<br/><br/><strong>75% Quartile:</strong> This indicator represents the speed you maintained at the position "75%". This is commonly called "Upper quartile" or Q3.<br/><br/><br/><i>These indicators can be more meaningfull than average speed itself to analyse activity speed. For example, you upload an activity in which you ride pretty fast for a long time. Then, you expect to have a good average speed. Unfortunately, you have to go through the city to go home where many red lights and cars behavior slow you down. Your average speed then drops very quickly and do not highlight your effort of "riding fast". In this example, the 75% quartile speed is representative of the effort you made (eliminating low speeds associated with the cross of the city).</i><br/><br/><br/><strong>Standard Deviation Speed &sigma;:</strong> This indicator represents the amount of variation or dispersion of speeds from your average speed. It gives a good estimation of how your ride was paced (like variability index). From a mathematical view, this is the square root of the variance computed through this formula (<i>X is speed</i>):<br/><br/><img src="img/stdDeviation.png"/><br/><br/><br/><br/><a href="http://en.wikipedia.org/wiki/Quartile" target="_blank">Understand lower quartile, median and upper quartile here</a><br/><br/><a href="http://en.wikipedia.org/wiki/Standard_deviation" target="_blank">Understand Standard deviation here</a>',
            },
            'displayPedalingData': {
                optionType: 'checkbox',
                optionTitle: 'Display advanced pedaling data',
                optionHtml: 'Add pedaling data for your cycling activities:<br/><br/>- Pedaling %<br/>- Pedaling Time<br/>- Crank revolutions count.<br/><br/>Of course, a cadence meter is required to get this feature.',
            },
            'displayBikeOdoInActivity': {
                optionType: 'checkbox',
                optionTitle: 'Display Bike odo',
                optionHtml: 'This option allow you to display the total distance traveled with the bike which has done the activity.<br /><br />This value is displayed along your bike name in an activity page and is refreshed each 2 hours.<br /><br />Of course, it implies that you have declared at least 1 bike in Strava.',
            }
        },
    },
    // Section 02
    '0004': {
        sectionTitle: 'Cycling+Running segment features',
        sectionContent: {
            'displaySegmentRankPercentage': {
                optionType: 'checkbox',
                optionTitle: 'Segment Rank %',
                optionHtml: 'Add your segment rank percentage on segment page. <br /><br /><img src="img/displaySegmentRankPercentage.png"/>',
            },
            'defaultLeaderboardFilter': {
                optionType: 'list',
                optionList: {
                    'overall': 'Overall',
                    'men': 'Men',
                    'women': 'Women',
                    'following': 'Following',
                    'my_results': 'My Results',
                },
                optionTitle: 'Default Leaderboard Filter',
                optionHtml: 'Choose your default leaderboard filter inside related segments pages. Select filter among:<br /><br />&diams; Overall<br />&diams; Men<br />&diams; Women<br />&diams; Your following/followers<br />&diams; Your results',
            },
        },

    },

    '0005': {
        sectionTitle: 'Running activity features',
        sectionContent: {
            'activateRunningGradeAdjustedPace': {
                optionType: 'checkbox',
                optionTitle: 'Always enable Grade Adjusted Pace',
                optionHtml: 'Activate running "Grade Adjusted Pace" by default in running activity analysis.<br /><br /><img src="img/activateRunningGradeAdjustedPace.png"/>',
            },
            'activateRunningHeartRate': {
                optionType: 'checkbox',
                optionTitle: 'Always enable heart rate',
                optionHtml: 'Activate running heart rate by default in running activity analysis.<br /><br /><img src="img/activateRunningHeartRate.png"/>',
            },
        },
    },
    '0006': {
        sectionTitle: 'Maps+ features',
        sectionContent: {
            'activityGoogleMapType': {
                optionType: 'list',
                optionList: {
                    'terrain': 'Terrain',
                    'standard': 'Standard',
                    'satellite': 'Satellite',
                },
                optionTitle: 'Default Google Map type in activity page',
                optionHtml: 'Do what title describes...',
            }
        },
    },
    '0007': {
        sectionTitle: 'Dashboard+ features',
        sectionContent: {
            'feedAutoScroll': {
                optionType: 'checkbox',
                optionTitle: 'Feed auto-scroll',
                optionHtml: 'Automatic scrolling on activity dashboard<br /><br /><img src="img/feedAutoScroll.png"/>',
            },
            'feedHideChallenges': {
                optionType: 'checkbox',
                optionTitle: 'Hide challenges',
                optionHtml: 'This will hide all related challenges items in the dashboard feed (joined, milestones reached and completed).',
            },
            'feedHideCreatedRoutes': {
                optionType: 'checkbox',
                optionTitle: 'Hide created routes',
                optionHtml: 'This will hide all routes created in the dashboard feed.',
            },
        },
    },
    '0008': {
        sectionTitle: 'Miscellaneous+ features',
        sectionContent: {
            'highLightStravaPlusFeature': {
                optionType: 'checkbox',
                optionTitle: 'Highlight StravaPlus',
                optionHtml: 'This option highlight StravaPlus features in bright Strava orange color.',
            }
        },
    },

    'hidden': {
        sectionTitle: 'Hidden',
        sectionContent: {
            'extensionHasJustUpdated': {
                optionType: 'checkbox',
                optionTitle: 'extensionHasJustUpdated',
                optionHtml: '',
            }
        },
    }
};

function insertOptionsAlongSections() {

    var html = '';

    for (var s in optionsSectionMapping) {

        var sectionOptionStyle = '';

        if (s == 'hidden') {
            sectionOptionStyle = 'display: none;';
        }

        // New section
        html += '<h2 style="' + sectionOptionStyle + '">' + optionsSectionMapping[s][sectionTitle] + '</h2>';

        // Loop option in section
        var contentMap = optionsSectionMapping[s][sectionContent];

        for (var contentMapEntry in contentMap) {

            html += '<table class="tableOption" style="' + sectionOptionStyle + '">';
            html += '<tr>';

            /* Start of Entry */

            // Option title
            html += '<td>';
            html += '<div id="tip_' + contentMapEntry + '" class="white-popup mfp-hide">';
            html += '<div class="white-popup-title">' + contentMap[contentMapEntry][optionTitle] + '</div>';
            html += contentMap[contentMapEntry][optionHtml];
            html += '</div>';
            html += '<a class="open-popup-link" href="#tip_' + contentMapEntry + '" title="' + contentMap[contentMapEntry][optionTitle] + '">' + contentMap[contentMapEntry][optionTitle] + '</a>';
            html += '</td>';

            // Option content
            html += '<td>';
            if (contentMap[contentMapEntry][optionType] == 'checkbox') {
                html += '   <div class="checkboxSlider">';
                html += '       <input type="checkbox" id="' + contentMapEntry + '" />';
                html += '       <label for="checkboxSlider"></label>';
                html += '   </div>';
            } else if (contentMap[contentMapEntry][optionType] == 'list') {

                html += '<select id="' + contentMapEntry + '" style="width: auto; float:left">';

                for (var htmlOption in contentMap[contentMapEntry][optionList]) {
                    html += '<option value="' + htmlOption + '">' + contentMap[contentMapEntry][optionList][htmlOption] + '</option>';
                }

                html += '</select>';
            }
            html += '</td>';
            /* End of entry */
            html += '</tr>';
            html += '</table>';
        }
    }
    $('#content').append(html);
}

$(document).ready(function() {

    insertOptionsAlongSections();

    $('.open-popup-link').magnificPopup({
        type: 'inline',
        midClick: true, // Allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source in href.
        mainClass: 'mfp-with-zoom',
        zoom: {
            enabled: true, // By default it's false, so don't forget to enable it
            duration: 300, // duration of the effect, in milliseconds
            easing: 'ease-in-out', // CSS transition easing function 
        }

    });
});
