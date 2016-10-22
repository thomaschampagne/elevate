[![Stories in Ready](https://badge.waffle.io/thomaschampagne/stravistix.png?label=ready&title=Ready)](http://waffle.io/thomaschampagne/stravistix)
[![Join the chat at https://gitter.im/thomaschampagne/stravistix](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/thomaschampagne/stravistix?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

1/ Install StravistiX from Chrome / Opera Store
=====================================================
Go to http://thomaschampagne.github.io/stravistix/

2/ Install from sources
==========

### 2.0/ Infos
StravistiX is using bellow frameworks/libs/tools:

* Node package manager (npm) provided by [nodejs.org](https://nodejs.org) to fetch modules from [npmjs.com](https://www.npmjs.com/).
* [Gulp](http://gulpjs.com/) task runner.
* [Chart.js](http://www.chartjs.org/) Simple yet flexible JavaScript charting.
* [underscore.js](http://underscorejs.org/) that provides a whole mess of useful functional programming helpers.
* [AngularJS 1.*](https://angularjs.org/) for options page.
* [Angular Material](https://material.angularjs.org) design 1.* for options page.
* [TypeScript](https://www.typescriptlang.org) that adds typing & class-based syntax over javascript then compile back to JavaScript (ES5/ES2015/ES6).

**[Learn TypeScript in 5 minutes](https://learnxinyminutes.com/docs/typescript/). Try it and buy it !**.

### 2.1/ Install NodeJS with node package manager
You must run **npm** cli command via [nodejs.org](https://nodejs.org) to fetch JS dependencies.

### 2.2/ Install Gulp task runner and TypeScript via node package manager
```
npm install --global gulp-cli typescript
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

Development must be done inside **hook/extension/** folder. You can code using TypeScript OR Javascript. But i strongly recommend you to use TypeScript.

>_Remember: [Here you can learn TypeScript in 5 minutes](https://learnxinyminutes.com/docs/typescript/)_
>_Most IDE support TypeScript through plugins (Atom, Sublime, WebStorm, VisualStudio code, ...) @see https://www.typescriptlang.org/_

In chrome, use **dist/** folder as Unpacked Extension for development

To apply files changes from **hook/extension/** to **dist/** you must run the build command:

```
gulp build
```

You can automatically execute this task on a file change from with:
```
gulp watch
```

### 3.2/ Create a package archive
```
gulp package
```
This will create zip archive of **dist/** folder in **package/StravistiX\_vX.X.X\_[date].zip**

### 3.3/ Clean the project
```
gulp clean
```
This will clean **dist/**, **package/** & **hook/extension/node_modules/** folders

4/ Git repository structure and GitFlow
==========
This project repository is fitted for **GitFlow** branches management workflow. Learn more @  http://nvie.com/posts/a-successful-git-branching-model/

5/ Code Editor and Indentation plugin used
==========
I used [**Atom**](https://atom.io/) editor with [**atom-typescript**](https://atom.io/packages/atom-typescript) and [**atom-beautify**](https://atom.io/packages/atom-beautify) plugin for code indentation.

_Others Atom plugin list i recommend: https://gist.github.com/thomaschampagne/fa8fa9615b2fac236ac3_
