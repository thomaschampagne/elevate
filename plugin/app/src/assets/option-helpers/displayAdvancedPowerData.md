## Weighted Power & Estimated Weighted Power
---

Note: If you own a power meter, the true weighted power will be of course computed. Estimated Weighted Power is only a estimation for cyclist who don't have this sensor.  

The _Estimated Weighted Power_ is basically the _Estimated Average Power_ given by Strava which has been normalized... Weighted Power or estimated is more meaningfull than _Average Power_. Why? While average power simply takes all of the samples of power and divides them by the number of samples, _Weighted Power_ uses a tricky weighting system to come up with a number that is more in line with the true physiological effort for your given activity.  

_Weighted Power_ is basically the power that you could have maintained for the same physiological "cost" if your power output had been constant.  

_Weighted Power_ is calculated from an algorithm introduced by Dr. Andy Coggan to weight this variability according to its physiological difficulty. Here's the formula:  

> $WeightedPower = \sqrt{\sqrt{\sum(powerSample^4/count(powerSample))}}$

Remember that _Estimated Weighted Power_ is an estimation because it's based on _Estimated Average Power_ !  

## Variability Index:
---
_Variability Index_ is an indication of how your activity was paced. This indication shows how smooth or evenly paced the power output was during a race or work out. Basically _Variability Index_ is _Weighted Power_ over _Average watts_:  

> $VariabilityIndex=\frac{WeigthedPower}{Averagewatts}$

## Intensity:
---
Although _Weighted Power_ is a better measure of training _intensity_ than average power, it does not take into account differences in fitness within or between individuals.
_Intensity_ is simply the ratio of the _Weighted Power_ as above over your Functional Threshold Power (FTP) (entered in athlete settings):.  

> $Intensity=\frac{WeigthedPower}{Cycling FTP}$

For example, if your _Weighted Power_ for a long training ride done early in the year is 210 W and your threshold power at the time is 280 W, then the PF for that workout would be 0.75\. However, if you did that same exact ride later in the year after your threshold power had risen to 300 W, then the PF would be lower, i.e., 0.70. _Intensity_ therefore provides a valid and convenient way of comparing the relative _intensity_ of a training session or race either within or between riders, taking into account changes or differences in threshold power.  

Typical _Intensity_ values for various training sessions or races are as follows:  

Less than 0.75 are recovery rides  

- 0.75-0.85 endurance-paced training rides
- 0.85-0.95 tempo rides, aerobic and anaerobic interval workouts (work and rest periods combined), longer (>2.5 h) road races
- 0.95-1.05 lactate threshold intervals (work period only), shorter (<2.5 h) road races, criteriums, circuit races, longer (e.g., 40 km) Tts
- 1.05-1.15 shorter (e.g., 15 km) TTs, track points race

Greater than 1.15 prologue TT, track pursuit, track miss-and-o;

## Power Stress Score
---
If you own a cycling power meter then you get get the "Power Stress Score (PSS)" into your cycling activities. PSS formula is:  

> $Power Stress Score (PSS)=\frac{EffortInSeconds~\times~WeigthedPower~\times~Intensity}{Cycling FTP~\times~3600}~\times~100$  

_Note: PSS is equivalent to Training Stress Score&reg; (TSS&reg;) from TrainingPeaks&trade;. Learn more @ https://www.trainingpeaks.com/blog/what-is-tss/_

## Average Watts / Kg:
---
"Average Watts / Kg" is basically the power per Kilogram you maintained during an activity  

That's simply your _Average Power_ over your weight.  

## Weighted Watts / Kg
---
"Weighted Watts / Kg" is basically an estimation of the power per Kilogram that you could have maintained for the same physiological "cost" if your power output had been constant  

That's simply your _Weighted Power_ over your weight.  

## Quartiles and median
---

For understanding these indicators, we assume that 0% to 100% are all the heart rates sorted ascending you obtained during an activity.  

- 25% Quartile: This indicator represents the power you maintained at the position "25%". This is commonly called "Lower quartile" or Q1.  
- 50% Median: This indicator represents the power you maintained at the position "50%". It's simply the median...  
- 75% Quartile: This indicator represents the power you maintained at the position "75%". This is commonly called "Upper quartile" or Q3.  

_These indicators can be more meaning full than average power itself to 
analyse activity power. For example, you upload an activity in which you 
ride pretty fast for a long time. Then, you expect to have a good average power. 
Unfortunately, you have to go through the city to go home where many red lights 
and cars behavior slow you down. Your average power then drops very quickly and 
do not highlight your effort of "riding with power". In this example, the 75% quartile power 
is representative of the effort you made (eliminating low power associated with the cross of the city)._

Understand lower quartile, median and upper quartile here: _http://en.wikipedia.org/wiki/Quartile_
