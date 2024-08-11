_Note: Normalized Power®, Training Stress Score® & Intensity Factor® are TrainingPeaks® registered trademarks_

# Normalized Power® & Estimated Normalized Power®
---

Note: If you own a power meter, the true Normalized Power® will be of course computed. Estimated Normalized Power® is only a estimation for cyclist who don't have this sensor.  

The _Estimated Normalized Power®_ is basically the _Estimated Average Power_ given by Strava which has been normalized... Normalized Power® or estimated is more meaningful than _Average Power_. Why? While average power simply takes all of the samples of power and divides them by the number of samples, _Normalized Power®_ uses a tricky weighting system to come up with a number that is more in line with the true physiological effort for your given activity.  

_Normalized Power®_ is basically the power that you could have maintained for the same physiological "cost" if your power output had been constant.  

_Normalized Power®_ is calculated from an algorithm introduced by Dr. Andy Coggan to weight this variability according to its physiological difficulty. Here's the formula:  

> $NormalizedPower = \sqrt{\sqrt{\sum(powerSample^4/count(powerSample))}}$

Remember that _Estimated Normalized Power®_ is an estimation because it's based on _Estimated Average Power_ !  

# Variability Index:
---
_Variability Index_ is an indication of how your activity was paced. This indication shows how smooth or evenly paced the power output was during a race or work out. Basically _Variability Index_ is _Normalized Power®_ over _Average watts_:  

> $VariabilityIndex=\frac{NormalizedPower}{Averagewatts}$

# Functional Threshold Power (FTP)
---
Represents your best average power you can sustain for one hour. [Read threshold test protocol by British Cycling](https://www.britishcycling.org.uk/zuvvi/media/bc_files/sportivetrainingplans/THRESHOLD_TEST.pdf).

# Intensity Factor®:
---
Although _Normalized Power®_ is a better measure of training _Intensity Factor®_ than average power, it does not take into account differences in fitness within or between individuals.
_Intensity Factor®_ is simply the ratio of the _Normalized Power®_ as above over your Functional Threshold Power (FTP) (entered in athlete settings):.  

> $Intensity Factor=\frac{NormalizedPower}{Cycling FTP}$

For example, if your _Normalized Power®_ for a long training ride done early in the year is 210 W and your threshold power at the time is 280 W, then the PF for that workout would be 0.75\. However, if you did that same exact ride later in the year after your threshold power had risen to 300 W, then the PF would be lower, i.e., 0.70. _Intensity Factor®_ therefore provides a valid and convenient way of comparing the relative _Intensity Factor®_ of a training session or race either within or between riders, taking into account changes or differences in threshold power.  

Typical _Intensity Factor®_ values for various training sessions or races are as follows:  

Less than 0.75 are recovery rides  

- 0.75-0.85 endurance-paced training rides
- 0.85-0.95 tempo rides, aerobic and anaerobic interval workouts (work and rest periods combined), longer (>2.5 h) road races
- 0.95-1.05 lactate threshold intervals (work period only), shorter (<2.5 h) road races, criteriums, circuit races, longer (e.g., 40 km) Tts
- 1.05-1.15 shorter (e.g., 15 km) TTs, track points race

Greater than 1.15 prologue TT, track pursuit, track miss-and-o;

# Power Stress Score (aka Training Stress Score® (TSS®))
---
If you own a cycling power meter then you get get the "Power Stress Score (PSS)" into your cycling activities. PSS formula is:  

> $Power Stress Score (PSS)=\frac{EffortInSeconds~\times~NormalizedPower~\times~Intensity Factor}{Cycling FTP~\times~3600}~\times~100$  

Note that _PSS_ is equivalent to [_TSS&reg;_ from TrainingPeaks&trade;](https://help.trainingpeaks.com/hc/en-us/articles/204071944-Training-Stress-Scores-TSS-Explained)

# Average Watts / Kg:
---
"Average Watts / Kg" is basically the power per Kilogram you maintained during an activity  

That's simply your _Average Power_ over your weight.  

# Normalized Power® / Kg
---
"Normalized Power® / Kg" is basically an estimation of the power per Kilogram that you could have maintained for the same physiological "cost" if your power output had been constant  

That's simply your _Normalized Power®_ over your weight.  

# Efficiency Factor (EF)
---
Efficiency Factor (EF) is your "Normalized Power® (Input)/ Average Heart rate (Output)". Higher value means better aerobic fit.

# Quartiles and median
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
