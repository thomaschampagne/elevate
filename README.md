[![Stories in Ready](https://badge.waffle.io/thomaschampagne/stravaplus.png?label=ready&title=Ready)](http://waffle.io/thomaschampagne/stravaplus)
Install StravaPlus from Chrome Store
==========
Go to http://bitly.com/stravaplus

Install/Develop from sources
==========
**Requirements**
You need [**node package manager and nodejs**](http://nodejs.org/) 

## Install extension dependencies
```
node make.js init
```
This will download required node modules

## Create distribution folder 
```
node make.js dist
```
This will create **dist/** folder. He is used for a release.

## Create archive package 
```
node make.js build
```
This will create zip archive of **dist/** folder in **builds/StravaPlus\_vX.X.X\_[date].zip**

## Clean 
```
node make.js clean
```
This will clean builds/, dist/ and node_modules/ folders
