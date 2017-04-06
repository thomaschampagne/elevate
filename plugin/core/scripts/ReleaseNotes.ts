interface IReleaseNote {
    version: string; // 'x.x.x'
    message?: string;
    hotFixes?: Array<string>;
    features: Array<string>;
    fixes?: Array<string>;

    /**
     * Say if we display again features. Eg. Fix or hotfix release. Default: false
     */
    hideFeatureReleaseNote?: boolean;

    /**
     * Make silent updates... no update ribbon displayed
     */
    silent?: boolean;
}

let releaseNotes: Array<IReleaseNote> = [
    {
        version: '5.7.2',
        message: 'New Year progressions improvements (Old version reactivated in Strava profile page) <strong>+</strong> Custom running power zones <strong>+</strong> Hide Virtual Rides',
        hotFixes: [
        ],
        features: [
            'Added New Year progression UI. <a href="' + Constants.OPTIONS_URL + '#/yearsProgress" target="_blank">Here</a> ',
            'Added custom running power zones (was linked to cycling power zones before)',
            'Added option to hide Virtual Rides from activity feed',
            'Added ribbon on top of page when plugin update occurs. Less annoying than the big update popup ;)',
            'Minor improvements',
        ],
        hideFeatureReleaseNote: true,
        fixes: [
            'Fixed new year progressions "Time (h)" jumps',
            'Fixed new year progressions counts on selected activity types'
        ],
    },
    {
        version: '5.7.1',
        message: 'Added New Year progressions <strong>+</strong> Custom running power zones <strong>+</strong> Hide Virtual Rides',
        hotFixes: [
        ],
        features: [
            'Added New Year progression UI. <a href="' + Constants.OPTIONS_URL + '#/yearsProgress" target="_blank">Here</a> ',
            'Added custom running power zones (was linked to cycling power zones before)',
            'Added option to hide Virtual Rides from activity feed',
            'Added ribbon on top of page when plugin update occurs. Less annoying than the big update popup ;)',
            'Minor improvements',
        ],
        hideFeatureReleaseNote: false,
        fixes: [
            'Fixed plugin running on strava.com/api/*'
        ],
    },
    {
        version: '5.6.1',
        message: '<i>(5.6.1: Fast fix on the new swimming fitness trend support)</i></br></br><strong>NEW:</strong> Swimming is now supported in multi-sport fitness trend!!</br></br><strong>Fitness trend</strong> is now completely <strong>ready</strong> for <strong>triathletes</strong> :)</br></br> It\'s also working with swimming activities entered manually :) No heart rate monitor is required for swimming! Your 10$ stopwatch should be good enough ;) !',
        hotFixes: [
            'Fixed a case where fitness trend feature was KO because of swimming activities having distance equals to 0.'
        ],
        features: [
            'Added Swimming support inside multi-sport fitness trend by using your swim FTP.</br><i>Note: this type of activity where not supported by default (via HR data and thus "trimps") because strava swimming activities don\'t keep HR data.</i>',
            'Improved history synchronization. Synchronization continues where she stopped earlier (in case of any type of interruption).',
            'Added possibility to filter or not "commutes" activities on year progressions.'
        ],
        hideFeatureReleaseNote: true,
        fixes: [],
    },
    {
        version: '5.6.0',
        message: 'Swimming is now supported in multi-sport fitness trend!!</br></br><strong>Fitness trend</strong> is now completely <strong>ready</strong> for <strong>triathletes</strong> :)</br></br> It\'s also working with swimming activities entered manually :) No heart rate monitor is required for swimming! Your 10$ stopwatch should be good enough ;) !',
        hotFixes: [],
        features: [
            'Added Swimming support inside multi-sport fitness trend by using your swim FTP.</br><i>Note: this type of activity where not supported by default (via HR data and thus "trimps") because strava swimming activities don\'t keep HR data.</i>',
            'Improved history synchronization. Synchronization continues where she stopped earlier (in case of any type of interruption).',
            'Added possibility to filter or not "commutes" activities on year progressions.'
        ],
        hideFeatureReleaseNote: false,
        fixes: [
            'Fixed date comparison bug on additional goal progress tracking.'
        ],
    },
    {
        version: '5.5.0',
        message: 'At a glance...</br>Cycling Power Stress Score on your activities :)</br>' +
        'Support of Running Power Meters :)</br>' +
        'Please redo a full sync of your history if you "pause" your activities during lunch (See below fixed bugs)',
        hotFixes: [],
        features: [
            'Added "Cycling Power Stress Score" to strava activity pages. You must have a power meter on your bike to view the stat.',
            'Added support of Running Power Meters (e.g. Stryd, RPM2, ... sensors) inside strava running activities pages.',
            'Added a period of "6 weeks" inside MultiSports Fitness Trend',
        ],
        hideFeatureReleaseNote: false,
        fixes: [
            'Fixed a wrong calculation of TRIMP on elapsed time when your activities were "paused" for a long time. <i></i>',
            'Fixed the use of running power meters matching with cycling power meter option of Multisports Fitness Trend.',
            'Fixed a wrong calculation of based w/kg stats on others cycling activities than you: your weight were used instead of the weights of activities owners.',
        ],
    },
    {
        version: '5.4.2',
        message: '<i>Patch release: Now calculating TRIMP over elapsed time instead of moving time. TRIMP were not properly computed with activities without movements.<br/>You may need to perform a full sync of your synced history for the fitness trend feature. Memory management during synchronization of your history has been also improved.</i>',
        hotFixes: [],
        features: [
            '<a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">MultiSports Fitness Trend</a> can now use your cycling power meter to compute your fitness.',
            'Strava premium additional goal progress is back! Still "experimental". Activate it from Hidden feature section',
            'Renamed cycling stat "Punch Factor" to "Intensity" (= Weighted Power / FTP)'
        ],
        hideFeatureReleaseNote: true,
        fixes: [
            'Now calculating TRIMP over elapsed time instead of moving time',
            'Improved memory management during synchronization of your history',
        ],
    },
    {
        version: '5.4.1',
        message: '<strong>5.4.1:</strong> <i>Bug fix release</i></br></br><strong>5.4.0 features reminder:</strong> <a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">MultiSports Fitness Trend</a> now use your cycling power meter to compute your fitness when available.',
        hotFixes: [],
        features: [
            'Fitness trend can now use your cycling power meter to compute your fitness.',
            'Strava premium additional goal progress is back! Still "experimental". Activate it from Hidden feature section',
            'Renamed cycling stat "Punch Factor" to "Intensity" (= Weighted Power / FTP)'
        ],
        hideFeatureReleaseNote: true,
        fixes: [
            'Fix wrong daily fitness final score in case of multiple activities done on same day having TRIMP score for some and PSS score for others.'
        ],
    },
    {
        version: '5.4.0',
        message: '<a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">MultiSports Fitness Trend</a> now use your cycling power meter to compute your fitness when available.</br></br>Swimming is not supported properly in fitness trend... Now taking care of swimmers ;) Still in Beta isn\'t it ?^^;)',
        hotFixes: [],
        features: [
            'Fitness trend can now use your cycling power meter to compute your fitness.',
            'Strava premium additional goal progress is back! Still "experimental". Activate it from Hidden feature section',
            'Renamed cycling stat "Punch Factor" to "Intensity" (= Weighted Power / FTP)'
        ],
        hideFeatureReleaseNote: false,
        fixes: [],
    },
    {
        version: '5.3.1',
        message: '<strong>5.3.1:</strong> <i>Strava premium additional goal has been delayed at the moment.</i></br></br><strong>5.3.0 features reminder:</strong> <i>New beta version of <a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">MultiSports Fitness Trend</a></br></br>- Added form zones to fitness trend. Gives guidelines to train properly: Stay in the right training zone and avoid risky over load. Prepare for the race day. Manage your rest with accuracy. Etc...</br>- On next update (5.4.0): cycling power meter will be also used to compute your fitness trend (if you have this sensor).</i>',
        hotFixes: [],
        features: [
            'Added form zones to fitness trend.',
            'Improved required time to generate fitness trend graph.',
            'Others minors improvements around MultiSports Fitness Trend & synchronisation.'
        ],
        hideFeatureReleaseNote: true,
        fixes: [
            'Due to feature problems: strava premium additional goal progress tracking has be removed temporally. It\'s coming back later.'
        ],
    },
    {
        version: '5.3.0',
        message: '</br>New beta version of <a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">MultiSports Fitness Trend</a></br></br>- Added form zones to fitness trend. Gives guidelines to train properly: Stay in the right training zone and avoid risky over load.</br>Prepare for the race day. Manage your rest with accuracy. Etc...</br></br>- On next update: cycling power meter will be also used to compute your fitness trend (if you have this sensor).',
        hotFixes: [],
        features: [
            'Added form zones to fitness trend.',
            'Improved required time to generate fitness trend graph.',
            'Others minors improvements around MultiSports Fitness Trend & synchronisation.'
        ],
        hideFeatureReleaseNote: false,
        fixes: [],
    },
    {
        version: '5.2.0',
        message: '</br><a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">MultiSports Fitness Trend</a> in Beta for ALL!</br></br>',
        hotFixes: [],
        features: [
            'MultiSports Fitness Trend released as beta'
        ],
        hideFeatureReleaseNote: false,
        fixes: [],
    },
    {
        version: '5.1.1',
        message: '<a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">MultiSports Fitness Trend Alpha <strong>V5</strong></a> here. Sync process fully reworked!. Last alpha testing version optimistically.</br></br>' +
        '/!\\ Your <u>history</u> have been <u>cleared</u> on this update if you had synced one... Just sync again... Sry :/',
        hotFixes: [],
        features: [
            '<i>MultiSports Fitness Trend:</i> Sync process fully reworked. Added, deleted & edited activities should be well handled. Sync typescript code is covered by unit tests.'
        ],
        hideFeatureReleaseNote: false,
        fixes: [
            // 'Fixed cases where activities were not correctly handled on history synchronisation (<i>MultiSports Fitness Trend</i>)',
            'Fixed a lot of others small things...',
        ],
    },
    {
        version: '5.1.0',
        message: '<a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">MultiSports Fitness Trend Alpha V4</a> live! Improvements + fixes. Short nights :D. Feature still in "test".</br>' +
        'Your history have been cleared if you had synced one... just sync again.',
        hotFixes: [],
        features: [
            'Generating <i>MultiSports Fitness Trend</i> graph up to 4x faster',
            'Auto sync frequency is now customisable in settings. Default is every 60 minute while browsing strava website',
            'Added an update process of your activities names and types from strava to your local history: performed on a simple sync. ',
            'Added backup/restore function of your local history synced',
        ],
        hideFeatureReleaseNote: false,
        fixes: [
            'Partially fixed cases where activities not displayed in <i>MultiSports Fitness Trend</i> on simple sync. Working hard!',
            'Fixed gap between curves of <i>MultiSports Fitness Trend</i> from today to preview days',
            'Fixed a lot of others small things...',
        ],
    },
    {
        version: '5.0.2',
        message: '<i>"MultiSports Fitness Trend"</i> Alpha <strong>V3</strong> fast released! Include fixes of Alpha V2+V1... Feature works with all activities where you held a heart rate monitor. Not only cycling... </br><a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">[You need to activate this alpha feature to use it]</a></br></br>Sticky note: <i>"Premium additional goal progress tracking"</i> disabled. Still few bugs around to fix :/ Feature is available in common settings by the way (hidden section)',
        hotFixes: [],
        features: [],
        hideFeatureReleaseNote: true,
        fixes: [
            'Fixed majors bugs of <i>"MultiSports Fitness Trend"</i> Alpha V2+V1',
        ],
    },
    {
        version: '5.0.1',
        message: '<i>"MultiSports Fitness Trend"</i> Alpha V2 here! Mainly bugs fixed of Alpha V1... Thanks to testers! It works with all activities where you held a heart rate monitor. Not only cycling... </br><a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">[You need to activate this alpha feature to use it]</a></br></br>Also disabled <i>"Premium additional goal progress tracking"</i>. Still few bugs around to fix :/ Feature is available in common settings by the way (hidden section)',
        hotFixes: [],
        features: [
            'Added plugin permission for users having more than 5MB of history. They can now save locally their history (required by <i>"MultiSports Fitness Trend"</i>)',
        ],
        hideFeatureReleaseNote: false,
        fixes: [
            'Fixed majors bugs of <i>"MultiSports Fitness Trend"</i> Alpha V1',
            'Disabled <i>"Premium additional goal progress tracking"</i>: few bugs remaining. Still available in common settings (hidden section).'
        ],
    },
    {
        version: '5.0.0',
        message: '<i>MultiSports Fitness Trend released as Alpha !<br /><br />After long days of work, It\'s now live! Yeah! <br/><br/>Working with all activities where you held a heart rate monitor. Not only cycling...</i><br/><br/><a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">[Activate it here]</a>',
        hotFixes: [],
        features: [
            'MultiSports fitness trend. <a href="' + Constants.OPTIONS_URL + '#/fitnessTrend" target="_blank">Activate the alpha feature</a>'
        ],
        hideFeatureReleaseNote: false,
        fixes: [],
    },
    {
        version: '4.5.3',
        message: 'Another release to fix latest small bug from 4.5.x. Sorry for inconvenience',
        hotFixes: [],
        features: [
            'Added monthly and weekly targets for strava premium annual goals'
        ],
        hideFeatureReleaseNote: false,
        fixes: [
            'Fix again monthly and weekly targets number format when language selected is french',
            'Fix weather on cycling activities: only wind map could be displayed',
            'Fixed extended stats graph to get Y axis always starting from zero',
        ],
    },
    {
        version: '4.5.2',
        message: 'NEW: Added monthly and weekly targets for strava premium annual goals',
        hotFixes: [
            'Hot fix monthly and weekly targets number format'
        ],
        features: [
            'Added monthly and weekly targets for strava premium annual goals'
        ],
        hideFeatureReleaseNote: false,
        fixes: [
            'Fixed extended stats graph to get Y axis always starting from zero',
        ],
    },
    {
        version: '4.5.0',
        message: 'NEW: Added monthly and weekly targets for strava premium annual goals',
        hotFixes: [],
        features: [
            'Added monthly and weekly targets for strava premium annual goals'
        ],
        hideFeatureReleaseNote: false,
        fixes: [
            'Fixed extended stats graph to get Y axis always starting from zero',
        ],
    },
    {
        version: '4.4.0',
        message: 'NEW: Segment time comparison on all activity types ! Yeah !',
        hotFixes: [],
        features: [
            'Segment time comparison on all activity types.'
        ],
        hideFeatureReleaseNote: false,
        fixes: [
            'Fixed some bugs on running estimated paces & cycling estimated powers: Recent efforts for running could rarely show watts instead of time & time range could be wrong sometimes',
        ],
    }, {
        version: '4.3.3',
        message: 'Fixing bugs from 4.2.2</br></br><strong>NEW as BETA:</strong> Added running estimated paces & cycling estimated powers from your most painful effort on a segment. The feature visible on "Your recent efforts" graph displayed in segment pages. <div style="text-align: center;"><a href="' + Constants.OPTIONS_URL + '#/commonSettings" target="_blank">> Don\'t forget to activate beta/hidden feature at first <</a></div>',
        hotFixes: [],
        features: [
            'BETA: Cycling estimated powers based on your most painful effort on a segment. <a href="' + Constants.OPTIONS_URL + '#/commonSettings" target="_blank">Don\'t forget to activate beta/hidden feature at first</a>',
            'BETA: Running estimated paces based on your most painful effort on a segment. <a href="' + Constants.OPTIONS_URL + '#/commonSettings" target="_blank">Don\'t forget to activate beta/hidden feature at first</a>',
            'Migrate 100% of the javascript code to <a href="https://www.typescriptlang.org/" target="_blank">Microsoft TypeScript</a>. An invisible enhancement for you. Futures features are now easiest to implement.'],
        hideFeatureReleaseNote: true,
        fixes: [
            'Fixed year progressions which could be not loaded by users having only running activities.',
            'Fixed bad axis displayed on running estimated paces & cycling estimated powers.',
            'Fixed update notification which could be not displayed on plugin update.'
        ],
    }, {
        version: '4.3.2',
        message: '<strong>NEW as BETA:</strong> Added running estimated paces & cycling estimated powers from your most painful effort on a segment. The feature visible on "Your recent efforts" graph displayed in segment pages. <div style="text-align: center;"><a href="' + Constants.OPTIONS_URL + '#/commonSettings" target="_blank">> Don\'t forget to activate beta/hidden feature at first <</a></div>',
        hotFixes: [],
        features: [
            'BETA: Cycling estimated powers based on your most painful effort on a segment. <a href="' + Constants.OPTIONS_URL + '#/commonSettings" target="_blank">Don\'t forget to activate beta/hidden feature at first</a>',
            'BETA: Running estimated paces based on your most painful effort on a segment. <a href="' + Constants.OPTIONS_URL + '#/commonSettings" target="_blank">Don\'t forget to activate beta/hidden feature at first</a>',
            'Migrate 100% of the javascript code to <a href="https://www.typescriptlang.org/" target="_blank">Microsoft TypeScript</a>. An invisible enhancement for you. Futures features are now easiest to implement.'],
        hideFeatureReleaseNote: false,
        fixes: ['Fixed broken heat map link in StravistiX burger menu'],
    }, {
        version: '4.3.1',
        message: 'NEW: Added running estimated paces & cycling estimated powers from your most painful effort on a segment. The feature visible on "Your recent efforts" graph displayed in segment pages.',
        hotFixes: [],
        features: [
            'Cycling estimated powers based on your most painful effort on a segment.',
            'Running estimated paces based on your most painful effort on a segment.',
            'Migrate 100% of the javascript code to <a href="https://www.typescriptlang.org/" target="_blank">Microsoft TypeScript</a>. An invisible enhancement for you. Futures features are now easiest to implement.'],
        hideFeatureReleaseNote: false,
        fixes: ['Fixed broken heat map link in StravistiX burger menu'],
    }, {
        version: '4.2.3',
        message: '... Again... a hotfix for new v4.2.x ;)',
        hotFixes: [
            'Fixed a crash that could occur on several activities opened.'
        ],
        features: [
            'Extended stats on Trainer Rides (where speed was not recorded)',
            'Invisible enhancement to prepare future: Moved 50% of the JS code to <a href="https://www.typescriptlang.org/" target="_blank">Microsoft TypeScript</a> (Geeks and developers could understand ;))'],
        hideFeatureReleaseNote: true,
        fixes: [],
    }, {
        version: '4.2.2',
        message: 'Another hotfix for new v4.2.x',
        hotFixes: [
            'Fixed a crash that could occur in older version of chrome (under v53)'
        ],
        features: [
            'Extended stats on Trainer Rides (where speed was not recorded)',
            'Invisible enhancement to prepare future: Moved 50% of the JS code to <a href="https://www.typescriptlang.org/" target="_blank">Microsoft TypeScript</a> (Geeks and developers could understand ;))'],
        hideFeatureReleaseNote: true,
        fixes: [],
    }, {
        version: '4.2.1',
        message: 'Fast hotfix of new v4.2.0',
        hotFixes: ['Fixed cycling PR/yPR on segment time comparaison: They were displayed as running'],
        features: [
            'Extended stats on Trainer Rides (where speed was not recorded)',
            'Invisible enhancement to prepare future: Moved 50% of the JS code to <a href="https://www.typescriptlang.org/" target="_blank">Microsoft TypeScript</a> (Geeks and developers could understand ;))'],
        hideFeatureReleaseNote: true,
        fixes: [],
    }, {
        version: '4.2.0',
        hotFixes: [],
        features: [
            'Extended stats on Trainer Rides (where speed was not recorded)',
            'Invisible enhancement to prepare future: Moved 50% of the JS code to <a href="https://www.typescriptlang.org/" target="_blank">Microsoft TypeScript</a> (Geeks and developers could understand ;))'],
        hideFeatureReleaseNote: false,
        fixes: [],
    }, {
        version: '4.1.0',
        message: '',
        hotFixes: [],
        features: [
            'Segment time comparison now live for RUNNING ! Just open a running activity to see changes.',
            'Improved zones customization in options: More thinner and explicit.'],
        hideFeatureReleaseNote: false,
        fixes: [
            'Fixed technical error which occured in plugin packaging with gulp',
        ],
    }, {
        version: '4.0.1',
        message: 'NEW options user interface <a href="' + Constants.OPTIONS_URL + '" target="_blank">(link)</a> ! A NEW perspective is open for upcoming big features (WIP) ;)',
        hotFixes: [],
        features: ['Re-made options UI <a href="' + Constants.OPTIONS_URL + '" target="_blank">(link)</a> to prepare future of plugin! Google material design applied!'],
        hideFeatureReleaseNote: false,
        fixes: [
            'Fixed vanished "segment veloviewer" and "nearby segments" links on segments pages',
            'Fixed wrong standard deviation speed when using MPH units'
        ],
    }, {
        version: '3.10.1',
        message: 'A bug fixing release of previous 3.10.0 here. Sry :/ ... Major update will be the next one ;)',
        hotFixes: [],
        hideFeatureReleaseNote: true,
        features: [
            "Added Hidden/Beta feature section.",
            "Added Relive.cc as Hidden/Beta feature.",
        ],
        fixes: [
            "Fix HR info in other athlete's activities don't make sense with user max/min HR.",
        ]
    }, {
        version: '3.10.0',
        features: [
            "Added Hidden/Beta feature section.",
            "Added Relive.cc as Hidden/Beta feature.",
        ]
    }, {
        version: '3.9.1',
        features: [
            "Fix pace display glitch in athlete summary",
        ]
    }, {
        version: '3.9.0',
        features: [
            "Now up to 50 zones can be defined in zones settings for each data type: speed, pace, cadence, heartrate, power, grade, ...",
            "Added full time average speed based on elapsed time.",
            "Extended stats charts refresh ! Migration to  Chart.js 2.0 done :)"
        ]
    }, {
        version: '3.8.1',
        features: [
            "HotFixing best splits",
        ]
    }, {
        version: '3.8.0',
        features: [
            "Added cycling/running distance target graph into year progression graph. Go to Common Settings and search for Year progression targets for 2016 to setup your targets.",
            "Added Weighted Avg Power field in activity summary panel",
            "Added Watts Per Kilograms field in activity summary panel",
            "Fixed a rare case where extended stats couldn't open themselve",
            "Various improvements",
        ]
    }, {
        version: '3.7.0',
        features: [
            "Strongly improved estimated ",
            "weighted / normalized power for non power sensor users. Estimated weighted power is now accurate for moneyless cyclists :p.",
            "Re-highlight best split feature. Some of the users were not aware this key feature ;)",
            "Various improvements",
            "Fixed some of display gitches segments list on cycling activity pages: columns could exceed the size of the segments list table.",
            "Fixed weighted / normalized power for some users having power sensor. An element of calculation of the method specified by Andy R. Coggan was well considered but partially previously.",
        ]
    }, {
        version: '3.6.0',
        features: [
            "Added  %rank next to rank labels in segments list on cycling activity pages. Quick view on where you're ranked!",
            "Added back jonathanokeeffe segment details on segment pages",
            "Added back veloviewer segment details on segment pages",
            "Fixed weather maps initialised with no maps. (Available on cycling activities",
            "Fixed Last 30 days comparaison chart in year progression stats to get the end of each day, rather than the beginning. This avoids the issue where activities from today are not included in the graph",
            "Fixed not displayed Distance last year comparaison chart in year progression stats for some people",

        ]
    }, {
        version: '3.5.1',
        features: [
            "HotFixed disappearance of 'My year progressions to current month / day' (My Profile page)",
        ]
    }, {
        version: '3.5.0',
        features: [
            "Globally improved segment time comparaison for cycling activities.",
            "Fixed segment time comparaison '-0s' when activity beats year's record on a segment",
            "Fixed segment time comparaison '-0s' when the year record beats global previous record",
            "Removed useless stravistix highlight feature. It's not a feature... it's not a bug... it's remove ;)",
            "Invisible project improvements (such as gulp task runner Implementation)",
        ]
    }, {
        version: '3.4.0',
        features: [
            "Updated colored  rank position in segments efforts list (on a cycling activity page)",
            "Fixed rank percentage display problem on segment pages",
            "Fixed nearby segments vanished on segment pages",
            "Fixed time comparaison flickering in segments efforts list (on a cycling activity page)",
            "Option page technical improvements",
        ]
    }, {
        version: '3.3.1',
        features: [
            "Introducing new year progressions charts: Distance last year and Distance last 30d (Go to My Profile)",
            "Fix cadence time on segments efforts (global activity value was shown).",
            "Integrating new logo design by paulinevial.fr",
            "Minors fixes",
        ]
    }, {
        version: '3.2.3',
        features: [
            "Disable stravistix on new strava store",
            "Minors improvements",
        ]
    }, {
        version: '3.2.2',
        features: [
            "Hotfix Wrong running climbing pace on extended panel",
        ]
    }, {
        version: '3.2.1',
        features: [
            "Hotfix Hide activities under distance errors on others languages than EN/FR",
            "Hotfix Wrong climbing pace running on summary panel",
        ]
    }, {
        version: '3.2.0',
        features: [
            "Improved performance on extended activity stats processing. The page should load faster since computation is now done through a separate thread/webworker.",
            "Added extended stats for runners: climbing/descending distance (inside grade section of extended stats panel). Cyclists already have this...",
            "Added option to hide the Pos. column on the segments table (in activities).",
            "Added option to activate temperature by default on running activities.",
            "Added option to mute small distance activities in dashboard feed: Just enter cycling/running distance at which activities are displayed",
            "Fixed miles/km ratio not applied in activities summary (My profile page)",
        ]
    }, {
        version: '3.1.1',
        features: [
            "Added climb, flat & downhill distance for cyclists in extended stats (grade panel)",
            "Added average W/Kg in power extended stats",
            "Added option to get running cadence graph automatically enabled in running activity",
            "Improved W/KG computations: bike weight has been removed from KG. Only rider weight is considered.",
            "Fixed performance issues on segment time comparison. The feature has been re-enable by default.",
            "Fixed Ascent speed stats VAM mismatch with strava. Note that sscent speed stats are no longer displayed on segment efforts stats",
            "Hot fixed weighted power all same on efforts stats. Only cyclists having a power meter were touched by this bug.",
        ]
    }, {
        version: '3.0.1',
        features: [
            "HotFix: Running cadence were mutiplied twice in graph/table on every segment effort stats button click (with both legs option enabled)",
        ]
    }, {
        version: '3.0.0',
        features: [
            "Extended stats on segment efforts added !! Go to an cycling/running activity, click on a segment effort, then click show extended stats button",
            "Extended stats panel relooking",
        ]
    }, {
        version: '2.2.2',
        features: [
            "FIX: Javascript syntax error while processing activities extended stats.",
        ]
    }, {
        version: '2.2.1',
        features: [
            "Added option to count Virtual Rides (e.g. Zwift rides) into athlete yearly progression.",
            "Improving altitude smoothness for elevation and ascent speed extended stats, also in best splits",
            "FIX: Yearly Progression: wrong counting of activities",
            "FIX: Extended stats may not displayed on some activities: Error in local storage cache management.",
            "FIX: Extended stats may not displayed on some trainer rides",
        ]
    }, {
        version: '2.1.1',
        features: [
            "FIX: Not getting extension stats on big ride (>300km)",
        ]
    }, {
        version: '2.1.0',
        features: [
            "Added new extended statistics for cyclists: Ascent speed.",
            "Best splits can be highlighted from the higher elevation gain or drop",
            "Best splits can be highlighted from the higher heartrate rise or drop",
            "Best splits can be also user defined on seconds from now",
            "Performance enhanced on best splits computation. A caching system has been implemented to reduce computation when cache exist.",
            "Improved elevation data accuracy while computing extended statistics. Elevation data smoothed using low pass filter.",
            "Heart rate extended statitics are now computed while moving from now.",
            "Display now weather with units preferences. Set your temperature and wind speed unit in settings.",
            "Quartiles and median are now computed on weighted percentiles: This will better highlight your efforts at those values.",
            "FIX: All best splits averages were computed on sample counts. May cause problems if sampling was smart. It's now computed using using time or distance.",
            "FIX: Highlighted power best splits map points might be wrong.",
            "FIX: Extended stats display button on turbos activities may not appear",
        ]
    }, {
        version: '2.0.1',
        features: [
            "HotFix: Null powers are computed in power best splits. They were removed from computation before.",
        ]
    }, {
        version: '2.0.0',
        features: [
            "Best splits on cycling activities. Load a cycling activities. Under elevation chart click Best Splits (Thanks Tomasz Terlecki for the feature)",
            "Fix Pressing multiple times on the current tab adds ",
            "View in Google Maps multiple times.",
        ]
    }, {
        version: '1.2.1',
        features: [
            "Fix Year progression chart icon which may invisible",
        ]
    }, {
        version: '1.2.0',
        features: [
            "Added Year progression chart on Distance, Activity count, Elevation and Time (credit https://github.com/tazmanska)",
        ]
    }, {
        version: '1.1.0',
        features: [
            "User preference for default Google Maps layer type",
            "Search for options in common settings",
            "Fix undefined errors in year progression",
        ]
    }, {
        version: '1.0.2',
        features: [
            "Fix map display problem while cropping ride. Google maps API was loaded twice.",
        ]
    }, {
        version: '1.0.1',
        features: [
            "Google Maps revived inside activities pages",
            "Add on/off extension settings for the segment time comparison on activities pages",
            "Segment time comparison for QOM (Womens) on activities pages",
            "Fix when segment time comparison may no be displayed",
            "Fix when No longer seeing extended stats on turbo activities",
            "Fix when Move ratio not being displayed (eg: Running race)",
        ]
    }, {
        version: '0.8.0',
        features: [
            "Add Ascent speed statistics to extended elevation data stats: Average, first quartile, median and third quartile ascent speed",
            "Fixing bug when exporting another riders segment as a virtual partner.",
        ]
    }, {
        version: '0.7.9',
        features: [
            "Fixing standard deviation cadence computed and displayed for cycling.",
            "Add standard deviation cadence to extended data popup panel",
        ]
    }, {
        version: '0.7.8',
        features: [
            "Add Pedaling time to summary panel",
            "Add median cadence to summary panel",
            "Various bug fixes",
        ]
    }, {
        version: '0.7.7',
        features: [
            "Remove OSM remotes maps links on activities",
            "Add flyby link in dashboard feed",
            "Fix extended data compute error on Workouts",
        ]
    }, {
        version: '0.7.6',
        features: [
            "Fix (again) Year progress sometimes not visible if strava language is not english (tazmanska credits).",
            "Segments time comparaison with KOM and previous PR inside activity page (tazmanska credits).",
        ]
    }, {
        version: '0.7.5',
        features: [
            "Hotfix: Year progress sometimes not visible",
        ]
    }, {
        version: '0.7.4',
        features: [
            "Year progressions to current month/day panel. See your progress for each beginning of year to current month and day. Go to My profile to see feature",
            "Veloviewer Segments Comparaison remote link into activities",
        ]
    }, {
        version: '0.7.3',
        features: [
            "NEW extended data: Elevation stats, graph and table. Elevation zones customizable in settings.",
            "Bug fixes",
        ]
    }, {
        version: '0.7.2',
        features: [
            "Improve weather accuracy",
        ]
    }, {
        version: '0.7.1',
        features: [
            "Hotfix: Remove display stravistix chrome tab on update (http://thomaschampagne.github.io/stravistix)",
        ]
    }, {
        version: '0.7.0',
        features: [
            "Added weather for cycling activities. Include wind, temp, clouds and humidity. Running coming soon.",
            "Added 75% speed/pace and average climbing speed to summary panel (under 'show extended statistics' button)",
        ]
    }, {
        version: '0.6.4',
        features: [
            "Provide average speed climbing, flat, downhill for extended grade data",
            "New extended data summary panel in actitivies (below show extended statistics button)",
        ]
    }, {
        version: '0.6.3',
        features: [
            "Bug fixes and improvements",
        ]
    }, {
        version: '0.6.2',
        features: [
            "Exporting segment effort as Virtual Partner for your GPS through activity page.",
        ]
    }, {
        version: '0.6.1',
        features: [
            "OpenStreetMap flipper for activities (from Veloviewer)",
        ]
    }, {
        version: '0.6.0',
        features: [
            "Customized zones for each Xtended data",
            "Add TRIMP/Hour",
            "Change extension name from StravPlus to StravistiX",
            "Bugs fix",
        ]
    }, {
        version: '0.5.5',
        features: [
            "New extended data: Grade %",
            "Running cadence for one or two legs (option)",
            "Fixed wrong TRIMP calculation. Using 'exp' instead of 'pow'...",
            "Fixed Rank=NaN% if athlete had no time in segment",
            "Fixed activity data load on manual activities",
            "Shop menu is always shown now",
            "Extended data graph title updated: units in minutes",
        ]
    }, {
        version: '0.5.4',
        features: [
            "Runners can view avanced pace data",
            "Major bugs fixed from 0.5.3",
        ]
    }, {
        version: '0.5.3',
        features: [
            "Fix clear cache on extension update/install. This caused extension crash when using old cache with new extension.",
            "Add export of your activities as TCX.",
        ]
    }, {
        version: '0.5.2',
        features: [
            "HotFix for 0.5.1: some dependencies could not be loaded resulting in extension crash.",
        ]
    }, {
        version: '0.5.1',
        features: [
            "Add extended stats for running",
            "Extended stats now includes: Speed, Power, HR and Cadence graph distribution + table result on 15 zones",
            "New extended stats panel design for running and cycling",
        ]
    }, {
        version: '0.4.10',
        features: [
            "Add share extension links to twitter",
        ]
    }, {
        version: '0.4.9',
        features: [
            "Add Segment Details remote link on segment page",
        ]
    }, {
        version: '0.4.8',
        features: [
            "Add Surface Area of your activities (raceshape EREA)",
            "Normalized Power (TrainingPeaks trademarked term) removed. Profit to Weighted Power data now",
            "Intensity Factor (TrainingPeaks trademarked term) removed. Profit to Intensity data now",
            "Prepare better veloviewer.com integration (waiting for veloviewer.com side now...)",
            "Bugs fixes",
        ]
    }, {
        version: '0.4.7',
        features: [
            "Inform runners about: Running Extended Data Features(like current cycling features) will be very soon available in version 0.5.x",
        ]
    }, {
        version: '0.4.6',
        features: [
            "Activity flash code in activities for Strava mobile App",
            "Fix bug wheere miles displayed even if metrics chosen in activities",
        ]
    }, {
        version: '0.4.5',
        features: [
            "Fast fix from version 0.4.4. Sry for this...",
        ]
    }, {
        version: '0.4.4',
        features: [
            "Fix unable to remove FTP value in options page",
            "Improving code to save time later... Invisible on your screen :)",
        ]
    }, {
        version: '0.4.3',
        features: [
            "Minor fixes",
        ]
    }, {
        version: '0.4.2',
        features: [
            "Minor fixes",
        ]
    }, {
        version: '0.4.1',
        features: [
            "Options GUI look better especially on checkboxes",
            "Minor fixes",
        ]
    }, {
        version: '0.4.0',
        features: [
            "Heart Rate Reserve zones distribution now customizable",
            "New options UI made with angularjs and bootstrap",
            "Fix Unable to fetch athlete bike odo",
            "Others tiny fixes",
        ]
    }, {
        version: '0.3.9',
        features: [
            "Fix kom-map to achievement-map",
        ]
    }, {
        version: '0.3.8',
        features: [
            "Fix nearby segment icons away",
        ]
    }, {
        version: '0.3.7',
        features: [
            "Add nearby cycling+running segments added on segment page",
            "Add average pace in cycling activities",
            "Add lower quartile power, median power and upper quartile power in cycling activities",
            "Fixed: Unable to see StravistiX icon menu when highlight option is on.",
        ]
    }, {
        version: '0.3.6',
        features: [
            "Cadence/Cadence extended data is now computed while moving.",
            "Fix wrong Harmonized Power for riders with power meter.",
            "Others minor bug fixes",
        ]
    }, {
        version: '0.3.2 to 0.3.5',
        features: [
            "Fixed display text glitches on some pages",
            "StravistiX menu icon orange",
            "Others minor bug fixes",
        ]
    }, {
        version: '0.3.1',
        features: [
            "Big changes in extension core: Ext recoded from scratch in order to fix memory leaks from v0.2.0 and make new evolutions easier",
            "Bike activities extended data new look. Possibility to get the activity extended data panel hidden on load",
            "Cache management of bike Odo for bike activities, force refresh possible",
            "Fixing hide challenges and new routes which broken in new Strava.com update",
            "New StravistiX design",
            "Bug fixes",
        ]
    }, {
        version: '0.2.0',
        features: [
            "Add TRIMP (TRaining IMPulse) value to cycling activities. The old stress score has been removed, not relevant any more now.",
            "Add Heart Rate Reserve (%HRR) value to cycling activities.",
            "Add Octo zones distribution of Heart Rate Reserve (%HRR) in minutes to cycling activities.",
            "Motivation score now become Toughness Factor",
            "Standard deviation bug fix of possible square root of negative variance..."
        ]
    }, {
        version: '0.1.13',
        features: [
            "Add standard deviation speed data for cycling activities",
            "Add Cadence data for cycling activities: cadence %, cadence Time and crank revolutions. A cadence meter needed to get that",
        ]
    }, {
        version: '0.1.12',
        features: [
            "Add Lower Quartile, Median and Upper Quartile speed data for cycling activities",
            "Add helpers when click on added data in cycling activities",
            "Add cache system to store analysis data in localStorage which may are long to be computed. The cache is reused when you reload an activity which has one.",
        ]
    }, {
        version: '0.1.11',
        features: [
            "More Stable",
            "Prepare future for big features...",
        ]
    }, {
        version: '0.1.10',
        features: [
            "Add Watts/KG for cycling activities",
            "Add VeloViewer Challenges Trophy Cabinet to StravistiX menu",
        ]
    }, {
        version: '0.1.9',
        features: [
            "Bike odo on activities back",
            "Weighted Power calculation adjusted for cycling activities",
        ]
    }, {
        version: '0.1.8',
        features: [
            "Add Estimated Weighted Power for cycling activities",
            "Add Estimated Variability Index for cycling activities",
            "Add Estimated Intensity for cycling activities",
            "Bug fixing",
        ]
    }, {
        version: '0.1.7',
        features: [
            "Hide the challenges in dashboard feed",
            "Hide the created routes in dashboard feed",
            "Bug fixing",
            "Switch app name to 'StravistiX Developper Preview'",
        ]
    }, {
        version: '0.1.6',
        features: [
            "Add this about page",
            "StravistiX placed first in header",
            "Add icons in StravistiX menu",
            "Remove StravistiX settings page popup when extension is updated",
            "Bug fixing",
        ]
    }, {
        version: '0.1.5',
        features: [
            "Segment Rank percentage now working on all leaderboards (Clubs, following, ...)",
            "Add bike odo display or not as an option",
            "Come back to Strava Classic color style",
            "Add StravistiX features highlighted in bright orange as option (new miscellaneous section).",
        ]
    }, {
        version: '0.1.4',
        features: [
            "Display bike odo on activity page",
            "Bugs fixing",
        ]
    }, {
        version: '0.1.3',
        features: [
            "Add Motivation Score for cycling activities",
            "Add Stress Score for cycling activities",
            "Add Move ratio for cycling activities",
            "Add Segment rank percentage on full leaderboard",
            "Add default leaderboard filter",
            "Add Always enable Grade Adjusted Pace for running activities",
            "Add Always enable heart rate for running activities",
            "Add Default Google Map type in activity",
            "Add links to Flyby, Veloviewer, Raceshape in activity page",
            "Allow free accounts users to hide premium features",
            "Add StravistiX menu",
            "Add Settings page link to StravistiX menu",
            "Add Global Heat Map to StravistiX menu",
            "Add user veloviewer link to StravistiX menu",
            "Add Kom Map link to StravistiX menu",
        ]
    }];
