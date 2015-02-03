Install StravaPlus from chrome store
==========
Go to http://bitly.com/stravaplus

Develop StravaPlus
==========
You need **npm** and **node** exectutable

- Install extension dependencies
```
node make.js init
```
This will download required node modules
- Create distribution folder 
```
node make.js dist
```
This will create folder **dist/**, this is folder user before a release

- Create archive package 
```
node make.js build
```
This will create archive in **builds/StravaPlus\_vX.X.X\_[date].zip**
