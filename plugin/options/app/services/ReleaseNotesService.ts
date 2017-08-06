
import {IReleaseNote, releaseNotes} from "../../../common/scripts/ReleaseNotes";

export interface IReleaseNotesService {
    data: IReleaseNote[];
}

export let releaseNotesService = () => {
    const _releaseNotesService: IReleaseNotesService = {
        data: releaseNotes,
    };
    return _releaseNotesService;
};

