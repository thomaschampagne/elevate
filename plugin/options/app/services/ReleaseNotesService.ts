
import {IReleaseNote, releaseNotes} from "../../../core/scripts/ReleaseNotes";

export interface IReleaseNotesService {
    data: Array<IReleaseNote>;
}

export let releaseNotesService = () => {
    let _releaseNotesService: IReleaseNotesService = {
        data: releaseNotes
    };
    return _releaseNotesService;
};

