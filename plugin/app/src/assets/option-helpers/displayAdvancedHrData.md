## Before reading
---
You have to record inside strava activities your heart rate data through HR sensor to enjoy the below features.  

## TRaining IMPulse or TRIMP 💗
---

Represents the amount of heart stress during an activity. The longer you ride at full throttle, the more you SCORE !! So go outside suffer for twelve hours! Or stay here to understand what it returns... _TRIMP_ is a way to model the human athletic performance. This concept has been introduced by Dr Eric Banister.  

Ok, Cool... But how this works?!  

StravistiX computes _TRIMP_ on activities using the most sophisticated approach: _TRIMP Exponental Heart Rate Scaling_ which use your _Heart Rate Reserve or HRR_. _HRR_ is basically your heart effort level according to your heart capacity .  

What are all these terms?! Don't panic... Here is an explanation from a Math view (you may hate that, sorry...).  

> $Training Impulse = \displaystyle\sum_{t=0_{min}}^t{\delta t~\times~HRR~\times~0.64^{k~\times~HRR}}$

> $where~~k=1.92~~(for~mens)~~~or~~~k=1.67~~(for~womens)$  

With _HRR = Heart Rate Reserve = Heart effort level according to heart capacity_ defined by  

> $HRR=\frac{HR~-~HR_{rest}}{HR_{max}~-~HR_{rest}}$

According this _TRIMP Exponental Heart Rate Scaling_ formula, the longer you ride at full throttle, the more you SCORE !  

But this heart score seems to be _Strava Suffer Score_?! Not really... _Strava Suffer Score_ is only inspired by the TRIMP concept. However the idea is same and both score are correlated.  

Need more infos? Then read more about HRR here: _http://fellrnr.com/wiki/Heart_Rate_Reserve_ and TRIMP here: _http://fellrnr.com/wiki/TRIMP_ 

## %Heart Rate Reserve Average
---

Represents the stress level reached during an activity according to your heart capacity. 
As mentionned into _TRaining IMPulse or TRIMP_ explanation section, Heart Rate Reserve is basically a heart effort level according to a heart capacity:  

> $HRR=\frac{HR~-~HR_{rest}}{HR_{max}~-~HR_{rest}}$

This indicator is scaled on a complete activity, then average heart rate participates to the party.  

Consequently _%Heart Rate Reserve Average_ is defined by  

> $\%HRR_{average}=\frac{HR_{average}~-~HR_{rest}}{HR_{max}~-~HR_{rest}}~\times~100$

If you rode with a %HRR Avg of 100% this seems you were at full capacity of your heart during the whole activity. It's impossible... But try to get the higher percentage ;) You will get a better _TRIMP_ score in the same way.  

## Quartiles and median
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
