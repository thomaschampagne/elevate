Install StravaPlus from Chrome Store
==========
Go to http://bitly.com/stravaplus

Install/Develop from sources
==========
**Requirements**

You need [**node package manager and nodejs**](http://nodejs.org/) 

#Install extension dependencies
-------------
```
node make.js init
```
This will download required node modules

## Create distribution folder 
```
node make.js dist
```
This will create folder **dist/**, this is folder user before a release

## Create archive package 
```
node make.js build
```
This will create archive in **builds/StravaPlus\_vX.X.X\_[date].zip**

## Clean 
```
node make.js clean
```
This will clean builds/, dist/ and node_modules/ folders
