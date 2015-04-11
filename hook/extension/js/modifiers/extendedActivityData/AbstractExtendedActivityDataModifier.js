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
                    var html = '<div style="font-size: 15px; padding: 10px 0px 10px 0px; border-bottom: 0px; margin-bottom:4px;" id="histats">';

									if (this.analysisData_.heartRateData != null) {
										HRnote = "\n\n* Depends heavily on appropriate user MaxHR ("+this.analysisData_.heartRateData.MaxHr+") and RestHR ("+this.analysisData_.heartRateData.RestHr+") settings!!!";
										RPEnote1 = "\n   1\t[NIL]\tYou really consider THAT a Workout?!\n   2\t[R]\tRecovery\n   3\t[ER]\tEasy-Recovery\n   4\t[LM]\tLower Medium\n   5\t[M]\tMedium\n  5.5\t[UM]\tUpper Medium\n   6\t[H]\tHard\n   7\t[VH]\tVery Hard\n   8\t[EH]\tExtremely Hard\n   9\t[HaH]\tHard as Hell!\n   9+\t[DeaD]\tHave You really had survived THAT!?!";
										RPEnote2 = "\n** Might seem off for You, as RPE is very user perception dependent.";
										RPEnote3 = "\n*** aRPE = TRIMP/hr / n   (for Men n=25, for Women n=20)";
										
										html += '<span style="color: #800 ;font-size: 18px;" title="HR based TRIMP (TRaining IMPulse)\nEstimation of TOTAL Training Load of the Workout'+HRnote+'">';
                    html += ' TRIMP: <strong>'+this.analysisData_.heartRateData.TRIMP.toFixed(0)+'</strong></span>';
                    
                    html += '<span style="color: #800; font-size: 18px;" title="TRIMP/hour\nEstimation of Hourly AVERAGE Training Load of the Workout'+HRnote+'\n** Given the right HR settings, TRIMP/hr max for Men is 262 and for Women 204">';
                    html += ' | <strong>'+this.analysisData_.heartRateData.TRIMP_hr.toFixed(0)+'</strong>/hour';
                    html += '&nbsp</span>';

								 	if (this.analysisData_.toughnessScore != null) {
                    	html += '<span style="font-size: 18px;" title="Toughness Score (TS)\nTS = sqrt( sqrt( elevation^2 * avgPower * avgSpeed^2 * distance^2 * moveRatio ) ) /20">&nbsp&nbspToughness Score: <strong>'+this.analysisData_.toughnessScore.toFixed(0)+'</strong></span>';
								 	}
									 	
                    $('.inline-stats.section').first().after(html);
                  };



		if (this.analysisData_.heartRateData != null) {

									// prepair aRPEe gauge

									html = '<div id="RPE" style="margin-bottom:2px;" title="aRPEe [1-10+] Average RPE (Rated Perceived Exertion) Estimate\n'+RPEnote1+HRnote+RPEnote2+RPEnote3+'">';
									html += '<div id="RPEgauge"><div id="RPEgauge1"><div id="RPEtxt"></div></div></div><div id="RPElin"></div></div><font size=-3></font>';
									html += '<style>';
									html += '#RPE {height: 6px;position: relative;padding: 0px;border: 2px solid #333;background: linear-gradient(to right, #77E, green, yellow, orange, #F00, #C00, #900);border-radius: 2px;box-shadow: 1px 1px 1px #888;}';
									html += '#RPEgauge {position: relative;top: -4px;width: 0px;height: 0px;border-left: 0px solid transparent;border-right: 10px solid transparent;border-top: 11px solid #633; box-shadow: 0px 0px 0px rgba(0, 0, 0, 0.100);}';
									html += '#RPEgauge1 {position: relative;top: -9px;width: 0px;height: 0px;border-left: 0px solid transparent;border-right: 4px solid transparent;border-top: 5px solid #EEE;}';
									html += '#RPEtxt {position: relative;left: 0px;top: -20Px; color: #000000;text-align:center;font-family: sans-serif;font-size: 9px;font-weight: bold;}';
									html += '#RPElin {height: 3px;position: relative;top: -6px;left: 1px;background: #F00;}';
									html += '</style>';

				            // Add aRPEe to page
										var aRPEe=this.analysisData_.heartRateData.aRPEe;

                    html+= '<div style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">';
										html+='<font style="font-size: 10px;">aRPEe </font><font style="font-size: 14px;">';
//								aRPEe=1;
                    if (aRPEe >= 9.5){	html+='<font style="color: rgb(128,0,0);"[DeaD]</font> Have You really had survived THAT!?!';
                    } else if (aRPEe >= 8.5) {	html+='<font style="color: rgb(128,0,0);">[HaH]</font> Hard as Hell!';
                    } else if (aRPEe >= 7.5) {	html+='<font style="color: rgb(204,0,0);">[EH]</font> Extremely Hard';
                    } else if (aRPEe >= 6.5) {	html+='<font style="color: rgb(255,0,0);">[VH]</font> Very Hard';
                    } else if (aRPEe >= 5.8) {	html+='<font style="color: rgb(255,51,0);">[H]</font> Hard';
                    } else if (aRPEe >= 5.3) {	html+='<font style="color: rgb(255,153,0);">[UM]</font> Upper Medium';
                    } else if (aRPEe >= 4.5) {	html+='<font style="color: rgb(255,192,0);">[M\]</font> Medium';
                    } else if (aRPEe >= 3.5) {	html+='<font style="color: rgb(200,200,0);">[LM]</font> Lower Medium';
                    } else if (aRPEe >= 2.5) {	html+='<font style="color: rgb(146,208,80);">[ER]</font> Easy-Recovery';
                    } else if (aRPEe >= 1.5) {	html+='<font style="color: rgb(0,176,80);">[R]</font> Recovery';
                    } else {	html+='<font style="color: rgb(79,129,189);">[NIL]</font> You really consider THAT a Workout?!';
                    }
                    
                    html+='</font></strong></span>';

                 $('.inline-stats.section').first().next().after(html);

function myRPE(val,full,wid){
// *** for women use correction factor!!! MAX TRIM for man is 4.37/min (262/h) and for woman 3.4/min (204/h) !!!
    document.getElementById("RPE").style.width=wid+1+'px';
    var perc=Math.round((val*100)/full);
    document.getElementById("RPEgauge").style.left=perc+'%';
    document.getElementById("RPEgauge1").style.left=2+'px';
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

//									myRPE(this.analysisData_.heartRateData.TRIMP_hr,250,90);
									myRPE(aRPEe,10,180);
		}




	html = '<div><a title="Click to show extended statistics" id="extendedStatsButton" href="#">';
                    html += '<style>.statsplus td {text-align:center; border: 0px 0px 0px 1px; padding: 1px;}</style>';
                    html += '<table class="statsplus" style="margin: 0px; width:100%;">';
                    html += '<tr style="color: rgb(30, 30, 30)"><td>Move Ratio<br><strong>'+this.analysisData_.moveRatio.toFixed(2)+'</strong></td>';
                    html += '<td>Real<br>Average</td><td>Lower Quart<br>Q25%</td><td>Median<br>Q50%</td><td>Upper Quart<br>Q75%</td><td>max</td></tr>';
									if (this.analysisData_.heartRateData != null) {
                    html += '<tr style="color: rgb(240, 40, 60)"><td>HRR <strong>'+this.analysisData_.heartRateData.activityHeartRateReserve.toFixed(0)+'</strong>%</td>';
                    html += '<td><strong>'+this.analysisData_.heartRateData.averageHeartRate.toFixed(0)+'</strong>bpm</td>';
                    html += '<td><strong>'+this.analysisData_.heartRateData.lowerQuartileHeartRate.toFixed(0)+'</strong>bpm</td>';
                    html += '<td><strong>'+this.analysisData_.heartRateData.medianHeartRate.toFixed(0)+'</strong>bpm</td>';
                    html += '<td><strong>'+this.analysisData_.heartRateData.upperQuartileHeartRate.toFixed(0)+'</strong>bpm</td>';
                    html += '<td><strong>'+this.analysisData_.heartRateData.maxHeartRate.toFixed(0)+'</strong>bpm</td></tr>';
                  }
									if (this.analysisData_.gradeData != null && !(this.analysisData_.gradeData.lowerQuartileGrade == 0 && this.analysisData_.gradeData.upperQuartileGrade == 0)) {
                    html += '<tr style="color: rgb(20,120,20)"><td><strong>'+this.analysisData_.gradeData.gradeProfile+'</strong> Grade</td>';
                    html += '<td><strong>'+this.analysisData_.gradeData.avgGrade.toFixed(1)+'</strong>%</td>';
                    html += '<td><strong>'+this.analysisData_.gradeData.lowerQuartileGrade.toFixed(1)+'</strong>%</td>';
                    html += '<td><strong>'+this.analysisData_.gradeData.medianGrade.toFixed(1)+'</strong>%</td>';
                    html += '<td><strong>'+this.analysisData_.gradeData.upperQuartileGrade.toFixed(1)+'</strong>%</td>';
                    html += '<td><strong>'+this.analysisData_.gradeData.maxGrade.toFixed(1)+'</strong>%</td></tr>';
                  }
									if (this.analysisData_.speedData != null) {
                    html += '<tr style="color: rgb(60,155, 200)"><td>Speed [km/h]</td>';
                    html += '<td><strong>'+(3600*window.distance/window.elapsedTime).toFixed(1)+'</strong></td>';
                    html += '<td><strong>'+this.analysisData_.speedData.lowerQuartileSpeed.toFixed(1)+'</strong></td>';
                    html += '<td><strong>'+this.analysisData_.speedData.medianSpeed.toFixed(1)+'<br>'+'</strong></td>';
                    html += '<td><strong>'+this.analysisData_.speedData.upperQuartileSpeed.toFixed(1)+'</strong></td>';
                    html += '<td><strong>'+this.analysisData_.speedData.maxSpeed.toFixed(1)+'</strong></td></tr>';
                    html += '<tr style="color: rgb(60,155,200)"><td>Pace [min/km]</td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((window.elapsedTime/window.distance).toFixed(0)).replace('00:','')+'</strong></td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((3600/this.analysisData_.speedData.lowerQuartileSpeed).toFixed(0)).replace('00:','')+'</strong></td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((3600/this.analysisData_.speedData.medianSpeed).toFixed(0)).replace('00:','')+'</strong></td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((3600/this.analysisData_.speedData.upperQuartileSpeed).toFixed(0)).replace('00:','')+'</strong></td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((3600/this.analysisData_.speedData.maxSpeed).toFixed(0)).replace('00:','')+'</strong></td></tr>';
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
