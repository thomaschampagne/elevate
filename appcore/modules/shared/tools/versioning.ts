import { ElevateException } from "../exceptions";

export class Versioning {
    /**
     * Convert x.x.x(.x) chrome version to semver x.x.x(-x)
     */
    public static chromeToSemverVersion(chromeVersion): string {
        if (!chromeVersion.match(/^([0-9])+.([0-9])+[.]([0-9])+([.][0-9+])?$/g)) {
            throw new ElevateException(`Wrong chrome version pattern for version: ${chromeVersion}`);
        }

        const chromeVersionArray = chromeVersion.split(".");
        if (chromeVersionArray.length === 4) {
            const buildNumber = chromeVersionArray.pop();
            return `${chromeVersionArray.join(".")}-${buildNumber}`;
        }
        return chromeVersion;
    }
}
