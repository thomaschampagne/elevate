# Elevate

<!-- toc -->
- [Install](#install)
  - [Desktop App](#desktop-app)
    - [Download \& Install](#download--install)
    - [Build from sources](#build-from-sources)
  - [Web extension](#web-extension)
    - [Download for _Chrome, Chromium, Edge (from 2020), Brave, Opera, Vivaldi, Yandex, ..._](#download-for-chrome-chromium-edge-from-2020-brave-opera-vivaldi-yandex-)
    - [From the sources](#from-the-sources)
- [Development](#development)
  - [Global solution structure](#global-solution-structure)
    - [App-core project](#app-core-project)
    - [Desktop project](#desktop-project)
    - [Web-extension project](#web-extension-project)
  - [Environments setup](#environments-setup)
    - [Install requirements](#install-requirements)
    - [Clone the git-flow based project](#clone-the-git-flow-based-project)
    - [Desktop development environment](#desktop-development-environment)
    - [Web extension development environment](#web-extension-development-environment)
  - [Build with docker](#build-with-docker)
    - [Desktop app](#desktop-app-1)
    - [Web extension](#web-extension-1)
- [Appendix](#appendix)
  - [Add a new desktop migration for a next release](#add-a-new-desktop-migration-for-a-next-release)
  - [Sign application](#sign-application)
    - [Self-sign with OpenSSL for windows build](#self-sign-with-openssl-for-windows-build)
  - [Publish to github releases](#publish-to-github-releases)
  - [Use custom browser for unit-testing (web-extension only)](#use-custom-browser-for-unit-testing-web-extension-only)
  - [Desktop: Debug the calculated watts against real power](#desktop-debug-the-calculated-watts-against-real-power)

<!-- tocstop -->

## Install

### Desktop App

#### Download & Install

- [For Windows](https://thomaschampagne.github.io/elevate-docs/Download-%26-Install/Windows/)
- [For macOS](https://thomaschampagne.github.io/elevate-docs/Download-%26-Install/macOS/)
- For Linux: not shipped yet

#### Build from sources

Go to chapter [Environment setup](#environments-setup).

### Web extension

#### Download for _Chrome, Chromium, Edge (from 2020), Brave, Opera, Vivaldi, Yandex, ..._

Go to [https://thomaschampagne.github.io/elevate/](https://thomaschampagne.github.io/elevate/)

#### From the sources

Go to chapter [Environment setup](#environments-setup).

## Development

This section covers the environment setup to develop and build both desktop app and web extension.

### Global solution structure

The solution is cut in 3 folders/projects: the `appcore`, the `desktop` & `webextension`

#### App-core project

Contains the _Elevate App_ shared and loaded by both `desktop` and `webextension`projects. Appcore contains core features like _fitness trend, year progressions, athlete settings..._

The `Appcore` main technology stack is:

- [Typescript](https://www.typescriptlang.org/) as programming language.
- [Angular](https://angular.io/) as frontend (build with [@angular/cli](https://cli.angular.io/)).
- [Angular Material](https://material.angular.io/) for material designed components.
- [Metrics Graphics](https://www.metricsgraphicsjs.org/), [Plotly](https://plotly.com/javascript/) & [D3](https://d3js.org/) for charting.
- [LokiJS](https://https://github.com/techfort/LokiJS) as in-memory NoSQL database persisted in IndexedDB.
- [Jest](https://jestjs.io/) as Javascript test runner (instead of "stock" karma one).

#### Desktop project

Holds the container behaviour to provide a cross-platform desktop app under _Windows, Linux & MacOS_. It contains desktop specific features like _connectors synchronization_ (to fetch athlete activities from external).

The `Desktop` main technology stack is:

- [Typescript](https://www.typescriptlang.org/) as programming language.
- [Jest](https://jestjs.io/) as Javascript test runner.
- [Electron](https://electronjs.org/) as cross-platform desktop container.
- [Electron-builder](https://www.electron.build/) to build, sign and publish installers per platform. Also handle app updates process (via `electron-updater`).
- [Rollup.js](https://rollupjs.org/guide/en/) to load & bundle modules.
- [Vue.js](https://vuejs.org/) for splash-screen update window.

#### Web-extension project

Contains the web extension behaviour that acts directly on _strava.com_ website. This includes _extended stats on activities & segments efforts, best splits, etc..._

### Environments setup

#### Install requirements

You will need to install [NodeJS](https://nodejs.org) (v15+) to build both desktop and chrome web extension.

#### Clone the [git-flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) based project

```bash
git clone https://github.com/thomaschampagne/elevate.git
```

or

```bash
git clone git@github.com:thomaschampagne/elevate.git
```

The new mono-repo including the desktop app and the web extension is on `develop-new` branch at the moment. So checkout/track this branch to build the desktop app:

```bash
cd ./elevate
git checkout --track origin/develop-new
```

Then install npm dependencies:

```bash
npm install
```

Run solution tests (`appcore` + `desktop` + `webextension`):

```bash
npm test
```

(_Should be executed with success for any pull request submission_).

#### Desktop development environment

All commands displayed in this section will be executed in `./desktop/` folder. So:

```bash
cd ./desktop/
```

- Run in development:

```bash
npm start
```

> This npm task will create a `./desktop/dist` output folder and re-compile both `appcore` and `desktop` projects on any code changes

To open the desktop app, open another terminal, then run:

```bash
npm run launch:dev:app
```

- Run unit tests:

```bash
npm test
```

- Generate production installers and publish them per platforms:

First switch to desktop directory with `cd desktop/`

- Build `Windows` `x64` `.exe`:

  ```bash
  npm run build:publish:windows
  ```

- Build `Linux` `x64` `.deb`:

  ```bash
  npm run build:publish:linux
  ```

- Build `MacOS` `x64` `.dmg` :

  ```bash
  npm run build:publish:macos
  ```

> Output installers will be located in `./desktop/package/`
> The build targets are defined in `./desktop/package.json` (`build` key section). See [https://www.electron.build](https://www.electron.build) for more info.

- (Optional) To sign the production installers read the [how to sign appendix](#sign-application)

- (Optional) To publish the production installers on github read the [how to publish on github appendix](#publish-to-github-releases)

- Clean outputs:

```bash
npm run clean
```

#### Web extension development environment

_To develop the web extension, you need a Chrome based browser such as Chrome, Chromium, Edge (from 2020), Brave, Opera, Vivaldi, Yandex, ..._

All commands displayed in this section will be executed in `./webextension/` folder. So:

```bash
cd ./webextension/
```

- Run in development:

```bash
npm start
```

> This npm task will create a `./webextension/dist` output folder and re-compile both `appcore` and `webextension` projects on any code changes

- To load the web extension into your chrome based browser:

  - Open new tab and type `chrome://extensions`, then enter.
  - Tick `Developer Mode` checkbox.
  - Click `Load Unpacked Extension` button, then choose `./webextension/dist` directory (this is where you have the `manifest.json` file)
  - Make sure to disable other instances of elevate. You can re-enable them back from same tab.
  - Open strava.com OR click on the Elevate icon in the browser toolbar.

- Run unit tests

```bash
npm test
```

- Production package

You can package the extension with the following command

```bash
npm run package
```

> Output release will be located in `./webextension/package/`

- Clean outputs:

```bash
npm run clean
```

### Build with docker

#### Desktop app

@TODO

#### Web extension

Create docker your image from `Dockerfile`

```bash
docker build . -t elevate-chrome-builder
```

Run a docker production build through a container. Replace `/path/to/your/directory/` with a folder on your host to fetch the packaged build when done.

```bash
docker run --rm --name elevate-chrome-build -v /path/to/your/directory/:/package elevate-chrome-builder
```

## Appendix

### Add a new desktop migration for a next release

Register your new migration in below file

```bash
./appcore/src/app/desktop/migration/desktop-registered-migrations.ts
```

**Tip:** to emulate a version upgrade, you may downgrade the `version` property inside `ipc.storage.json` file (user app data folder)

### Sign application

#### Self-sign with OpenSSL for windows build

- Create & edit a `code_sign.cnf` openssl config:

```bash
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no
[req_distinguished_name]
countryName             = FR
stateOrProvinceName     = Rhone Alpes
localityName            = Grenoble
organizationName        = Elevate
commonName              = Elevate Sports App
emailAddress            = you@email.com

[v3_req]
basicConstraints        = CA:FALSE
keyUsage                = critical,digitalSignature
extendedKeyUsage        = critical,codeSigning
```

- Generate private key and certificate with a `passphrase`

```bash
openssl req -x509 -newkey rsa:4096 -sha256 -keyout code_sign.key -out code_sign.crt -days 1096 -config code_sign.cnf
```  

- Create `.pxf` file from the private key and certificate previously generated. `.pxf` file will be used to sign app under windows.

```bash
openssl pkcs12 -export -name "elevate-sports-app" -out code_sign.pfx -inkey code_sign.key -in code_sign.crt
```

- Convert `.pxf` file to `base64`

```bash
base64 code_sign.pfx -w 0
```

- Create/edit `electron-builder.env` file under `./desktop/` folder, and add following keys:

```bash
CSC_LINK=
CSC_KEY_PASSWORD=
```

- Assign the `base64` previously generated to the key `CSC_LINK`

- Assign the `passphrase` previously used to the key `CSC_KEY_PASSWORD`

- Then run packaging for windows:

```bash
npm run package:windows
```

### Publish to github releases

- Generate a github personal access token at [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new)

- Tick `write:packages` scope. The `repo` and `read:packages` scopes should be automatically ticked too. Leave them ticked.

- Enter a `Note` for your token, then click `Generate token`. Keep this token safe. If lost you will have to re-generate one.

- Create/edit `electron-builder.env` file under `./desktop/` folder, and add following key:

```bash
GH_TOKEN=
```

- Assign the generated token to the key `GH_TOKEN`.

- Open `./desktop/package.json` file and go to the key `build.publish`.

- Edit the `owner` and `repo` variables to match with your target github repository.

_Note: To publish a new version on github, a github `draft release` has to exist on the remote target repo.
The github `draft release` value should match the `version` value of `./desktop/package.json` file.
New version must be compliant with [semver convention](https://semver.org/) and higher than previous version if exists.
You can use this [semver compare tool](https://semvercompare.azurewebsites.net/) that your new version is higher than your previous one._

- Open [https://github.com/your_owner/your_repo/releases](https://github.com/your_owner/your_repo/releases) and click `Draft a new release`.

- Enter the semver version to draft and click `Save draft`.

_Note: You may already pushed a git tag matching your version. If not, the git tag will be created on publish._

- Run packaging to publish installer:

```bash
npm run publish:win
```

or

```bash
npm run publish:mac
```

- Open [https://github.com/your_owner/your_repo/releases/edit/your_version](https://github.com/your_owner/your_repo/releases/edit/your_version): Some files should have been uploaded on the github draft release.

- You can update the uploaded files draft with a new packaging process. Once ready, click `Publish release`: users will receive the update.

### Use custom browser for unit-testing (web-extension only)

Create a `browsers.karma.conf.js` file in `webextension` folder.

To run unit test in a headless **chromium** instead of **chrome**, inject below javascript code:

```javascript
module.exports = {
    browsers: [
        "HeadlessChrome"
    ],
    customLaunchers: {
        HeadlessChrome: {
            base: "Chromium",
            flags: [
                "--no-sandbox",
                // See https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md
                "--headless",
                "--disable-gpu",
                // Without a remote debugging port, Google Chrome exits immediately.
                " --remote-debugging-port=9222"
            ]
        }
    }
};
```

### Desktop: Debug the calculated watts against real power

> This works in development build only

- Create a new local storage key named `DEBUG_EST_VS_REAL_WATTS` and set it to `true`
- Reload application and go to activities performed with a real power meter (cycling or running)
