[![Stories in Ready](https://badge.waffle.io/thomaschampagne/stravistix.png?label=ready&title=Ready)](http://waffle.io/thomaschampagne/stravistix)
[![Join the chat at https://gitter.im/thomaschampagne/stravistix](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/thomaschampagne/stravistix?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
Install StravistiX from Chrome Store
==========
Go to http://thomaschampagne.github.io/stravistix/

Install & develop from sources
==========
<!-- **Requirements**
* You need [**node package manager and nodejs**](http://nodejs.org/) to fetch nodejs dependencies and distribute the extension.

* To develop, you must install nodejs dependencies before loading extension from **chrome://extensions** as a developer. View **Install extension dependencies** below step -->

## Install NodeJS with node package manager
You must run **npm** cli command via [nodejs.org](https://nodejs.org) to fetch JS dependencies.

## Install Gulp task runner via node package manager
Skip this step if you already have global **gulp-cli** on your computer.
```
npm install --global gulp-cli
```

## Install gulp plugins dependencies
```
npm install
```
This will install required gulp plugins in order to run project tasks. Gulp plugins are specified into **./package.json** file as **devDependencies**

## Build the project
```
gulp build
```
First, this will download others JS dependencies (underscore, angularjs, chart.js, ...) specified in **hook/extension/package.json** file if not already downloaded.

Next, all the extensions files from **hook/extension/** will be copied to **dist/** folder.

## Loading the extension

You can now load extension from **chrome://extensions** chrome tab:

* In chrome, open new tab and type **chrome://extensions** then enter
* Tick **Developer Mode** checkbox
* Click **Load Unpacked Extension** button, then choose **dist/** folder (this is where you have **manifest.json** file)
* Done !

# How to develop in ?

* Development must be done inside **hook/extension/** folder.
* In chrome, use **dist/** folder as Unpacked Extension.
* To apply files changes done in **hook/extension/** to **dist/** you must run the build command:

```
gulp build
```

To save time, you can automatically copy files changes from **hook/extension/** to **dist/** using watch command:
```
gulp watch
```

## Create release archive
```
gulp release
```
This will create zip archive of **dist/** folder in **release/StravistiX\_vX.X.X\_[date].zip**

## Clean
```
gulp clean
```
This will clean dist/, release/ & hook/extension/node_modules/ folders

## Code Editor and Indentation plugin used
[**Atom**](https://atom.io/) code editor with [**atom-beautify**](https://atom.io/packages/atom-beautify) plugin for indentation have been used in this project
