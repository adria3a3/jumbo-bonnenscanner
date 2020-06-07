// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];


// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');
const form = document.getElementById('form');
const message = document.getElementById('message');
const numberOfLines = document.getElementById('number-of-lines');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
// Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

// Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    }, function (error) {
        console.error(error);
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        form.style.display = 'block';
        AddToSpreadsheet();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        form.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

/**
 * Print files.
 */
function AddToSpreadsheet() {

    const localStorageKey = "spreadSheetId";
    const spreadsheetId = localStorage.getItem(localStorageKey)
    if (spreadsheetId != null) {
        if (data.length !== 0) {
            const params = {
                // The ID of the spreadsheet to update.
                spreadsheetId: spreadsheetId,

                // The A1 notation of a range to search for a logical table of data.
                // Values will be appended after the last row of the table.
                range: 'A1:C1',

                // How the input data should be interpreted.
                valueInputOption: 'USER_ENTERED',

                // How the input data should be inserted.
                insertDataOption: 'INSERT_ROWS'
            };

            const valueRangeBody = {
                "range": "A1:C1",
                "majorDimension": "ROWS",
                "values": data
            }
            const request = gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
            request.then(function (response) {
                numberOfLines.innerText = response.result.updates.updatedRows;
                message.style.display = 'block';
                
            }, function (reason) {
                console.error('error: ' + reason.result.error.message);
            });
        }

    } else {
        gapi.client.sheets.spreadsheets.create({
            properties: {
                title: "BonnenScanner"
            }
        }).then((response) => {
            localStorage.setItem(localStorageKey, response.result.spreadsheetId);
            AddToSpreadsheet();
        });
        
    }
}
