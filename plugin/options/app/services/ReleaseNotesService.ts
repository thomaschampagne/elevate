
import {IReleaseNote, releaseNotes} from "../../../core/scripts/ReleaseNotes";

export interface IReleaseNotesService {
    data: IReleaseNote[];
}

export let releaseNotesService = () => {
    const _releaseNotesService: IReleaseNotesService = {
        data: releaseNotes,
    };
    return _releaseNotesService;
};
