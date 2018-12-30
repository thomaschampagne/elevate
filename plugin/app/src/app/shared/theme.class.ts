export class Theme {
	static DARK = new Theme("dark", "Elevate (Dark)");
	static STRAVA = new Theme("strava", "Strava");
	static BARBERSHOP = new Theme("barbershop", "Barbershop (Light)");
	static BOUQUET = new Theme("bouquet", "Bouquet (Light)");
	static CANDY = new Theme("candy", "Candy (Dark)");
	static ROADBLOCK = new Theme("roadblock", "Roadblock (Dark)");

	// private to disallow creating other instances of this type
	private constructor(private _name: string, private _label: string) {
	}

	// Getter only: don't allow value change
	get name(): string {
		return this._name;
	}

	get label(): string {
		return this._label;
	}

	static getDefault(): string {
		return Theme.DARK.name;
	}

	static getThemes(): Theme[] {
		return Object.values(Theme)
			.filter(theme => typeof theme === "object");
	}
}
