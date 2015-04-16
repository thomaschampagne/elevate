***************************************************************************************************************************
_StraTistiX_  is my fork based on Thomas Champagne's StravistiX Strava Chrome Plugin.
I add/change some functionalities that are based on my ideas and preferences that suit me; they might or might not suit You and/or Thomas. I also try to fix bugs found and might also introduce some new :)
I developed and designed aRPEe Score concept. It is based on lots of my workouts and mostly seems to  acurately describe how hard my workouts were.
I'll try to merge new stuff from his base repository into this; anyone can also take anything from my repository and use it freely; if using aRPEe Score, please just link to this repository; most kudos for this plugin go to Thomas Champagne!!!

Dejan Kamenšek, sLOVEnia
***************************************************************************************************************************


[![Stories in Ready](https://badge.waffle.io/thomaschampagne/stravistix.png?label=ready&title=Ready)](http://waffle.io/thomaschampagne/stravistix)
Install StravistiX from Chrome Store
==========
Go to http://bitly.com/stravistix

Install/Develop from sources
==========
**Requirements**
You need [**node package manager and nodejs**](http://nodejs.org/) 

## Install extension dependencies
```
node make.js init
```
This will download required node modules. Development must be done inside **hook/extension/** folder.

## Create distribution folder 
```
node make.js dist
```
This will create **dist/** folder. This folder is used for a release.

## Create archive package 
```
node make.js build
```
This will create zip archive of **dist/** folder in **builds/StravistiX\_vX.X.X\_[date].zip**

## Clean 
```
node make.js clean
```
This will clean builds/, dist/ and node_modules/ folders
