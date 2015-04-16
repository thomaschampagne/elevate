***************************************************************************************************************************
_StraTistiX_  is my fork based on Thomas Champagne's StravistiX.
I add/change some functionalities that are based on my ideas and preferences that suit me; might or might not suit You and/or Thomas. I'll try to merge new stuff from his base repository into this; most kudos for this plugin go to Thomas Champagne!

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
