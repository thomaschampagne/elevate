function fireEvent(element, event) {
    // dispatch for firefox + others
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent(event, true, true); // event type,bubbling,cancelable
    return !element.dispatchEvent(evt);
}

// Load options from chrome storage on option page loaded
function loadFromChromeLocalStorage() {
    chrome.storage.sync.get(userSettings, function(items) {
        for (var i in userSettings) {
            var elem = document.getElementById(i);
            elem.value = items[i];
            if ((elem.tagName === 'INPUT') && (elem.getAttribute('type') === 'checkbox')) {
                elem.checked = items[i];
            }
        }
    });
}

// Save options to chrome storage when any option_id as changed.
function saveToChromeLocalStorage() {

    for (var i in userSettings) {

        var userOptElement = document.getElementById(i);

        if (!userOptElement) {
            console.warn('id <' + i + '> is not present in DOM');
            continue;
        }

        userOptElement.addEventListener('change', function() {
            var data = {};
            for (var j in userSettings) {
                var elem = document.getElementById(j);
                data[j] = elem.value;
                if ((elem.tagName === 'INPUT') && (elem.getAttribute('type') === 'checkbox')) {
                    data[j] = elem.checked;
                }
            }
            chrome.storage.sync.set(data);
        });
    }
}

function setupFireChangeEventOnSlideCheckboxClicked() {
    var inputCheckboxes = document.getElementsByTagName('input');
    for (i = 0; i < inputCheckboxes.length; i++) {
        if (inputCheckboxes[i].getAttribute('type') == 'checkbox') {
            var divParent = inputCheckboxes[i].parentNode;
            divParent.addEventListener('click', function() {
                var checkbox = this.getElementsByTagName('input')[0];
                checkbox.checked = !checkbox.checked;
                fireEvent(checkbox, 'change');
            });
        }
    }
}

function clearCacheOnNextLoad() {
    console.log('CLEAR !!');
    var checkbox = document.getElementById('extensionHasJustUpdated');
    checkbox.checked = true;
    fireEvent(checkbox, 'change');
}

function handleUserHrInputsAndValidation() {
    $('#userMaxHr').change(function() {
        var errorMessage = null;
        if (!/^\d{2,3}$/.test($('#userMaxHr').val())) {
            errorMessage = "Not valid value. Setting default HR of 190";
            alert(errorMessage);
            $('#userMaxHr').val(190);
        }
        clearCacheOnNextLoad();
    });

    $('#userRestHr').change(function() {
        var errorMessage = null;
        if (!/^\d{2,3}$/.test($('#userRestHr').val())) {
            errorMessage = "Not valid value. Setting default HR of 65";
            alert(errorMessage);
            $('#userRestHr').val(65);
        }
        clearCacheOnNextLoad();
    });

    $('#userFTP').change(function() {
        var errorMessage = null;
        if (!/^\d{2,4}$/.test($('#userFTP').val()) && $('#userFTP').val() != '') {
            errorMessage = "Not valid value.";
            alert(errorMessage);
            $('#userFTP').val(null);
        }
        clearCacheOnNextLoad();
    });

    $('#userGender').change(function() {
        clearCacheOnNextLoad();
    });
}


function checkOrUncheckVIAndIFAlongNP() {

    function checkElementIdTo(id, bool) {
        $('#' + id).prop('checked', bool);
        fireEvent(document.getElementById(id), 'change');
    }

    $('#displayVariabilityIndex, #displayCurrentIntensityFactor, #displayNormalizedWattsPerKg').next().click(function(e) {
        checkElementIdTo('displayNormalizedPower', true);
    });

    $('#displayNormalizedPower').next().click(function(e) {
        checkElementIdTo('displayVariabilityIndex', false);
        checkElementIdTo('displayCurrentIntensityFactor', false);
        checkElementIdTo('displayNormalizedWattsPerKg', false);

    });
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        vars[key] = value;
    });
    return vars;
}

// Call main function
$(document).ready(function() {
    handleUserHrInputsAndValidation();
    loadFromChromeLocalStorage();
    saveToChromeLocalStorage();
    setupFireChangeEventOnSlideCheckboxClicked();
    checkOrUncheckVIAndIFAlongNP();

    var viewHelperId = getUrlVars()['viewHelperId'];
    if (typeof(viewHelperId) != 'undefined') {
        // console.log(viewHelperId);
        jQuery('a[href*=tip_' + viewHelperId + ']').click();
    }

});
