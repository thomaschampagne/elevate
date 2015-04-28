***************************************************************************************************************************
__StraTistiX__  is my fork (https://github.com/KamensekD/StraTistiX) based on Thomas Champagne's __StravistiX__ Strava Chrome Plugin.
I add/change some goodies that are based on my ideas and preferences that suit me; they might or might not suit You and/or Thomas. I try to fix any bugs found and, of course, also might introduce some new :)
aRPEe Score concept was developed and designed by myself based on lots of my workouts; it mostly seems to acurately describe how hard my workouts were.
From time to time I'll try to merge interesting new stuff from Thomas's updates of his base repository; any developer can also freely take anything from my repository and use it in non-commercial manner; when using __aRPEe Score__, please link to this repository; most kudos for this plugin go to Thomas Champagne!

_Dejan Kamenšek, sLOVEnia_
***************************************************************************************************************************
If You're having trouble using sources from GitHub to install the plugin to Chrome, I made it available in Chrome Web Store:
https://chrome.google.com/webstore/detail/stratistix-with-arpee-sco/bilbbbdgdimchenccmooakpfomfajepd
***************************************************************************************************************************


Thomas's developement: [![Stories in Ready](https://badge.waffle.io/thomaschampagne/stravistix.png?label=ready&title=Ready)](http://waffle.io/thomaschampagne/stravistix)
Install StraTistiX from Chrome Store
==========
Go to https://chrome.google.com/webstore/detail/stratistix-with-arpee-sco/bilbbbdgdimchenccmooakpfomfajepd

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
This will create zip archive of **dist/** folder in **builds/StraTistiX\_vX.X.X\_[date].zip**

## Clean 
```
node make.js clean
```
This will clean builds/, dist/ and node_modules/ folders
