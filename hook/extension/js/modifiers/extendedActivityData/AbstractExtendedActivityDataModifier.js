var AbstractExtendedActivityDataModifier = Fiber.extend(function(base) {

    return {

        content: '',

        isAuthorOfViewedActivity: null,

        dataViews: [],

        init: function(analysisData, appResources, userSettings, athleteId, athleteIdAuthorOfActivity) {

            this.analysisData_ = analysisData;
            this.appResources_ = appResources;
            this.userSettings_ = userSettings;
            this.athleteId_ = athleteId;
            this.athleteIdAuthorOfActivity_ = athleteIdAuthorOfActivity;

            this.isAuthorOfViewedActivity = (this.athleteIdAuthorOfActivity_ == this.athleteId_);

            this.setDataViewsNeeded();
        },


        modify: function() {
            
            _.each(this.dataViews, function(view) {
                // Append result of view.render() to this.content
                view.render();
                this.content += view.getContent();
            }.bind(this));

            // Add Show extended statistics to page
            this.placeExtendedStatsButton(function() {
                // Button has been placed...
            });

        },

        placeExtendedStatsButton: function(buttonAdded) {

//            var htmlButton = '<section>';
//            var htmlButton = '<div>';
//            htmlButton += '<a class="button btn-block btn-primary" id="extendedStatsButton" href="#">';
//            htmlButton += '<a id="extendedStatsButton" href="#">';
//            htmlButton += 'Show extended statistics';




										// print HIGHLIGHTED STATS under inline-stats section
                    var html = '<div style="font-size: 15px; padding: 10px 0px 10px 0px;" id="histats">';

									if (this.analysisData_.heartRateData != null) {
										HRnotice = "\n\n* Depends on appropriate user MaxHR ("+this.analysisData_.heartRateData.MaxHr+") and RestHR ("+this.analysisData_.heartRateData.RestHr+") settings!!!";
										
                    html += '<span style="color: rgb(200, 80, 80);font-size: 18px;" title="TRIMP = TRaining IMPulse'+HRnotice+'">';
                    html += ' TRIMP: <strong>'+this.analysisData_.heartRateData.TRIMP.toFixed(0)+'</strong></span>';
                    
								 	if (this.analysisData_.toughnessScore != null) {
                    	html += '<span style="font-size: 18px;" title="TS = Toughness Score = sqrt( sqrt( elevation^2 * avgPower * avgSpeed^2 * distance^2 * moveRatio ) ) /20"><font size=-2>&nbsp&nbsp&nbsp&nbsp&nbspToughness Score: </font><font size=-1><strong>'+this.analysisData_.toughnessScore.toFixed(0)+'</strong></font></span>';
								 	}

                    html += '<br><span style="color: rgb(150, 50, 50); font-size: 18px;" title="Effort estimate ~ TRIMP/hour ~ RPE\n\n [RPE <1] =< 50  Sure this was a Workout?!\n [RPE 1-2] \>  50  Easy-Recovery\n [RPE 3]    \>  100  Lower Medium\n [RPE 4]    \>  117  Medium\n [RPE 5]    \>  133  Upper Medium\n [RPE 6]    \>  150  Hard\n [RPE 7]    \>  175  Very Hard\n [RPE 8]    \>  200  Extremely Hard\n [RPE 9]    \>  225  Hard as Hell!\n [RPE 9+]  \> 250  How could You survive this?!?'+HRnotice+'">';       '">';
                    html += '| <strong>'+this.analysisData_.heartRateData.TRIMP_hr.toFixed(0)+'</strong> / hour |';
                    html += '&nbsp<strong><font size=-1">';

                    if (this.analysisData_.heartRateData.TRIMP_hr <= 50) {       	html+='<font style="color: rgb(80,120,80);" Sure this was a Workout?! [RPE <1]';
                    } else if (this.analysisData_.heartRateData.TRIMP_hr <= 100) {	html+=' Easy-Recovery';
                    } else if (this.analysisData_.heartRateData.TRIMP_hr <= 117) {	html+=' Lower Medium';
                    } else if (this.analysisData_.heartRateData.TRIMP_hr <= 133) {	html+=' Medium';
                    } else if (this.analysisData_.heartRateData.TRIMP_hr <= 150) {	html+=' Upper Medium';
                    } else if (this.analysisData_.heartRateData.TRIMP_hr <= 175) {	html+=' Hard';
                    } else if (this.analysisData_.heartRateData.TRIMP_hr <= 200) {	html+=' Very Hard';
                    } else if (this.analysisData_.heartRateData.TRIMP_hr <= 225) {	html+=' Extremely Hard';
                    } else if (this.analysisData_.heartRateData.TRIMP_hr <= 250) {	html+=' Hard as Hell!';
                    } else if (this.analysisData_.heartRateData.TRIMP_hr > 250){	html+=' How could You survive This?!?';
                    }
                    
                    html+='</font></font></strong></span></div>';

									 	
                    $('.inline-stats.section').first().after(html);
                  };



		if (this.analysisData_.heartRateData.TRIMP_hr) {

									// prepair RPE gauge

									html = '<div id="RPE" style="margin:0px;" title="RPE 1-10 (Rated Perceived Exertion) Estimate'+HRnotice+'">';
									html += '<div id="RPEgauge"><div id="RPEtxt"></div></div></div><div id="RPElin"></div>';
									html += '<style>';
									html += '#RPE {height: 6px;position: relative;margin: 10px;border: 2px solid #333;padding: 0px;background: linear-gradient(to right, #77E, green, yellow, orange, #B33, #F00);border-radius: 2px;box-shadow: 1px 1px 1px #888;}';
									html += '#RPEgauge {position: relative;top: -5px;width: 0px;height: 0px;border-left: 0px solid transparent;border-right: 8px solid transparent;border-top: 12px solid #A22;box-shadow: 0px 0px 0px rgba(0, 0, 0, 0.100);}';
									html += '#RPEtxt {color: #000000;text-align:center;font-family: sans-serif;font-size: 9px;font-weight: bold;position: relative;left: 0px;top: -25Px;}';
									html += '#RPElin {height: 2px;position: relative;top: -6px;left: 2px;background: #C00;}';
									html += '</style>';
                 $('.inline-stats.section').first().next().after(html);

function myRPE(val,full,wid){
    document.getElementById("RPE").style.width=wid+1+'px';
    var perc=Math.round((val*100)/full);
    document.getElementById("RPEgauge").style.left=perc+'%';
    document.getElementById("RPEtxt").innerHTML=Math.round(perc,1)/10;
    document.getElementById("RPEtxt").style.left=5-Math.round(getTextWidth(document.getElementById("RPEtxt").innerHTML, "8.5pt sans-serif")/2)+'px';
    document.getElementById("RPElin").style.width=document.getElementById("RPE").style.width.slice(0,-2)*val/full+'px';
//console.log(getTextWidth(document.getElementById("RPEtxt").innerHTML, "6.5pt sans-serif"))
}

function getTextWidth(text, font) {
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
};

									// insert RPE gauge

									myRPE(this.analysisData_.heartRateData.TRIMP_hr,250,90);
		}




	html = '<div><a title="Click to show extended statistics" id="extendedStatsButton" href="#">';
                    html += '<style>.statsplus td {text-align:center; border: 0px 0px 0px 1px; padding: 1px;}</style>';
                    html += '<table class="statsplus" style="margin: 0px; width:100%;">';
                    html += '<tr style="color: rgb(30, 30, 30)"><td>Move Ratio<br><strong>'+this.analysisData_.moveRatio.toFixed(2)+'</strong></td>';
                    html += '<td>Real<br>Average</td><td>Lower Quart<br>Q25%</td><td>Median<br>Q50%</td><td>Upper Quart<br>Q75%</td></tr>';
									if (this.analysisData_.heartRateData != null) {
                    html += '<tr style="color: rgb(240, 40, 60)"><td>HRR <strong>'+this.analysisData_.heartRateData.activityHeartRateReserve.toFixed(0)+'</strong>%</td>';
                    html += '<td><strong>'+this.analysisData_.heartRateData.averageHeartRate.toFixed(0)+'</strong>bpm</td>';
                    html += '<td><strong>'+this.analysisData_.heartRateData.lowerQuartileHeartRate.toFixed(0)+'</strong>bpm</td>';
                    html += '<td><strong>'+this.analysisData_.heartRateData.medianHeartRate.toFixed(0)+'</strong>bpm</td>';
                    html += '<td><strong>'+this.analysisData_.heartRateData.upperQuartileHeartRate.toFixed(0)+'</strong>bpm</td></tr>';
                  }
									if (this.analysisData_.gradeData != null && !(this.analysisData_.gradeData.lowerQuartileGrade == 0 && this.analysisData_.gradeData.upperQuartileGrade == 0)) {
                    html += '<tr style="color: rgb(20,120,20)"><td><strong>'+this.analysisData_.gradeData.gradeProfile+'</strong> Grade</td>';
                    html += '<td><strong>'+this.analysisData_.gradeData.avgGrade.toFixed(1)+'</strong>%</td>';
                    html += '<td><strong>'+this.analysisData_.gradeData.lowerQuartileGrade.toFixed(1)+'</strong>%</td>';
                    html += '<td><strong>'+this.analysisData_.gradeData.medianGrade.toFixed(1)+'</strong>%</td>';
                    html += '<td><strong>'+this.analysisData_.gradeData.upperQuartileGrade.toFixed(1)+'</strong>%</td></tr>';
                  }
									if (this.analysisData_.speedData != null) {
                    html += '<tr style="color: rgb(60,155, 200)"><td>Speed [km/h]</td>';
                    html += '<td><strong>'+(3600*window.distance/window.elapsedTime).toFixed(1)+'</strong></td>';
                    html += '<td><strong>'+this.analysisData_.speedData.lowerQuartileSpeed.toFixed(1)+'</strong></td>';
                    html += '<td><strong>'+this.analysisData_.speedData.medianSpeed.toFixed(1)+'<br>'+'</strong></td>';
                    html += '<td><strong>'+this.analysisData_.speedData.upperQuartileSpeed.toFixed(1)+'</strong></td></tr>';
                    html += '<tr style="color: rgb(60,155,200)"><td>Pace [min/km]</td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((window.elapsedTime/window.distance).toFixed(0)).replace('00:','')+'</strong></td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((3600/this.analysisData_.speedData.lowerQuartileSpeed).toFixed(0)).replace('00:','')+'</strong></td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((3600/this.analysisData_.speedData.medianSpeed).toFixed(0)).replace('00:','')+'</strong></td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((3600/this.analysisData_.speedData.upperQuartileSpeed).toFixed(0)).replace('00:','')+'</strong></td></tr>';
									}
                    html += '</table></a></div>';

                $('.details').first().after(html).each(function() {

                $('#extendedStatsButton').click(function() {

                    $.fancybox({
                        'width': '100%',
                        'height': '100%',
                        'autoScale': true,
                        'transitionIn': 'fade',
                        'transitionOut': 'fade',
                        'type': 'iframe',
                        'content': '<div class="stravaPlusExtendedData">' + this.content + '</div>'
                    });

                    // For each view start making the assossiated graphs
                    _.each(this.dataViews, function(view) {
                        view.displayGraph();
                    }.bind(this));


                }.bind(this));

                if (buttonAdded) buttonAdded();

            }.bind(this));
        },

        /**
         * Affect default view needed
         */
        setDataViewsNeeded: function() {

            // By default we have... If data exist of course...

            // Featured view
            if (this.analysisData_) {
                var featuredDataView = new FeaturedDataView(this.analysisData_, this.userSettings_);
                featuredDataView.setAppResources(this.appResources_);
                featuredDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(featuredDataView);
            }

            // Heart view
            if (this.analysisData_.heartRateData && this.userSettings_.displayAdvancedHrData) {
                var heartRateDataView = new HeartRateDataView(this.analysisData_.heartRateData, 'hrr', this.userSettings_);
                heartRateDataView.setAppResources(this.appResources_);
                heartRateDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
                this.dataViews.push(heartRateDataView);
            }
        }
    }
});
