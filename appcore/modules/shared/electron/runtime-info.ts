export class RuntimeInfo {

	public osPlatform: { name: string, arch: string };
	public osHostname: string;

	// Unique user account identifier on the OS.
	public osUsername: string;

	// Unique machine installation id shared by all local users on the OS.
	public osMachineId: string;

	// Unique user athlete identifier based on sha1(osMachineId + osUsername) given by electron ipc main.
	public athleteMachineId: string;

	public cpu: { name: string, threads: number };
	public memorySizeGb: number;

	constructor(osPlatform: { name: string, arch: string }, osHostname: string, osUsername: string, osMachineId: string,
				athleteMachineId: string, cpu: { name: string, threads: number }, memorySizeGb: number) {
		this.osPlatform = osPlatform;
		this.osHostname = osHostname;
		this.osUsername = osUsername;
		this.osMachineId = osMachineId;
		this.athleteMachineId = athleteMachineId;
		this.cpu = cpu;
		this.memorySizeGb = memorySizeGb;
	}
}
