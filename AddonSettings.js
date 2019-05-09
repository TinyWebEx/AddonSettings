/**
 * Caching wrapper for AddonSettings API that does save and load settings.
 *
 * @public
 * @module AddonSettings
 * @requires data/DefaultSettings
 * @requires ../lodash/isObject
 */

// lodash
import isPlainObject from "../lodash/isPlainObject.js";

import { DEFAULT_SETTINGS } from "../data/DefaultSettings.js";

let enableCaching = true;

let gettingManagedOption;
let gettingSyncOption;

let managedOptions = null;
let syncOptions = null;


/**
 * Creates a (shallow) copy of the object or array.
 *
 * Also returns the value, as it is, if it needs no unfreezing.
 *
 * @private
 * @param  {*} value the value
 * @returns {*} the value, now freely modifyable
 */
function unfreezeObject(value) {
    // always shallow-copy
    if (Array.isArray(value)) {
        value = value.slice();
    } else if ((isPlainObject(value))) {
        value = Object.assign({}, value);
    } else {
        // return primitive value or similar ones
        return value;
    }

    // but warn if object was not even frozen, so deev can fix the default settings
    if (!Object.isFrozen(value)) {
        console.warn("The following defined default value of type", typeof value, "is not frozen. It is recommend that all default options are frozen.", value);
    }

    return value;
}

/**
 * Get the default value for a seting.
 *
 * Returns undefined, if option cannot be found.
 *
 * @public
 * @param  {string|null} option name of the option
 * @returns {Object|undefined}
 * @throws {Error} if option is not available
 */
export function getDefaultValue(option) {
    const clonedDefaultSettings = DEFAULT_SETTINGS;

    // if undefined return the object
    if (option in clonedDefaultSettings) {
        return unfreezeObject(clonedDefaultSettings[option]);
    }

    // return all default values
    if (!option) {
        Object.values(unfreezeObject(clonedDefaultSettings)).map(unfreezeObject);
        return clonedDefaultSettings;
    }

    // end result fails
    console.error(`Default value for option "${option}" missing. No default value defined.`);
    throw new Error(`Default value for option "${option}" missing. No default value defined.`);
}

/**
 * (Re)requests the managed and sync options.
 *
 * Note: It is usually a good idea to clearCache() before!
 *
 * @private
 * @param {null|string|string[]} [requestOption=null] the option value to request
 * @returns {Promise}
 * @throws {Error}
 */
function reloadOptions(requestOption = null) {
    gettingManagedOption = browser.storage.managed.get(requestOption).then((options) => {
        managedOptions = options;
    }).catch((error) => {
        // rethrow error if it is not just due to missing storage manifest
        if (error.message === "Managed storage manifest not found") {
            /* only log warning as that is expected when no manifest file is found */
            console.warn("could not get managed options", error);

            // This error is now handled.
            return;
        }

        throw error;
    });

    gettingSyncOption = browser.storage.sync.get(requestOption).then((options) => {
        if (syncOptions === null) {
            syncOptions = options;
        } else {
            // In case set() is called before this Promise here resolves, we need to keep the old values, but prefer the newly set ones.
            Object.assign(options, syncOptions);
        }
    }).catch((error) => {
        console.error("could not get sync options", error);

        // re-throw, so Promise is not marked as handled
        throw error;
    });
}

/**
 * Makes sure, that the synced o0ptions are available.
 *
 * @private
 * @returns {Promise}
 * @throws {Error}
 */
function requireSyncedOptions() {
    return gettingSyncOption.catch(() => {
        // fatal error (already logged), as we now require synced options
        throw new Error("synced options not available");
    });
}

/**
 * Get all available options.
 *
 * It assumes gettingManagedOption is not pending anymore.
 *
 * @private
 * @returns {Object}
 */
async function getAllOptions() {
    const result = {};

    // also need to wait for synced options
    await requireSyncedOptions();

    // if all values should be returned, also include all default ones in addition to fetched ones
    Object.assign(result, getDefaultValue());

    if (syncOptions !== null) {
        Object.assign(result, syncOptions);
    }

    if (managedOptions !== null) {
        Object.assign(result, managedOptions);
    }

    return result;
}

/**
 * Clears the stored/cached values.
 *
 * Usually you should not call this, but just reload the data with
 * {@link module:AddonSettings.loadOptions|loadOptions} in case you need this. Otherwise, this leaves the
 * module in an uninitalized/unexpected state.
 *
 * @public
 * @returns {void}
 * @deprecated Do use {@link module:AddonSettings.setCaching|setCaching} or {@link module:AddonSettings.loadOptions|loadOptions} instead.
 */
export function clearCache() {
    managedOptions = null;
    syncOptions = null;
}

/**
 * Caching is enabled by default. Call this with "false" to disable.
 *
 * @public
 * @param {boolean} enableCachingNew
 * @returns {void}
 */
export function setCaching(enableCachingNew) {
    if (enableCachingNew !== true && enableCachingNew !== false) {
        throw new TypeError(`First parameter must be a boolean parameter. "${enableCachingNew}" given.`);
    }

    // clear or load cache if this setting is toggled often
    if (enableCachingNew) {
        loadOptions();
    } else {
        clearCache();
    }

    enableCaching = enableCachingNew;
}

/**
 * Returns the add-on setting to use in add-on.
 *
 * If only a single option is requested (option=string) the result of the
 * promise will be that return value.
 * Otherwise, you can pass no parmeter or "null" and it will return all
 * saved config values.
 *
 * @public
 * @param  {string|null} [option=null] name of the option
 * @returns {Promise} resulting in single value or object of values or undefined
 * @throws {Error} if option is not available or other (internal) error happened
 */
export async function get(option = null) {
    let result = undefined;

    if (enableCaching === false) {
        clearCache();
        reloadOptions(option);
    }

    // verify managed options are loaded (or are not available)
    await gettingManagedOption.catch(() => {
        // ignore errors, as fallback to other storages is allowed
        // (although "no manifest" error is already handled)
    });

    // return all options
    if (option === null) {
        return getAllOptions();
    }

    // first try to get managed option
    if (managedOptions !== null && (option in managedOptions)) {
        result = managedOptions[option];
        console.info(`Managed setting got for "${option}".`, result);

        // merge with default options, if this is an object, so default
        // values are also provided
        if (isPlainObject(result)) {
            result = Object.assign({}, getDefaultValue(option), result);
        }

        return result;
    } else {
        await requireSyncedOptions();

        if (syncOptions !== null && (option in syncOptions)) {
            result = syncOptions[option];
            console.info(`Synced setting got for "${option}".`, result);

            // merge with default options, if this is an object, so default
            // values are also provided
            if (isPlainObject(result)) {
                result = Object.assign({}, getDefaultValue(option), result);
            }

            return result;
        }
    }

    // get default value as a last fallback
    result = getDefaultValue(option);

    // last fallback: default value
    console.warn(`Could not get option "${option}". Using default.`, result);

    return result;
}

/**
 * Sets the settings.
 *
 * Note you can also pass a key -> value object to set here, as with the usual
 * "set" storage API, or use the simplified two-parmeters version.
 *
 * @see {@link https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/StorageArea/set}
 * @public
 * @param  {Object|string} option keys/values to set or single value
 * @param  {Object} [value] if only a single value is to be set
 * @returns {Promise}
 * @throws {TypeError}
 */
export function set(option, value) {
    // put params into object if needed
    if (!isPlainObject(option)) {
        if (value === undefined) {
            return Promise.reject(new TypeError("Second argument 'value' has not been passed."));
        }

        option = {
            [option]: value
        };
    }

    return browser.storage.sync.set(option).then(() => {
        // syncOptions is only null, if loadOptions() -> gettingSyncOption has not yet been resolved
        // As such, we still have to save it already, as we do not want to introduce latency.
        if (syncOptions === null) {
            syncOptions = {};
        }

        // add to cache
        Object.assign(syncOptions, option);
    }).catch((error) => {
        console.error("Could not save option:", option, error);

        // re-throw error to make user aware something failed
        throw error;
    });
}

/**
 * Fetches all options, so they can be used later.
 *
 * This is basically the init method!
 * It returns a promise, but that does not have to be used, because the module is
 * built in a way, so that the actual getting of the options is waiting for
 * the promise.
 *
 * @public
 * @returns {Promise}
 */
export function loadOptions() {
    if (browser.storage === undefined) {
        throw new Error("Storage API is not available.");
    }

    // clear storage first
    clearCache();

    // just fetch everything
    reloadOptions(null);

    // if the settings have been received anywhere, they could be loaded
    return gettingManagedOption.catch(() => gettingSyncOption);
}

// automatically fetch options
loadOptions().then(() => {
    console.info("AddonSettings module loaded.");
});
