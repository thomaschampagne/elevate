/*

 // Install new typings:
 typings search xxxxx
 typings install dt~XXXXXX --global --save


 // Rename JS to TS
 for f in *.js; do
 mv -- "$f" "${f%.js}.ts"
 done

 // Find variable without type
 .*let\s\w+\s=
 .*var\s\w+\s=

 // Find variable without type ANY !! waring on this !
 .*var\s\w+\s:\sany\s=

 var (.*) = AbstractDataView\.extend\(function\(base\) \{
 >
 class $1 extends AbstractDataView {

 // Find JS functions
 \w:\sfunction((.*))\s+\{

 */

// TMP TypeScript declaration
//
// declare class AthleteStatsModifier {
//     constructor(a: any, b: any);
//
//     modify(): Function;
// }

///<reference path="d3.d.ts"/>
///<reference path="angular-material.d.ts"/>


declare class ActivitySegmentTimeComparisonModifier {
    constructor(a: any, b: any, c: any, d: any);

    modify(): Function;
}

declare class ActivityBestSplitsModifier {
    constructor(a: any, b: any, c: any, d: any, e: any, f: any);

    modify(): Function;
}