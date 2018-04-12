export class HistoryChangesModel {
	public added: number[];
	public deleted: number[];
	public edited: Array<{ id: number, name: string, type: string, display_type: string }>;
}
