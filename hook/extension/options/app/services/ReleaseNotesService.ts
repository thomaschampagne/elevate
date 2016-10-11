interface ReleaseNotesService {
    data: Array<IReleaseNote>;
}

app.factory('ReleaseNotesService', () => {
    let releaseNotesService: ReleaseNotesService = {
        data: releaseNotes
    };
    return releaseNotesService;
});
