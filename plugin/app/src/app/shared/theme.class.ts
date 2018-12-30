export class Theme {
	static CLASSIC = new Theme("classic", "Elevate Classic");
	static STRAVA = new Theme("strava", "Strava");
	static BARBERSHOP = new Theme("barbershop", "Barbershop");
	static CANDY = new Theme("candy", "Candy");
	static ENERGETIC = new Theme("energetic", "Energetic");
	static ROADBLOCK = new Theme("roadblock", "Roadblock");

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
		return Theme.CLASSIC.name;
	}

	static getThemes(): Theme[] {
		return Object.values(Theme)
			.filter(theme => typeof theme === "object");
	}
}
