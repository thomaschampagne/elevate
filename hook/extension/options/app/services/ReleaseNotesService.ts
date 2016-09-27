interface ReleaseNotesService {
    data: Array<ReleaseNote>;
}

app.factory('ReleaseNotesService', () => {
    let releaseNotesService: ReleaseNotesService = {
        data: releaseNotes
    };
    return releaseNotesService;
});
