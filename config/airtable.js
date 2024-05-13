const axios = require('axios');
const User = require('../models/User');

exports.setLatestTokenRequestState = async (state, dataToFormatIfExists) => {
    latestTokenRequestState = {
        state,
    };

    // Check if AUTHORIZATION_SUCCESS or REFRESH_SUCCESS
    if (state === 'AUTHORIZATION_SUCCESS' || state === 'REFRESH_SUCCESS') {
        // Get user infos from Airtable and update the user in the database with axios (URL: https://api.airtable.com/v0/meta/whoami)
        await axios.get('https://api.airtable.com/v0/meta/whoami', {
            headers: {
                "Authorization": "Bearer " + dataToFormatIfExists.access_token
            }
        })
        .then((response) => {
        // Retreive the user infos from the response
            let airtableUser = response.data;
            console.log("Airtable User: ", airtableUser);
            return airtableUser;
        })
        .catch((error) => {
            console.log(error);
        });
    }
}

exports.formatLatestTokenRequestStateForDeveloper = () => {
    let formatRequestState = '';

    switch (latestTokenRequestState.state) {
        case 'NONE':
            break;
        case 'LOADING':
            formatRequestState =
                'The request for the access token from your latest authorization is still outstanding, check the terminal or refresh';
            break;
        case 'AUTHORIZATION_ERROR':
            formatRequestState = 'Your latest authorization request failed, the error was:';
            break;
        case 'UNKNOWN_AUTHORIZATION_ERROR':
            formatRequestState =
                'The request for the access token from your latest authorization failed, check the terminal for details';
            break;
        case 'REFRESH_ERROR':
            formatRequestState = 'Your latest refresh request failed, the error was:';
            break;
        case 'UNKNOWN_REFRESH_ERROR':
            formatRequestState =
                'Your latest request to refresh your access token failed, see the terminal for details';
            break;
        case 'AUTHORIZATION_SUCCESS':
            formatRequestState = 'Your authorization succeeded, the response was:';
            break;
        case 'REFRESH_SUCCESS':
            formatRequestState = 'Your refresh request succeeded, the response was:';
            break;
        default:
            throw Error(
                `unexpected latestTokenRequestState loading state: ${latestTokenRequestState.state}`,
            );
    }

    if (latestTokenRequestState.formattedData) {
        formatRequestState += `<br/>
    <code>
        <pre>${latestTokenRequestState.formattedData}</pre>
    </code>`;
    }

    if (formatRequestState) {
        formatRequestState = `<p>${formatRequestState}</p>`;
    }

    return formatRequestState;
}