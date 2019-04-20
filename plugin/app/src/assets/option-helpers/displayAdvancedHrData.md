_Note: You have to wear an heart rate monitor to provide heart rate data to your strava activities and thus enjoy the below features._  

# Average Heart Rate Reserve
---

Represents the stress level reached during an activity according to your heart capacity. _Heart Rate Reserve_ is basically a heart effort level according to a heart capacity defined by:  

> $HRR=\frac{HR~-~HR_{rest}}{HR_{max}~-~HR_{rest}}$

_Average HRR_ indicator is scaled on a complete activity, so average heart rate participates to the party.  

Consequently _Average Heart Rate Reserve_ is defined by  

> $\%HRR_{average}=\frac{HR_{average}~-~HR_{rest}}{HR_{max}~-~HR_{rest}}~\times~100$

If you performed a workout with a _HRR_ of 100%, this seems you were at full capacity of your heart during the whole activity. It's impossible... But try to get the higher percentage ;) You will get a better _HRSS_ & _TRIMP_ score in the same way.  

# TRaining IMPulse (TRIMP)
---
_TRIMP_ has been developed by Dr Eric Banister as a method to quantify training load. _TRIMP_ takes into consideration the duration of exercise and the intensity of 
exercise as calculated by the _Heart Rate Reserve (HRR)_ method (explained in upper section). It also provides a good indicator to compare commitment between activities. _TRIMP_ has 
same goal than _Strava Suffer Score_ and both scores are correlated.

_TRIMP_ is mathematically defined by:  

> $Training Impulse = \displaystyle\sum_{t=0_{min}}^t{\delta t~\times~HRR~\times~0.64~\times~e^{k~\times~HRR}}$

> $where~~k=1.92~~(for~mens)~~~or~~~k=1.67~~(for~womens)$ 

_TRIMP_ is not scaled with _Heart Rate Stress Score (HRSS)_ described in the next section. Scores are correlated but you can't compare them together.

_TRIMP_ is correlated to _Strava Suffer Score_.

# Heart Rate Stress Score (HRSS)
---
_HRSS_ also represents a training load based on your heart rate activity. It is based on _TRIMP_ behind. 
That's why HRSS depends also on exercise duration and intensity.

The major difference with _TRIMP_ is that _HRSS_ is based on athlete's _Lactate Threshold Heart Rate (LTHR)_. _LTHR_ is the point, above which, 
increased blood acidification occurs in your body. Above this threshold your endurance performance will rapidly decrease. 
Basically it's the latest best average heart rate you can maintain for up to an hour. You can setup your own LTHR in athlete settings.

_HRSS_ is mathematically defined by:  

> $HRSS = \frac{Activity~Trimp}{OneHourTrimp@LTHR}~\times~100~~~where~~~OneHourTrimp@LTHR = 60min~\times~HRR@LTHR~\times~0.64^{k~\times~HRR@LTHR}$

> $And~~HRR@LTHR = \frac{LTHR~-~HR_{rest}}{HR_{max}~-~HR_{rest}}~~and~~k=1.92~~for~mens~~or~~1.67~~for~womens$

_HRSS_ is not scaled with _TRaining IMPulse (TRIMP)_ described in the previous section. Scores are correlated but you can't compare them together.

_HRSS_ is close to [_HrTSS&reg;_ from TrainingPeaks&trade;](https://help.trainingpeaks.com/hc/en-us/articles/204071944-Training-Stress-Scores-TSS-Explained) and is correlated to _Strava Suffer Score_.

# Quartiles and median
---

For understanding these indicators, we assume that 0% to 100% are all the heart rates sorted ascending you obtained during an activity.
  
- 25% Quartile: This indicator represents the heart rate you maintained at the position "25%". This is commonly called "Lower quartile" or Q1.  
- 50% Median: This indicator represents the heart rate you maintained at the position "50%". It's simply the median...  
- 75% Quartile: This indicator represents the heart rate you maintained at the position "75%". This is commonly called "Upper quartile" or Q3.  

_These indicators can be more meaning full than average heart rate itself to analyse activity heart rate. 
For example, you upload an activity in which you ride pretty fast for a long time. 
Then, you expect to have a good average heart rate. 
Unfortunately, you have to go through the city to go home where many red lights and cars behavior slow you down. 
Your average heart rate then drops very quickly and do not highlight your effort of "riding fast". In this example, the 75% quartile heart rate is representative of the effort you made 
(eliminating low heart rate associated with the cross of the city)._  

Understand lower quartile, median and upper quartile here: _http://en.wikipedia.org/wiki/Quartile_
