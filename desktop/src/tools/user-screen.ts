import Electron, { Display } from "electron";

export class UserScreen {
  public static getPrimaryDisplay(): Display {
    return Electron.screen.getPrimaryDisplay();
  }

  public static computeScreenRes(): { width: number; height: number } {
    const primaryDisplay = this.getPrimaryDisplay();
    const width = primaryDisplay.size.width * primaryDisplay.scaleFactor;
    const height = primaryDisplay.size.height * primaryDisplay.scaleFactor;
    return { width: width, height };
  }
}
