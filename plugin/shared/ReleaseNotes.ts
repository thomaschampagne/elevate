import { ReleaseNoteModel } from "./models/release-note.model";

export let releaseNotes: ReleaseNoteModel[] = [
	{
		version: "6.3.0",
		date: "2018-05-12",
		message: "",
		hotFixes: [],
		features: [
		],
		isPatch: false,
		fixes: [
		]
	},
	{
		version: "6.2.1",
		date: "2018-05-12",
		message: "Added \"best 20 min cycling speed\" and \"best 20 min running pace\" data-fields on your activities. Also added an option to define your own starting fitness and fatigue values on your fitness trend. Rest of the update focuses mainly on noticeable optimizations.",
		hotFixes: [],
		features: [
			"Added \"best 20 min cycling speed\" data field on your activities.",
			"Added \"best 20 min running pace\" data field on your activities.",
			"Added an option to define starting fitness and fatigue values on your fitness trend. Available in fitness trend configuration (cog icon).",
		],
		isPatch: false,
		fixes: [
			"Optimization of the synchronisation: stravistix can now fully track your \"recent\" activities (addition, edition and deletion) when you load a strava website page. The app content will be refreshed in real time. Some users experienced some crashes and memories issues with the background sync: this should be fixed now. The auto-sync delay setting has been also removed in that optimization: goal is that user focuses less on synchronization aspects by simplifying it.",
			"Optimized the rendering and styling of \"extended stats panel\". Should now scale properly whatever the resolution being used.",
			"[Technical] Big work on the switch from SystemJS to Webpack (v4) as javascript module bundler and loader. This was a required step to accelerate portability of stravistix to Firefox.",
		]
	},
	{
		version: "6.1.2",
		date: "2018-04-22",
		message: "Added year progression global overview (click \"overview\" button in year progression). Release 6.1.* improves \"Fitness Trend\" accuracy with HRM. Adds  " + (new Date()).getFullYear() + " delta comparison in \"Year progressions\". Adds data-fields: HRSS, HRSS/Hour, Best 20min HR & Best 20min Power.",
		hotFixes: [],
		features: [
			"Add year progression global overview including all progress types (distance, time, elevation and count): click \"overview\" button in year progression."
		],
		isPatch: true,
		fixes: [
			"Fixed fitness trend graph not showing today date for athletes having UTC-3 timezone.",
			"Fixed case where \"Best 20min power\" and \"Best 20min heart rate\" could not be computed from bkool rides.",
			"Fixed case where some users could not close the fitness trend start notice.",
			"Renamed \"FTHR\" stat data-field to \"Best 20min heart rate\"."
		]
	},
	{
		version: "6.1.1",
		date: "2018-04-09",
		message: "Big 6.1.* update! Strongly improved the \"Fitness Trend\" accuracy using a heart rate monitor. Added  " + (new Date()).getFullYear() + " delta comparison for each year of \"Year progressions\" feature. Added new data-fields: HRSS, HRSS/Hour, Best 20min Heart Rate and Best 20min Power.",
		hotFixes: [],
		features: [],
		isPatch: true,
		fixes: [
			"Improved background sync to avoid manual trigger. Now checking if you have just uploaded your last ride, run or whatever and will perform a \"fast sync\". \"Classic\" syncs are now performed every 24 hours (customizable value).",
			"Improved app behaviour when a sync is done. If your last activity has been just synced then the app will react in realtime to handle the change without reloading the page.",
			"Fixed a sync bug where user could be stuck at given sync percentage. Bug was introduced in the previous version by the new best split calculator.",
			"Lowered max zones to 40 in zone settings to avoid chrome synced storage over quota.",
			"Renamed \"FTP\" stat data-field to \"Best 20min Power\"."
		]
	},
	{
		version: "6.1.0",
		date: "2018-04-02",
		message: "Big update! Strongly improved the \"Fitness Trend\" accuracy using a heart rate monitor. Added  " + (new Date()).getFullYear() + " delta comparison for each year of \"Year progressions\" feature. Added new data-fields: HRSS, HRSS/Hour, Best 20min Power and Best 20min Heart Rate.",
		hotFixes: [],
		features: [
			"Fitness Trend: increased fitness trend accuracy using a heart rate monitor. Heart rate based activities have their stress scores " +
			"processed with Heart Rate Stress Score (HRSS). The HRSS method has been added over TRIMP because HRSS scores are scaled to be use with Training Zones; " +
			"HRSS scores can be directly compared to Cycling Power Stress Scores (PSS); HRSS scores can be directly compared to Swimming Stress Scores (SSS).",

			"Year progression: new delta comparison for each year with the current year.",
			"Data-fields: added HRSS (Heart Rate Stress Score) and HRSS/Hour to activity stats.",
			"Data-fields: added 'Best 20min Power' and 'Best 20min Heart Rate' to activity stats.",
			"Added an \"Advanced Menu\" to manage plugin caches and reset settings."],
		isPatch: false,
		fixes: [
			"Updated fitness trend user guide",
			"Updated heart rate stats helper",
			"Updated power stats helper",
			"Upgraded plugin libraries"]
	},
	{
		version: "6.0.3",
		date: "2018-03-18",
		message: "Third patch of <strong>NEW APP</strong> released in February. Mainly bugs fixes and improvements. Click \"show details\" for more info.",
		hotFixes: [],
		features: [
			"New fitness trend feature. Fully reworked on patch 6.0.2: Added tooltip for detail of each day; Added active day dotted line & form curve area to distinguish zero line.",
			"New year progressions",
			"New common settings section",
			"New athlete settings section",
			"New zones settings section",
			"New themes: light & dark",
			"Pushed reliability & global performance",
			"Optimized the \"auto-sync\" in background: You'll perform less manual syncs"
		],
		isPatch: true,
		fixes: [
			"Added some horizontal lines on fitness trend graph",
			"Improved graphs rendering performance",
			"Added missing message on fitness trend when user as no eligible history to access feature",
			"Fixed fitness graph vertical flicks when text of activities were too long",
			"Fixed a zones settings major issue when zones could be saved on some cases",
			"Fixed wrong power stress score calculation when an activity were on pause"
		]
	},
	{
		version: "6.0.2",
		date: "2018-03-11",
		message: "2nd big patch of the brand <strong>NEW APP</strong>!. Fitness trend look has been reworked along your feedbacks. And fitness graph is now linked to fitness table. And tons of other things...",
		hotFixes: [],
		features: [
			"Remade and improved fitness trend feature",
			"Remade and improved year progressions",
			"Remade and improved common settings section",
			"Remade and improved athlete settings section",
			"Remade and improved zones settings section",
			"Remade global design of the app with light and dark themes",
			"Improved global reliability & performance of the application"
		],
		isPatch: true,
		fixes: [
			"Set default theme is now dark. Added a button directly on toolbar to switch theme (dark/light)",
			"Reworked fitness trend graph look: Added tooltip for detail of each day. Added active day dotted line & form curve area (both help to distinguish zero line)",
			"Added data link between fitness trend graph & fitness table. Graph and table are also displayed on same page from now",
			"Optimized auto sync while on strava.com. You should perform less manual synchronizations",
			"Changed fitness trend period slide 'forward/backward' from 15 to 14 days",
			"Fixed bug on fitness trend when user select a bigger last period than his history length",
			"[Technical] Restructured the global architecture of the fitness trend",
			"[Technical] Upgraded angular, angular material & flex layouts libraries",
			"[Technical] Upgraded katex version for maths expressions"
		]
	},
	{
		version: "6.0.1",
		date: "2018-02-25",
		message: "First patch of the brand <strong>NEW app</strong>! Fitness trend, years progress & others features have been fully remade! A <strong>new start</strong> to go further!",
		hotFixes: [],
		features: [
			"Remade and improved fitness trend feature",
			"Remade and improved year progressions",
			"Remade and improved common settings section",
			"Remade and improved athlete settings section",
			"Remade and improved zones settings section",
			"Remade global design of the app with light and dark themes",
			"Improved global reliability & performance of the application"
		],
		isPatch: true,
		fixes: [
			"Fixed E-Bike rides skipped in fitness trend with an option that include/exclude them",
			"Fixed fitness trend legend readability. Some others improvements are incoming along user feedback (e.g. tooltips & more clarity on training zone)",
			"Fixed many others minors bugs"
		]
	},
	{
		version: "6.0.0",
		date: "2018-02-18",
		message: "Brand <strong>NEW app</strong> released! Fitness trend, years progress & others features have been fully remade! This <strong>new start</strong> was required to go further!",
		hotFixes: [],
		features: [
			"Remade and improved fitness trend feature",
			"Remade and improved year progressions",
			"Remade and improved common settings section",
			"Remade and improved athlete settings section",
			"Remade and improved zones settings section",
			"Remade global design of the app with light and dark themes",
			"Improved global reliability & performance of the application"
		],
		isPatch: false,
		fixes: [],
	},
	{
		version: "5.13.0",
		date: "2018-01-28",
		message: "Added Power estimation on <strong>your</strong> runs <span style='text-decoration: line-through;'>(beta)</span> " +
		"<strong style='font-size: 16px'>+</strong> cycling \"Power Stress Score (PSS)\" estimation (when no running or cycling power meter available)!!. And few others things...",
		hotFixes: [],
		features: [
			"Added estimation of PSS (Power Stress Score) cycling activities without power meter.",
			"Added running power estimation of your running activities (comparable with cycling power in watts). Feature is no more in Beta.",
			"Added the day of the week on graph tooltips of fitness trend feature",
		],
		isPatch: false,
		fixes: [
			"Fixed 'Show Extended Statistics button' not working on some workouts when running power estimation where enabled.",
		],
	},
	{
		version: "5.12.1",
		date: "2017-12-02",
		message: "Some bug fixes <strong style='font-size: 16px'>+</strong> Added cycling crank revolution distance stats <strong style='font-size: 16px'>+</strong> Running stride length (with total steps) <strong style='font-size: 16px'>+</strong> Running power estimation (Beta: must be enabled in beta settings section)",
		hotFixes: [],
		features: [
			"Added Running stats: Stride length & total steps.",
			"Added Cycling stats: Crank revolution distance. The distance travelled for a crank revolution.",
			"[Beta] Added running power estimation of your running activities (comparable with cycling power in watts). /!\\ Beta feature must be enabled in stravistix settings.",
		],
		isPatch: true,
		fixes: [
			"Fixed 'Show Extended Statistics button' not working for some workouts",
			"Fixed kom segment time showing NaN:NaN:NaN when strava.com do not provide sufficient info to compute it.",
			"Fixed a wrong calculation of variability index due to incorrect average power (average power on moving was previously used).",
			"Fixed hide virtual rides option not working since new strava UI.",
		],
	},
	{
		version: "5.12.0",
		date: "2017-11-01",
		message: "Added cycling crank revolution distance stats <strong style='font-size: 16px'>+</strong> Running stride length (with total steps) <strong style='font-size: 16px'>+</strong> Running power estimation (Beta: must be enabled in beta settings section)",
		hotFixes: [],
		features: [
			"Added Running stats: Stride length & total steps.",
			"Added Cycling stats: Crank revolution distance. The distance travelled for a crank revolution.",
			"[Beta] Added running power estimation of your running activities (comparable with cycling power in watts). /!\\ Beta feature must be enabled in stravistix settings.",
		],
		isPatch: false,
		fixes: [
			"Fixed a wrong calculation of variability index due to incorrect average power (average power on moving was previously used).",
			"Fixed hide virtual rides option not working since new strava UI.",
		],
	},
	{
		version: "5.11.1",
		date: "2017-10-02",
		message: "<i>Hot fixed year progress missing in strava \"My Profile\" page.</i> <strong>V5.11.0 note:</strong> Added cadence pace on climbs, flats & downhills sections. And max uphill & downhill grades. And more...",
		hotFixes: [],
		features: [
			"Added average cadence pace when on climbs, flats or downhills sections",
			"Added max uphill & downhill grades on activities pages.",
			"Added an option to hide suggested athletes on dashboard",
			"Changed heart rate zones inputs from %HRR to BPM. %HRR remains available on data display.",
		],
		isPatch: true,
		fixes: [
			"Fixed year progressions missing in strava \"My Profile\" page"
		],
	},
	{
		version: "5.11.0",
		date: "2017-09-10",
		message: "NEW: Added cadence pace on climbs, flats or downhills sections. And max uphill & downhill grades. And more...",
		hotFixes: [],
		features: [
			"Added average cadence pace when on climbs, flats or downhills sections",
			"Added max uphill & downhill grades on activities pages.",
			"Added an option to hide suggested athletes on dashboard",
			"Changed heart rate zones inputs from %HRR to BPM. %HRR remains available on data display.",
		],
		isPatch: false,
		fixes: [
			"Fixed QRcode feature not working anymore on activities pages"
		],
	},
	{
		version: "5.10.1",
		date: "2017-08-08",
		message: "NEW: Added TCX export to \"GPS Real Time Segments Efforts\": Challenge yourself outside against a ghost! Plugin's performance has been also greatly improved !!",
		hotFixes: [
			"Fixed TCX export as Course instead of Activity (feature: GPS Real Time Segments Efforts)",
		],
		features: [
			"Added TCX export to \"GPS Real Time Segments Efforts\" in addition to GPX format (Edge 500 users might use TCX instead of GPX). Power sensor data has been also added to exported segments efforts (both GPX/TCX). Go to an activity, choose a segment effort (from you or another athlete) and click \"Export this Segment Effort to your GPS\".",
			"Technical: Stravistix scripts are loaded on demand with SystemJS library. Stravistix & strava.com scripts are now isolated: avoid conflicts and potentials bugs. Also migrated from \"underscore\" to a more fastest javascript library: \"lodash\".",
		],
		isPatch: true,
		fixes: [
			// "Fixed hidden premium labels and buttons (requested by strava.com)",
			// "Fixed cases where plugin ran itself on login page & premium promotion page: display glitches could occur on these pages.",
		],
	},
	{
		version: "5.10.0",
		date: "2017-08-06",
		message: "NEW: Added TCX export to \"GPS Real Time Segments Efforts\": Challenge yourself outside against a ghost! Plugin's performance has been also greatly improved !!",
		hotFixes: [],
		features: [
			"Added TCX export to \"GPS Real Time Segments Efforts\" in addition to GPX format (Edge 500 users might use TCX instead of GPX). Power sensor data has been also added to exported segments efforts (both GPX/TCX). Go to an activity, choose a segment effort (from you or another athlete) and click \"Export this Segment Effort to your GPS\".",
			"Technical: Stravistix scripts are loaded on demand with SystemJS library. Stravistix & strava.com scripts are now isolated: avoid conflicts and potentials bugs. Also migrated from \"underscore\" to a more fastest javascript library: \"lodash\".",
		],
		isPatch: false,
		fixes: [
			"Fixed hidden premium labels and buttons (requested by strava.com)",
			"Fixed cases where plugin ran itself on login page & premium promotion page: display glitches could occur on these pages.",
		],
	},
	{
		version: "5.9.0",
		date: "2017-07-20",
		message: "NEW: Export segments efforts to your GPS device and challenge yourself outside against a virtual friend, a pro or your ghost!",
		hotFixes: [],
		features: [
			"Added export segments efforts to your GPS device. Go to an activity, choose a segment effort (from you or another athlete) and click \"Export segment effort for GPS device\".",
		],
		isPatch: false,
		fixes: [
			"Fixed links errors to access some options pages",
			"Fixed global wrong conversion from seconds to hh:mm:ss format",
			"Fixed hidden premium labels and buttons on plugin install (requested by strava.com)",
		],
	},
	{
		version: "5.8.1",
		date: "2017-06-30",
		message: "Improvements on years progressions and \"Relive\" feature (Replay your Rides & Runs inside your activity pages with relive.cc)",
		hotFixes: [],
		features: [
			"Added \"Relive\" of your Rides & Runs inside your activity pages with relive.cc. Make sure you have <a href=\"http://relive.cc\" target=\"_blank\">relive.cc</a> account to get the feature onto your next Rides & Runs.",
		],
		isPatch: true,
		fixes: ["Fixed time format in years progressions"],
	},
	{
		version: "5.8.0",
		message: "NEW: \"Relive\" your Rides & Runs inside your activity pages with relive.cc",
		hotFixes: [],
		features: [
			"Added \"Relive\" of your Rides & Runs inside your activity pages with relive.cc. Make sure you have <a href=\"http://relive.cc\" target=\"_blank\">relive.cc</a> account to get the feature onto your next Rides & Runs.",
		],
		isPatch: false,
		fixes: [],
	},
	{
		version: "5.7.2",
		date: "2017-04-06",
		message: "New Year progressions improvements (Old version reactivated in Strava profile page) <strong>+</strong> Custom running power zones <strong>+</strong> Hide Virtual Rides",
		hotFixes: [],
		features: [
			"Added New Year progression UI.",
			"Added custom running power zones (was linked to cycling power zones before)",
			"Added option to hide Virtual Rides from activity feed",
			"Added ribbon on top of page when plugin update occurs. Less annoying than the big update popup ;)",
			"Minor improvements",
		],
		isPatch: true,
		fixes: [
			"Fixed new year progressions \"Time (h)\" jumps",
			"Fixed new year progressions counts on selected activity types",
		],
	},
	{
		version: "5.7.1",
		date: "2017-03-19",
		message: "Added New Year progressions <strong>+</strong> Custom running power zones <strong>+</strong> Hide Virtual Rides",
		hotFixes: [],
		features: [
			"Added New Year progression UI.",
			"Added custom running power zones (was linked to cycling power zones before)",
			"Added option to hide Virtual Rides from activity feed",
			"Added ribbon on top of page when plugin update occurs. Less annoying than the big update popup ;)",
			"Minor improvements",
		],
		isPatch: false,
		fixes: [
			"Fixed plugin running on strava.com/api/*",
		],
	},
	{
		version: "5.6.1",
		date: "2017-03-09",
		message: "<i>(5.6.1: Fast fix on the new swimming fitness trend support)</i></br></br><strong>NEW:</strong> Swimming is now supported in multi-sport fitness trend!!</br></br><strong>Fitness trend</strong> is now completely <strong>ready</strong> for <strong>triathletes</strong> :)</br></br> It's also working with swimming activities entered manually :) No heart rate monitor is required for swimming! Your 10$ stopwatch should be good enough ;) !",
		hotFixes: [
			"Fixed a case where fitness trend feature was KO because of swimming activities having distance equals to 0.",
		],
		features: [
			"Added Swimming support inside multi-sport fitness trend by using your swim FTP.</br><i>Note: this type of activity where not supported by default (via HR data and thus \"trimps\") because strava swimming activities don't keep HR data.</i>",
			"Improved history synchronization. Synchronization continues where she stopped earlier (in case of any type of interruption).",
			"Added possibility to filter or not \"commutes\" activities on year progressions.",
		],
		isPatch: true,
		fixes: [],
	},
	{
		version: "5.6.0",
		date: "2017-03-08",
		message: "Swimming is now supported in multi-sport fitness trend!!</br></br><strong>Fitness trend</strong> is now completely <strong>ready</strong> for <strong>triathletes</strong> :)</br></br> It's also working with swimming activities entered manually :) No heart rate monitor is required for swimming! Your 10$ stopwatch should be good enough ;) !",
		hotFixes: [],
		features: [
			"Added Swimming support inside multi-sport fitness trend by using your swim FTP.</br><i>Note: this type of activity where not supported by default (via HR data and thus \"trimps\") because strava swimming activities don't keep HR data.</i>",
			"Improved history synchronization. Synchronization continues where she stopped earlier (in case of any type of interruption).",
			"Added possibility to filter or not \"commutes\" activities on year progressions.",
		],
		isPatch: false,
		fixes: [
			"Fixed date comparison bug on additional goal progress tracking.",
		],
	},
	{
		version: "5.5.0",
		date: "2017-02-22",
		message: "At a glance...</br>Cycling Power Stress Score on your activities :)</br>" +
		"Support of Running Power Meters :)</br>" +
		"Please redo a full sync of your history if you \"pause\" your activities during lunch (See below fixed bugs)",
		hotFixes: [],
		features: [
			"Added \"Cycling Power Stress Score\" to strava activity pages. You must have a power meter on your bike to view the stat.",
			"Added support of Running Power Meters (e.g. Stryd, RPM2, ... sensors) inside strava running activities pages.",
			"Added a period of \"6 weeks\" inside MultiSports Fitness Trend",
		],
		isPatch: false,
		fixes: [
			"Fixed a wrong calculation of TRIMP on elapsed time when your activities were \"paused\" for a long time. <i></i>",
			"Fixed the use of running power meters matching with cycling power meter option of Multisports Fitness Trend.",
			"Fixed a wrong calculation of based w/kg stats on others cycling activities than you: your weight were used instead of the weights of activities owners.",
		],
	},
	{
		version: "5.4.2",
		date: "2017-02-13",
		message: "<i>Patch release: Now calculating TRIMP over elapsed time instead of moving time. TRIMP were not properly computed with activities without movements.<br/>You may need to perform a full sync of your synced history for the fitness trend feature. Memory management during synchronization of your history has been also improved.</i>",
		hotFixes: [],
		features: [
			"MultiSports Fitness Trend can now use your cycling power meter to compute your fitness.",
			"Strava premium additional goal progress is back! Still \"experimental\". Activate it from Hidden feature section",
			"Renamed cycling stat \"Punch Factor\" to \"Intensity\" (= Weighted Power / FTP)",
		],
		isPatch: true,
		fixes: [
			"Now calculating TRIMP over elapsed time instead of moving time",
			"Improved memory management during synchronization of your history",
		],
	},
	{
		version: "5.4.1",
		date: "2017-02-03",
		message: "<strong>5.4.1:</strong> <i>Bug fix release</i></br></br><strong>5.4.0 features reminder:</strong> MultiSports Fitness Trend now use your cycling power meter to compute your fitness when available.",
		hotFixes: [],
		features: [
			"Fitness trend can now use your cycling power meter to compute your fitness.",
			"Strava premium additional goal progress is back! Still \"experimental\". Activate it from Hidden feature section",
			"Renamed cycling stat \"Punch Factor\" to \"Intensity\" (= Weighted Power / FTP)",
		],
		isPatch: true,
		fixes: [
			"Fix wrong daily fitness final score in case of multiple activities done on same day having TRIMP score for some and PSS score for others.",
		],
	},
	{
		version: "5.4.0",
		date: "2017-01-26",
		message: "MultiSports Fitness Trend now use your cycling power meter to compute your fitness when available.</br></br>Swimming is not supported properly in fitness trend... Now taking care of swimmers ;) Still in Beta isn't it ?^^;)",
		hotFixes: [],
		features: [
			"Fitness trend can now use your cycling power meter to compute your fitness.",
			"Strava premium additional goal progress is back! Still \"experimental\". Activate it from Hidden feature section",
			"Renamed cycling stat \"Punch Factor\" to \"Intensity\" (= Weighted Power / FTP)",
		],
		isPatch: false,
		fixes: [],
	},
	{
		version: "5.3.1",
		date: "2017-01-17",
		message: "<strong>5.3.1:</strong> <i>Strava premium additional goal has been delayed at the moment.</i></br></br><strong>5.3.0 features reminder:</strong> <i>New beta version of MultiSports Fitness Trend</br></br>- Added form zones to fitness trend. Gives guidelines to train properly: Stay in the right training zone and avoid risky over load. Prepare for the race day. Manage your rest with accuracy. Etc...</br>- On next update (5.4.0): cycling power meter will be also used to compute your fitness trend (if you have this sensor).</i>",
		hotFixes: [],
		features: [
			"Added form zones to fitness trend.",
			"Improved required time to generate fitness trend graph.",
			"Others minors improvements around MultiSports Fitness Trend & synchronisation.",
		],
		isPatch: true,
		fixes: [
			"Due to feature problems: strava premium additional goal progress tracking has be removed temporally. It's coming back later.",
		],
	},
	{
		version: "5.3.0",
		date: "2017-01-10",
		message: "</br>New beta version of MultiSports Fitness Trend</br></br>- Added form zones to fitness trend. Gives guidelines to train properly: Stay in the right training zone and avoid risky over load.</br>Prepare for the race day. Manage your rest with accuracy. Etc...</br></br>- On next update: cycling power meter will be also used to compute your fitness trend (if you have this sensor).",
		hotFixes: [],
		features: [
			"Added form zones to fitness trend.",
			"Improved required time to generate fitness trend graph.",
			"Others minors improvements around MultiSports Fitness Trend & synchronisation.",
		],
		isPatch: false,
		fixes: [],
	},
	{
		version: "5.2.0",
		date: "2016-12-26",
		message: "</br>MultiSports Fitness Trend in Beta for ALL!</br></br>",
		hotFixes: [],
		features: [
			"MultiSports Fitness Trend released as beta",
		],
		isPatch: false,
		fixes: [],
	},
	{
		version: "5.1.1",
		date: "2016-12-20",
		message: "MultiSports Fitness Trend here. Sync process fully reworked!. Last alpha testing version optimistically.</br></br>" +
		"/!\\ Your <u>history</u> have been <u>cleared</u> on this update if you had synced one... Just sync again... Sry :/",
		hotFixes: [],
		features: [
			"<i>MultiSports Fitness Trend:</i> Sync process fully reworked. Added, deleted & edited activities should be well handled. Sync typescript code is covered by unit tests.",
		],
		isPatch: false,
		fixes: [
			// 'Fixed cases where activities were not correctly handled on history synchronisation (<i>MultiSports Fitness Trend</i>)',
			"Fixed a lot of others small things...",
		],
	},
	{
		version: "5.1.0",
		date: "2016-12-11",
		message: "MultiSports Fitness Trend live! Improvements + fixes. Short nights :D. Feature still in \"test\".</br>" +
		"Your history have been cleared if you had synced one... just sync again.",
		hotFixes: [],
		features: [
			"Generating <i>MultiSports Fitness Trend</i> graph up to 4x faster",
			"Auto sync frequency is now customisable in settings. Default is every 60 minute while browsing strava website",
			"Added an update process of your activities names and types from strava to your local history: performed on a simple sync. ",
			"Added backup/restore function of your local history synced",
		],
		isPatch: false,
		fixes: [
			"Partially fixed cases where activities not displayed in <i>MultiSports Fitness Trend</i> on simple sync. Working hard!",
			"Fixed gap between curves of <i>MultiSports Fitness Trend</i> from today to preview days",
			"Fixed a lot of others small things...",
		],
	},
	{
		version: "5.0.2",
		date: "2016-12-07",
		message: "<i>\"MultiSports Fitness Trend\"</i> Alpha <strong>V3</strong> fast released! Include fixes of Alpha V2+V1... Feature works with all activities where you held a heart rate monitor. Not only cycling...</br></br>Sticky note: <i>\"Premium additional goal progress tracking\"</i> disabled. Still few bugs around to fix :/ Feature is available in common settings by the way (hidden section)",
		hotFixes: [],
		features: [],
		isPatch: true,
		fixes: [
			"Fixed majors bugs of <i>\"MultiSports Fitness Trend\"</i> Alpha V2+V1",
		],
	},
	{
		version: "5.0.1",
		date: "2016-12-06",
		message: "<i>\"MultiSports Fitness Trend\"</i> Alpha V2 here! Mainly bugs fixed of Alpha V1... Thanks to testers! It works with all activities where you held a heart rate monitor. Not only cycling... </br></br>Also disabled <i>\"Premium additional goal progress tracking\"</i>. Still few bugs around to fix :/ Feature is available in common settings by the way (hidden section)",
		hotFixes: [],
		features: [
			"Added plugin permission for users having more than 5MB of history. They can now save locally their history (required by <i>\"MultiSports Fitness Trend\"</i>)",
		],
		isPatch: false,
		fixes: [
			"Fixed majors bugs of <i>\"MultiSports Fitness Trend\"</i> Alpha V1",
			"Disabled <i>\"Premium additional goal progress tracking\"</i>: few bugs remaining. Still available in common settings (hidden section).",
		],
	},
	{
		version: "5.0.0",
		date: "2016-12-03",
		message: "<i>MultiSports Fitness Trend released as Alpha !<br /><br />After long days of work, It's now live! Yeah! <br/><br/>Working with all activities where you held a heart rate monitor. Not only cycling...</i>",
		hotFixes: [],
		features: [
			"MultiSports fitness trend.",
		],
		isPatch: false,
		fixes: [],
	},
	{
		version: "4.5.3",
		date: "2016-11-24",
		message: "Another release to fix latest small bug from 4.5.x. Sorry for inconvenience",
		hotFixes: [],
		features: [
			"Added monthly and weekly targets for strava premium annual goals",
		],
		isPatch: false,
		fixes: [
			"Fix again monthly and weekly targets number format when language selected is french",
			"Fix weather on cycling activities: only wind map could be displayed",
			"Fixed extended stats graph to get Y axis always starting from zero",
		],
	},
	{
		version: "4.5.2",
		date: "2016-11-18",
		message: "NEW: Added monthly and weekly targets for strava premium annual goals",
		hotFixes: [
			"Hot fix monthly and weekly targets number format",
		],
		features: [
			"Added monthly and weekly targets for strava premium annual goals",
		],
		isPatch: false,
		fixes: [
			"Fixed extended stats graph to get Y axis always starting from zero",
		],
	},
	{
		version: "4.5.0",
		date: "2016-11-17",
		message: "NEW: Added monthly and weekly targets for strava premium annual goals",
		hotFixes: [],
		features: [
			"Added monthly and weekly targets for strava premium annual goals",
		],
		isPatch: false,
		fixes: [
			"Fixed extended stats graph to get Y axis always starting from zero",
		],
	},
	{
		version: "4.4.0",
		date: "2016-11-03",
		message: "NEW: Segment time comparison on all activity types ! Yeah !",
		hotFixes: [],
		features: [
			"Segment time comparison on all activity types.",
		],
		isPatch: false,
		fixes: [
			"Fixed some bugs on running estimated paces & cycling estimated powers: Recent efforts for running could rarely show watts instead of time & time range could be wrong sometimes",
		],
	}, {
		version: "4.3.3",
		date: "2016-10-22",
		message: "Fixing bugs from 4.2.2</br></br><strong>NEW as BETA:</strong> Added running estimated paces & cycling estimated powers from your most painful effort on a segment. The feature visible on \"Your recent efforts\" graph displayed in segment pages. <div style=\"text-align: center;\"></div>",
		hotFixes: [],
		features: [
			"BETA: Cycling estimated powers based on your most painful effort on a segment.",
			"BETA: Running estimated paces based on your most painful effort on a segment.",
			"Migrate 100% of the javascript code to <a href=\"https://www.typescriptlang.org/\" target=\"_blank\">Microsoft TypeScript</a>. An invisible enhancement for you. Futures features are now easiest to implement."],
		isPatch: true,
		fixes: [
			"Fixed year progressions which could be not loaded by users having only running activities.",
			"Fixed bad axis displayed on running estimated paces & cycling estimated powers.",
			"Fixed update notification which could be not displayed on plugin update.",
		],
	}, {
		version: "4.3.2",
		date: "2016-10-17",
		message: "<strong>NEW as BETA:</strong> Added running estimated paces & cycling estimated powers from your most painful effort on a segment. The feature visible on \"Your recent efforts\" graph displayed in segment pages. <div style=\"text-align: center;\"></div>",
		hotFixes: [],
		features: [
			"BETA: Cycling estimated powers based on your most painful effort on a segment.",
			"BETA: Running estimated paces based on your most painful effort on a segment.",
			"Migrate 100% of the javascript code to <a href=\"https://www.typescriptlang.org/\" target=\"_blank\">Microsoft TypeScript</a>. An invisible enhancement for you. Futures features are now easiest to implement."],
		isPatch: false,
		fixes: ["Fixed broken heat map link in StravistiX burger menu"],
	}, {
		version: "4.3.1",
		date: "2016-10-15",
		message: "NEW: Added running estimated paces & cycling estimated powers from your most painful effort on a segment. The feature visible on \"Your recent efforts\" graph displayed in segment pages.",
		hotFixes: [],
		features: [
			"Cycling estimated powers based on your most painful effort on a segment.",
			"Running estimated paces based on your most painful effort on a segment.",
			"Migrate 100% of the javascript code to <a href=\"https://www.typescriptlang.org/\" target=\"_blank\">Microsoft TypeScript</a>. An invisible enhancement for you. Futures features are now easiest to implement."],
		isPatch: false,
		fixes: ["Fixed broken heat map link in StravistiX burger menu"],
	}, {
		version: "4.2.3",
		date: "2016-10-02",
		message: "... Again... a hotfix for new v4.2.x ;)",
		hotFixes: [
			"Fixed a crash that could occur on several activities opened.",
		],
		features: [
			"Extended stats on Trainer Rides (where speed was not recorded)",
			"Invisible enhancement to prepare future: Moved 50% of the JS code to <a href=\"https://www.typescriptlang.org/\" target=\"_blank\">Microsoft TypeScript</a> (Geeks and developers could understand ;))"],
		isPatch: true,
		fixes: [],
	}, {
		version: "4.2.2",
		date: "2016-09-28",
		message: "Another hotfix for new v4.2.x",
		hotFixes: [
			"Fixed a crash that could occur in older version of chrome (under v53)",
		],
		features: [
			"Extended stats on Trainer Rides (where speed was not recorded)",
			"Invisible enhancement to prepare future: Moved 50% of the JS code to <a href=\"https://www.typescriptlang.org/\" target=\"_blank\">Microsoft TypeScript</a> (Geeks and developers could understand ;))"],
		isPatch: true,
		fixes: [],
	}, {
		version: "4.2.1",
		date: "2016-09-26",
		message: "Fast hotfix of new v4.2.0",
		hotFixes: ["Fixed cycling PR/yPR on segment time comparaison: They were displayed as running"],
		features: [
			"Extended stats on Trainer Rides (where speed was not recorded)",
			"Invisible enhancement to prepare future: Moved 50% of the JS code to <a href=\"https://www.typescriptlang.org/\" target=\"_blank\">Microsoft TypeScript</a> (Geeks and developers could understand ;))"],
		isPatch: true,
		fixes: [],
	}, {
		version: "4.2.0",
		date: "2016-09-25",
		hotFixes: [],
		features: [
			"Extended stats on Trainer Rides (where speed was not recorded)",
			"Invisible enhancement to prepare future: Moved 50% of the JS code to <a href=\"https://www.typescriptlang.org/\" target=\"_blank\">Microsoft TypeScript</a> (Geeks and developers could understand ;))"],
		isPatch: false,
		fixes: [],
	}, {
		version: "4.1.0",
		date: "2016-09-14",
		message: "",
		hotFixes: [],
		features: [
			"Segment time comparison now live for RUNNING ! Just open a running activity to see changes.",
			"Improved zones customization in options: More thinner and explicit."],
		isPatch: false,
		fixes: [
			"Fixed technical error which occured in plugin packaging with gulp",
		],
	}, {
		version: "4.0.1",
		date: "2016-09-04",
		message: "NEW options user interface ! A NEW perspective is open for upcoming big features (WIP) ;)",
		hotFixes: [],
		features: ["Re-made options UI to prepare future of plugin! Google material design applied!"],
		isPatch: false,
		fixes: [
			"Fixed vanished \"segment veloviewer\" and \"nearby segments\" links on segments pages",
			"Fixed wrong standard deviation speed when using MPH units",
		],
	}, {
		version: "3.10.1",
		date: "2016-08-26",
		message: "A bug fixing release of previous 3.10.0 here. Sry :/ ... Major update will be the next one ;)",
		hotFixes: [],
		isPatch: true,
		features: [
			"Added Hidden/Beta feature section.",
			"Added Relive.cc as Hidden/Beta feature.",
		],
		fixes: [
			"Fix HR info in other athlete's activities don't make sense with user max/min HR.",
		],
	}, {
		version: "3.10.0",
		date: "2016-08-15",
		features: [
			"Added Hidden/Beta feature section.",
			"Added Relive.cc as Hidden/Beta feature.",
		],
	}, {
		version: "3.9.1",
		date: "2016-08-03",
		features: [
			"Fix pace display glitch in athlete summary",
		],
	}, {
		version: "3.9.0",
		date: "2016-07-17",
		features: [
			"Now up to 50 zones can be defined in zones settings for each data type: speed, pace, cadence, heartrate, power, grade, ...",
			"Added full time average speed based on elapsed time.",
			"Extended stats charts refresh ! Migration to  Chart.js 2.0 done :)",
		],
	}, {
		version: "3.8.1",
		date: "2016-07-01",
		features: [
			"HotFixing best splits",
		],
	}, {
		version: "3.8.0",
		date: "2016-06-22",
		features: [
			"Added cycling/running distance target graph into year progression graph. Go to Common Settings and search for Year progression targets for 2016 to setup your targets.",
			"Added Weighted Avg Power field in activity summary panel",
			"Added Watts Per Kilograms field in activity summary panel",
			"Fixed a rare case where extended stats couldn't open themselve",
			"Various improvements",
		],
	}, {
		version: "3.7.0",
		date: "2016-06-05",
		features: [
			"Strongly improved estimated ",
			"weighted / normalized power for non power sensor users. Estimated weighted power is now accurate for moneyless cyclists :p.",
			"Re-highlight best split feature. Some of the users were not aware this key feature ;)",
			"Various improvements",
			"Fixed some of display gitches segments list on cycling activity pages: columns could exceed the size of the segments list table.",
			"Fixed weighted / normalized power for some users having power sensor. An element of calculation of the method specified by Andy R. Coggan was well considered but partially previously.",
		],
	}, {
		version: "3.6.0",
		date: "2016-05-26",
		features: [
			"Added  %rank next to rank labels in segments list on cycling activity pages. Quick view on where you're ranked!",
			"Added back jonathanokeeffe segment details on segment pages",
			"Added back veloviewer segment details on segment pages",
			"Fixed weather maps initialised with no maps. (Available on cycling activities",
			"Fixed Last 30 days comparaison chart in year progression stats to get the end of each day, rather than the beginning. This avoids the issue where activities from today are not included in the graph",
			"Fixed not displayed Distance last year comparaison chart in year progression stats for some people",

		],
	}, {
		version: "3.5.1",
		date: "2016-05-13",
		features: [
			"HotFixed disappearance of 'My year progressions to current month / day' (My Profile page)",
		],
	}, {
		version: "3.5.0",
		date: "2016-05-13",
		features: [
			"Globally improved segment time comparaison for cycling activities.",
			"Fixed segment time comparaison '-0s' when activity beats year's record on a segment",
			"Fixed segment time comparaison '-0s' when the year record beats global previous record",
			"Removed useless stravistix highlight feature. It's not a feature... it's not a bug... it's remove ;)",
			"Invisible project improvements (such as gulp task runner Implementation)",
		],
	}, {
		version: "3.4.0",
		date: "2016-04-22",
		features: [
			"Updated colored  rank position in segments efforts list (on a cycling activity page)",
			"Fixed rank percentage display problem on segment pages",
			"Fixed nearby segments vanished on segment pages",
			"Fixed time comparaison flickering in segments efforts list (on a cycling activity page)",
			"Option page technical improvements",
		],
	}, {
		version: "3.3.1",
		date: "2016-04-12",
		features: [
			"Introducing new year progressions charts: Distance last year and Distance last 30d (Go to My Profile)",
			"Fix cadence time on segments efforts (global activity value was shown).",
			"Integrating new logo design by paulinevial.fr",
			"Minors fixes",
		],
	}, {
		version: "3.2.3",
		date: "2016-03-26",
		features: [
			"Disable stravistix on new strava store",
			"Minors improvements",
		],
	}, {
		version: "3.2.2",
		date: "2016-03-11",
		features: [
			"Hotfix Wrong running climbing pace on extended panel",
		],
	}, {
		version: "3.2.1",
		date: "2016-03-09",
		features: [
			"Hotfix Hide activities under distance errors on others languages than EN/FR",
			"Hotfix Wrong climbing pace running on summary panel",
		],
	}, {
		version: "3.2.0",
		date: "2016-03-08",
		features: [
			"Improved performance on extended activity stats processing. The page should load faster since computation is now done through a separate thread/webworker.",
			"Added extended stats for runners: climbing/descending distance (inside grade section of extended stats panel). Cyclists already have this...",
			"Added option to hide the Pos. column on the segments table (in activities).",
			"Added option to activate temperature by default on running activities.",
			"Added option to mute small distance activities in dashboard feed: Just enter cycling/running distance at which activities are displayed",
			"Fixed miles/km ratio not applied in activities summary (My profile page)",
		],
	}, {
		version: "3.1.1",
		date: "2016-02-11",
		features: [
			"Added climb, flat & downhill distance for cyclists in extended stats (grade panel)",
			"Added average W/Kg in power extended stats",
			"Added option to get running cadence graph automatically enabled in running activity",
			"Improved W/KG computations: bike weight has been removed from KG. Only rider weight is considered.",
			"Fixed performance issues on segment time comparison. The feature has been re-enable by default.",
			"Fixed Ascent speed stats VAM mismatch with strava. Note that sscent speed stats are no longer displayed on segment efforts stats",
			"Hot fixed weighted power all same on efforts stats. Only cyclists having a power meter were touched by this bug.",
		],
	}, {
		version: "3.0.1",
		date: "2016-02-02",
		features: [
			"HotFix: Running cadence were mutiplied twice in graph/table on every segment effort stats button click (with both legs option enabled)",
		],
	}, {
		version: "3.0.0",
		date: "2016-01-18",
		features: [
			"Extended stats on segment efforts added !! Go to an cycling/running activity, click on a segment effort, then click show extended stats button",
			"Extended stats panel relooking",
		],
	}, {
		version: "2.2.2",
		date: "2015-12-30",
		features: [
			"FIX: Javascript syntax error while processing activities extended stats.",
		],
	}, {
		version: "2.2.1",
		date: "2015-12-15",
		features: [
			"Added option to count Virtual Rides (e.g. Zwift rides) into athlete yearly progression.",
			"Improving altitude smoothness for elevation and ascent speed extended stats, also in best splits",
			"FIX: Yearly Progression: wrong counting of activities",
			"FIX: Extended stats may not displayed on some activities: Error in local storage cache management.",
			"FIX: Extended stats may not displayed on some trainer rides",
		],
	}, {
		version: "2.1.1",
		date: "2015-12-02",
		features: [
			"FIX: Not getting extension stats on big ride (>300km)",
		],
	}, {
		version: "2.1.0",
		date: "2015-11-30",
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
		],
	}, {
		version: "2.0.1",
		date: "2015-11-17",
		features: [
			"HotFix: Null powers are computed in power best splits. They were removed from computation before.",
		],
	}, {
		version: "2.0.0",
		date: "2015-11-15",
		features: [
			"Best splits on cycling activities. Load a cycling activities. Under elevation chart click Best Splits (Thanks Tomasz Terlecki for the feature)",
			"Fix Pressing multiple times on the current tab adds ",
			"View in Google Maps multiple times.",
		],
	}, {
		version: "1.2.1",
		date: "2015-11-09",
		features: [
			"Fix Year progression chart icon which may invisible",
		],
	}, {
		version: "1.2.0",
		date: "2015-11-02",
		features: [
			"Added Year progression chart on Distance, Activity count, Elevation and Time (credit https://github.com/tazmanska)",
		],
	}, {
		version: "1.1.0",
		date: "2015-10-25",
		features: [
			"User preference for default Google Maps layer type",
			"Search for options in common settings",
			"Fix undefined errors in year progression",
		],
	}, {
		version: "1.0.2",
		date: "2015-10-16",
		features: [
			"Fix map display problem while cropping ride. Google maps API was loaded twice.",
		],
	}, {
		version: "1.0.1",
		date: "2015-10-08",
		features: [
			"Google Maps revived inside activities pages",
			"Add on/off extension settings for the segment time comparison on activities pages",
			"Segment time comparison for QOM (Womens) on activities pages",
			"Fix when segment time comparison may no be displayed",
			"Fix when No longer seeing extended stats on turbo activities",
			"Fix when Move ratio not being displayed (eg: Running race)",
		],
	}, {
		version: "0.8.0",
		date: "2015-09-21",
		features: [
			"Add Ascent speed statistics to extended elevation data stats: Average, first quartile, median and third quartile ascent speed",
			"Fixing bug when exporting another riders segment as a virtual partner.",
		],
	}, {
		version: "0.7.9",
		date: "2015-09-11",
		features: [
			"Fixing standard deviation cadence computed and displayed for cycling.",
			"Add standard deviation cadence to extended data popup panel",
		],
	}, {
		version: "0.7.8",
		date: "2015-09-07",
		features: [
			"Add Pedaling time to summary panel",
			"Add median cadence to summary panel",
			"Various bug fixes",
		],
	}, {
		version: "0.7.7",
		date: "2015-08-07",
		features: [
			"Remove OSM remotes maps links on activities",
			"Add flyby link in dashboard feed",
			"Fix extended data compute error on Workouts",
		],
	}, {
		version: "0.7.6",
		date: "2015-07-20",
		features: [
			"Fix (again) Year progress sometimes not visible if strava language is not english (tazmanska credits).",
			"Segments time comparaison with KOM and previous PR inside activity page (tazmanska credits).",
		],
	}, {
		version: "0.7.5",
		date: "2015-07-02",
		features: [
			"Hotfix: Year progress sometimes not visible",
		],
	}, {
		version: "0.7.4",
		date: "2015-07-01",
		features: [
			"Year progressions to current month/day panel. See your progress for each beginning of year to current month and day. Go to My profile to see feature",
			"Veloviewer Segments Comparaison remote link into activities",
		],
	}, {
		version: "0.7.3",
		date: "2015-06-21",
		features: [
			"NEW extended data: Elevation stats, graph and table. Elevation zones customizable in settings.",
			"Bug fixes",
		],
	}, {
		version: "0.7.2",
		date: "2015-06-04",
		features: [
			"Improve weather accuracy",
		],
	}, {
		version: "0.7.1",
		date: "2015-05-29",
		features: [
			"Hotfix: Remove display stravistix chrome tab on update (http://thomaschampagne.github.io/stravistix)",
		],
	}, {
		version: "0.7.0",
		date: "2015-05-28",
		features: [
			"Added weather for cycling activities. Include wind, temp, clouds and humidity. Running coming soon.",
			"Added 75% speed/pace and average climbing speed to summary panel (under 'show extended statistics' button)",
		],
	}, {
		version: "0.6.4",
		date: "2015-05-20",
		features: [
			"Provide average speed climbing, flat, downhill for extended grade data",
			"New extended data summary panel in actitivies (below show extended statistics button)",
		],
	}, {
		version: "0.6.3",
		date: "2015-05-15",
		features: [
			"Bug fixes and improvements",
		],
	}, {
		version: "0.6.2",
		date: "2015-05-01",
		features: [
			"Exporting segment effort as Virtual Partner for your GPS through activity page.",
		],
	}, {
		version: "0.6.1",
		date: "2015-04-23",
		features: [
			"OpenStreetMap flipper for activities (from Veloviewer)",
		],
	}, {
		version: "0.6.0",
		date: "2015-04-15",
		features: [
			"Customized zones for each Xtended data",
			"Add TRIMP/Hour",
			"Change extension name from StravPlus to StravistiX",
			"Bugs fix",
		],
	}, {
		version: "0.5.5",
		date: "2015-03-27",
		features: [
			"New extended data: Grade %",
			"Running cadence for one or two legs (option)",
			"Fixed wrong TRIMP calculation. Using 'exp' instead of 'pow'...",
			"Fixed Rank=NaN% if athlete had no time in segment",
			"Fixed activity data load on manual activities",
			"Shop menu is always shown now",
			"Extended data graph title updated: units in minutes",
		],
	}, {
		version: "0.5.4",
		date: "2015-03-19",
		features: [
			"Runners can view avanced pace data",
			"Major bugs fixed from 0.5.3",
		],
	}, {
		version: "0.5.3",
		date: "2015-03-16",
		features: [
			"Fix clear cache on extension update/install. This caused extension crash when using old cache with new extension.",
			"Add export of your activities as TCX.",
		],
	}, {
		version: "0.5.2",
		date: "2015-03-15",
		features: [
			"HotFix for 0.5.1: some dependencies could not be loaded resulting in extension crash.",
		],
	}, {
		version: "0.5.1",
		date: "2015-03-15",
		features: [
			"Add extended stats for running",
			"Extended stats now includes: Speed, Power, HR and Cadence graph distribution + table result on 15 zones",
			"New extended stats panel design for running and cycling",
		],
	}, {
		version: "0.4.10",
		date: "2015-03-07",
		features: [
			"Add share extension links to twitter",
		],
	}, {
		version: "0.4.9",
		date: "2015-02-27",
		features: [
			"Add Segment Details remote link on segment page",
		],
	}, {
		version: "0.4.8",
		date: "2015-02-22",
		features: [
			"Add Surface Area of your activities (raceshape EREA)",
			"Normalized Power (TrainingPeaks trademarked term) removed. Profit to Weighted Power data now",
			"Intensity Factor (TrainingPeaks trademarked term) removed. Profit to Intensity data now",
			"Prepare better veloviewer.com integration (waiting for veloviewer.com side now...)",
			"Bugs fixes",
		],
	}, {
		version: "0.4.7",
		date: "2015-02-19",
		features: [
			"Inform runners about: Running Extended Data Features(like current cycling features) will be very soon available in version 0.5.x",
		],
	}, {
		version: "0.4.6",
		date: "2015-02-15",
		features: [
			"Activity flash code in activities for Strava mobile App",
			"Fix bug wheere miles displayed even if metrics chosen in activities",
		],
	}, {
		version: "0.4.5",
		date: "2015-02-08",
		features: [
			"Fast fix from version 0.4.4. Sry for this...",
		],
	}, {
		version: "0.4.4",
		date: "2015-02-08",
		features: [
			"Fix unable to remove FTP value in options page",
			"Improving code to save time later... Invisible on your screen :)",
		],
	}, {
		version: "0.4.3",
		date: "2015-01-29",
		features: [
			"Minor fixes",
		],
	}, {
		version: "0.4.2",
		date: "2015-01-29",
		features: [
			"Minor fixes",
		],
	}, {
		version: "0.4.1",
		date: "2015-01-28",
		features: [
			"Options GUI look better especially on checkboxes",
			"Minor fixes",
		],
	}, {
		version: "0.4.0",
		date: "2015-01-27",
		features: [
			"Heart Rate Reserve zones distribution now customizable",
			"New options UI made with angularjs and bootstrap",
			"Fix Unable to fetch athlete bike odo",
			"Others tiny fixes",
		],
	}, {
		version: "0.3.9",
		date: "2015-01-02",
		features: [
			"Fix kom-map to achievement-map",
		],
	}, {
		version: "0.3.8",
		date: "2014-12-16",
		features: [
			"Fix nearby segment icons away",
		],
	}, {
		version: "0.3.7",
		date: "2014-11-11",
		features: [
			"Add nearby cycling+running segments added on segment page",
			"Add average pace in cycling activities",
			"Add lower quartile power, median power and upper quartile power in cycling activities",
			"Fixed: Unable to see StravistiX icon menu when highlight option is on.",
		],
	}, {
		version: "0.3.6",
		date: "2014-11-07",
		features: [
			"Cadence/Cadence extended data is now computed while moving.",
			"Fix wrong Harmonized Power for riders with power meter.",
			"Others minor bug fixes",
		],
	}, {
		version: "0.3.2 to 0.3.5",
		date: "2014-11-02",
		features: [
			"Fixed display text glitches on some pages",
			"StravistiX menu icon orange",
			"Others minor bug fixes",
		],
	}, {
		version: "0.3.1",
		date: "2014-10-30",
		features: [
			"Big changes in extension core: Ext recoded from scratch in order to fix memory leaks from v0.2.0 and make new evolutions easier",
			"Bike activities extended data new look. Possibility to get the activity extended data panel hidden on load",
			"Cache management of bike Odo for bike activities, force refresh possible",
			"Fixing hide challenges and new routes which broken in new Strava.com update",
			"New StravistiX design",
			"Bug fixes",
		],
	}, {
		version: "0.2.0",
		date: null,
		features: [
			"Add TRIMP (TRaining IMPulse) value to cycling activities. The old stress score has been removed, not relevant any more now.",
			"Add Heart Rate Reserve (%HRR) value to cycling activities.",
			"Add Octo zones distribution of Heart Rate Reserve (%HRR) in minutes to cycling activities.",
			"Motivation score now become Toughness Factor",
			"Standard deviation bug fix of possible square root of negative variance...",
		],
	}, {
		version: "0.1.13",
		date: null,
		features: [
			"Add standard deviation speed data for cycling activities",
			"Add Cadence data for cycling activities: cadence %, cadence Time and crank revolutions. A cadence meter needed to get that",
		],
	}, {
		version: "0.1.12",
		date: null,
		features: [
			"Add Lower Quartile, Median and Upper Quartile speed data for cycling activities",
			"Add helpers when click on added data in cycling activities",
			"Add cache system to store analysis data in localStorage which may are long to be computed. The cache is reused when you reload an activity which has one.",
		],
	}, {
		version: "0.1.11",
		date: null,
		features: [
			"More Stable",
			"Prepare future for big features...",
		],
	}, {
		version: "0.1.10",
		date: null,
		features: [
			"Add Watts/KG for cycling activities",
			"Add VeloViewer Challenges Trophy Cabinet to StravistiX menu",
		],
	}, {
		version: "0.1.9",
		date: null,
		features: [
			"Bike odo on activities back",
			"Weighted Power calculation adjusted for cycling activities",
		],
	}, {
		version: "0.1.8",
		date: null,
		features: [
			"Add Estimated Weighted Power for cycling activities",
			"Add Estimated Variability Index for cycling activities",
			"Add Estimated Intensity for cycling activities",
			"Bug fixing",
		],
	}, {
		version: "0.1.7",
		date: null,
		features: [
			"Hide the challenges in dashboard feed",
			"Hide the created routes in dashboard feed",
			"Bug fixing",
			"Switch app name to 'StravistiX Developper Preview'",
		],
	}, {
		version: "0.1.6",
		date: null,
		features: [
			"Add this about page",
			"StravistiX placed first in header",
			"Add icons in StravistiX menu",
			"Remove StravistiX settings page popup when extension is updated",
			"Bug fixing",
		],
	}, {
		version: "0.1.5",
		date: null,
		features: [
			"Segment Rank percentage now working on all leaderboards (Clubs, following, ...)",
			"Add bike odo display or not as an option",
			"Come back to Strava Classic color style",
			"Add StravistiX features highlighted in bright orange as option (new miscellaneous section).",
		],
	}, {
		version: "0.1.4",
		date: null,
		features: [
			"Display bike odo on activity page",
			"Bugs fixing",
		],
	}, {
		version: "0.1.3",
		date: null,
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
		],
	}];
