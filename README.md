[![Stories in Ready](https://badge.waffle.io/thomaschampagne/stravistix.png?label=ready&title=Ready)](http://waffle.io/thomaschampagne/stravistix)
[![Join the chat at https://gitter.im/thomaschampagne/stravistix](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/thomaschampagne/stravistix?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
Install StravistiX from Chrome Store
==========
Go to http://bitly.com/stravistix

Install/Develop from sources
==========
**Requirements**
* You need [**node package manager and nodejs**](http://nodejs.org/) to fetch nodejs dependencies and distribute the extension.

* To develop, you must initialize nodejs dependencies before loading extension from **chrome://extensions** as a developer. View **Install extension dependencies** below step

## Install extension dependencies
```
node make.js init
```
This will download required node modules. Development must be done inside **hook/extension/** folder.
You can now load extension from **chrome://extensions** chrome tab:

* Open new tab and type **chrome://extensions** then enter
* Tick **Developer Mode** checkbox
* Click **Load Unpacked Extension** button, then choose **hook/extension/** folder (this is where you have **manifest.json** file)
* You can develop in !

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
