[![Stories in Ready](https://badge.waffle.io/thomaschampagne/stravistix.png?label=ready&title=Ready)](http://waffle.io/thomaschampagne/stravistix)
[![Join the chat at https://gitter.im/thomaschampagne/stravistix](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/thomaschampagne/stravistix?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
1 /Install StravistiX from Chrome Store
==========
Go to http://thomaschampagne.github.io/stravistix/

2/ Install from sources
==========
<!-- **Requirements**
* You need [**node package manager and nodejs**](http://nodejs.org/) to fetch nodejs dependencies and distribute the extension.

* To develop, you must install nodejs dependencies before loading extension from **chrome://extensions** as a developer. View **Install extension dependencies** below step -->

### 2.1/ Install NodeJS with node package manager
You must run **npm** cli command via [nodejs.org](https://nodejs.org) to fetch JS dependencies.

### 2.2/ Install Gulp task runner via node package manager
Skip this step if you already have global **gulp-cli** on your computer.
```
npm install --global gulp-cli
```

### 2.3/ Install gulp plugins dependencies
```
npm install
```
This will install required gulp plugins in order to run project tasks. Gulp plugins are specified into **./package.json** file as **devDependencies**

### 2.4/ Build the project
```
gulp build
```
First, this will download others JS dependencies (underscore, angularjs, chart.js, ...) specified in **hook/extension/package.json** file if not already downloaded.

Next, all the extensions files from **hook/extension/** will be copied to **dist/** folder.

### 2.5/ Loading the extension

You can now load extension from **chrome://extensions** chrome tab:

* In chrome, open new tab and type **chrome://extensions** then enter
* Tick **Developer Mode** checkbox
* Click **Load Unpacked Extension** button, then choose **dist/** folder (this is where you have **manifest.json** file)
* Done !

3/ How to develop in ?
==========

### 3.1/ Making changes and view them

Development must be done inside **hook/extension/** folder.

In chrome, use **dist/** folder as Unpacked Extension for development

To apply files changes from **hook/extension/** to **dist/** you must run the build command:

```
gulp build
```

To save time, you can automatically copy files changes from **hook/extension/** to **dist/** using watch command:
```
gulp watch
```

### 3.2/ Create a release archive
```
gulp release
```
This will create zip archive of **dist/** folder in **release/StravistiX\_vX.X.X\_[date].zip**

### 3.3/ Clean the project
```
gulp clean
```
This will clean **dist/**, **release/** & **hook/extension/node_modules/** folders

4/ Code Editor and Indentation plugin used
==========
I used [**Atom**](https://atom.io/) editor with [**atom-beautify**](https://atom.io/packages/atom-beautify) plugin for code indentation.

[**My Atom plugin list ;)**](https://gist.github.com/thomaschampagne/fa8fa9615b2fac236ac3)
