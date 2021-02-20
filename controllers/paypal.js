'use strict';

const checkoutNodeJssdk = require('@paypal/checkout-server-sdk')

function client() {
    return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

function environment() {
    const clientId = 'ATET_OBKQsm2EXXHAEenw8kALfnbgERBkb9U_I2ZVVvATJXtRsrY9easUR2UU_U1I9UYp0ZMYoMo8S6O'
    const clientSecret = 'EEBvAV5P4iXFDEIQjHvdedpzk4oiH2ZsO2fgeMTzl2uA2JoevHjBxW1BKvMcB0TTS5LMonOX7uuykQhE'

    return new checkoutNodeJssdk.core.SandboxEnvironment(
        clientId, clientSecret
    );
}

async function prettyPrint(jsonData, pre=""){
    let pretty = "";
    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
    for (let key in jsonData){
        if (jsonData.hasOwnProperty(key)){
            if (isNaN(key))
              pretty += pre + capitalize(key) + ": ";
            else
              pretty += pre + (parseInt(key) + 1) + ": ";
            if (typeof jsonData[key] === "object"){
                pretty += "\n";
                pretty += await prettyPrint(jsonData[key], pre + "    ");
            }
            else {
                pretty += jsonData[key] + "\n";
            }

        }
    }
    return pretty;
}

module.exports = {client: client, prettyPrint:prettyPrint};