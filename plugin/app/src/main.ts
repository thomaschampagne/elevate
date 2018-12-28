import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";
import "hammerjs";

import { ThemeVariant } from "./app/shared/theme-variant.enum";

if (environment.production) {
	enableProdMode();
}

// Apply default theme class to body. AppComponent will also change body class along themes switches
document.body.setAttribute("class", ThemeVariant.DEFAULT);

platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.log(err));
