[![Build Status](https://img.shields.io/travis/thomaschampagne/stravistix/develop.svg?label=unitTests@develop)](https://travis-ci.org/thomaschampagne/stravistix/branches)  [![AppVeyor branch](https://img.shields.io/appveyor/ci/thomaschampagne/stravistix/develop.svg?label=zip@develop)](https://ci.appveyor.com/project/thomaschampagne/stravistix/branch/develop/artifacts)

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/dhiaggccakkgdfcadnklkbljcgicpckn.svg)](https://chrome.google.com/webstore/detail/stravistix-for-strava/dhiaggccakkgdfcadnklkbljcgicpckn) [![Chrome Web Store](https://img.shields.io/chrome-web-store/stars/dhiaggccakkgdfcadnklkbljcgicpckn.svg)](https://chrome.google.com/webstore/detail/stravistix-for-strava/dhiaggccakkgdfcadnklkbljcgicpckn/reviews) [![Chrome Web Store](https://img.shields.io/chrome-web-store/rating-count/dhiaggccakkgdfcadnklkbljcgicpckn.svg)](https://chrome.google.com/webstore/detail/stravistix-for-strava/dhiaggccakkgdfcadnklkbljcgicpckn/reviews)

# Install StravistiX
## From a Chrome based browser

Go to [http://thomaschampagne.github.io/stravistix/](http://thomaschampagne.github.io/stravistix/)

You should be able to install it in all Chrome based browser such as Chrome, Chrome Canary, Chromium, Opera, Vivaldi, Yandex, and more ...

## From continuous integration
Using latest **develop** build: https://ci.appveyor.com/project/thomaschampagne/stravistix/branch/develop/artifacts

Install steps with a standalone build: https://github.com/thomaschampagne/stravistix/wiki/How-to-install-stravistix-build-archive

## From the sources

Go to chapter [Environnement setup](#environnement-setup).

# Development

## Project structure description

The project is splitted in 2 sub-projects: the _core_ and the _embedded app_.

### Core

The core contains the plugin's behaviour that acts directly on _strava.com_ website. This include _extended stats on activities & segments efforts, best splits, google maps support, etc..._

> The core sources are located in **plugin/core** directory

### Embedded app

The embedded app contains features like fitness trend, year progressions, ... and global plugin settings such as _common settings, athlete settings & zones settings._

> The embedded app sources are located in **plugin/app** directory

**Notice**: The **plugin/common** directory contains sources shared by both sub-projects.

## Description of frameworks & tools used.

_Core_ and _embedded app_ have been developed using [TypeScript](https://www.typescriptlang.org) language. TypeScript adds typing & class-based syntax over javascript then compile back to JavaScript. [Understand TypeScript in 5 minutes](https://learnxinyminutes.com/docs/typescript/).

### At a glance...

### Core dependencies
* [SystemJS](https://github.com/systemjs/systemjs) as dynamic EcmaScript module loader.
* [Q](http://documentup.com/kriskowal/q/) as promise library for JavaScript.
* [Chart.js](http://www.chartjs.org/) for JavaScript charting.


### Embedded app dependencies
* [Angular](https://angular.io/) as frontend framework
* [Angular Material](https://material.angular.io/) for material designed components.
* [Metrics Graphics](https://www.metricsgraphicsjs.org/) and [d3js](https://d3js.org/) for charting.

### Shared dependencies
* [Lodash](https://lodash.com) to get a whole mess of useful functional programming helpers in typescript/javascript.
* [MomentJS](https://momentjs.com/) to parse, validate, manipulate, and display dates and times.

### Tools

* [NodeJS](https://nodejs.org/en/) as javascript runtime environnement.
* [Npm](https://www.npmjs.com/) as package manager to fetch project dependencies

## Environnement setup

### Install requirements

Here's what you need to install to run the extension in a chrome based browser:

- Chrome based browser (Chrome, Chromium, Chrome Canary, Opera,...), of course...
- NodeJS [here](https://nodejs.org). Version 8+ is recommended.

That's all :)

### Clone the project

Using HTTPS
```bash
git clone https://github.com/thomaschampagne/stravistix.git
```

Or using SSH

```bash
git clone git@github.com:thomaschampagne/stravistix.git
```

### Fetch NPM dependencies

The `npm` command should be now installed on your system through the NodeJS installation. 

Enter in project directory
```bash
cd stravistix
```

Then install NPM dependencies with
```bash
npm install
```

### Build plugin

Once you installed the NPM dependencies, you can build the plugin with the following command:

```bash
npm run build
```

Both _core_ and _embedded app_ will be builded.

Once the build is completed, the plugin will be located in **dist/** directory.

A production build can be also run with

```bash
npm run build:prod
```

This will disable TypeScript debug sources map and enable [Ahead-of-Time](https://angular.io/guide/aot-compiler) compilation for _embedded app_.

### Load plugin into your browser

Into your chrome based browser:

* Open new tab and type **chrome://extensions**, then enter.
* Tick **Developer Mode** checkbox.
* Click **Load Unpacked Extension** button, then choose **dist/** directory (this is where you have the **manifest.json** file)
* Make sure to disable others instances of stravistix. You can re-enable them back from same tab.
* Open strava.com

### Build plugin on files changes

In order to avoid to re-run the painfull `npm run build` task on each file changes. You could run the following command:

```bash
npm start
```

This task will watch for files changes and automatically rebuild plugin to **dist/** directory. It's a way more suitable and faster for a development workflow.

### Run unit tests

The below command will run _core_ and _embedded app_ unit tests into a headless chrome.

```bash
npm test
```

Should be **run** and has to **pass** before any work submission.

### Packaging

You can package the extension with the following command

```bash
npm run package
```

A production build will be executed for this task.

On packaging done, a release archive will be generated in **package/** directory.

### Clean project

Simply run

```
npm run clean
```

This will clean **dist/**, **package/** & __*.js *.map__ generated files

# Git-Flow Repository structure

The project repository is fitted for **GitFlow** branches management workflow.

Learn more @  http://nvie.com/posts/a-successful-git-branching-model/
