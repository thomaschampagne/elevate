import packageInfo from "../../../package.json";

export class AppPackage {
  public static getVersion(): string {
    return packageInfo.version;
  }

  public static getRepositoryUrl(): string {
    return packageInfo.repository.url;
  }

  public static getAuthorWebSite(): string {
    return packageInfo.author.web;
  }

  public static getElevateWebSite(): string {
    return `${this.getAuthorWebSite()}/elevate/`;
  }
}
