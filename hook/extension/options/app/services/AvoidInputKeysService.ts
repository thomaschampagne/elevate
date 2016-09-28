interface AvoidInputKeysService {
    apply: (keyboardEvent: KeyboardEvent) => void;
}

app.factory('AvoidInputKeysService', () => {

    let avoidInputKeysService: AvoidInputKeysService = {
        apply: (keyboardEvent: KeyboardEvent) => {
            if (keyboardEvent.keyCode !== 38 && keyboardEvent.keyCode !== 40 && keyboardEvent.keyCode !== 9 && keyboardEvent.keyCode !== 16) { // NON key up/down press or SHIFT/TAB
                keyboardEvent.preventDefault();
            }
        }
    }

    return avoidInputKeysService;
});
