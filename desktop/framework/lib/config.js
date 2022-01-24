/**
 * Save user specific data to a config file.
 * (C) 2015 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const fs = require("fs");
const path = require("path");

let config, config_file, appID;

function initSync(initAppID) {
    if (config) {
        LOG.debug("initSync: config is already read")
        return; // already read
    }
    LOG.debug(`initSync: initAppID[${initAppID}]`)
    appID = initAppID;
    config_file = path.resolve(`${CONSTANTS.DATADIR}/${appID}/config.json`);
    LOG.debug(`initSync: config_file[${config_file}]`)
    // init folder and file locations
    if (!fs.existsSync(config_file)) {
        config = {};  // create empty config
        LOG.debug(`initSync: create empty config`)
    }
    else {
        try {
            config = JSON.parse(fs.readFileSync(config_file, "utf8"));
            LOG.debug(`initSync: config has been read`)
        }
        catch (err) {
            LOG.error(`Config read failed, most probably system disk issue. Error is: ${err}.`);
            config = {};
        }
    }

    process.on("exit", _writeSync);   // add exit handler to save on exit
    LOG.debug(`initSync: process.on exit added`)
}

const getConfig = _ => config;
const setConfig = configNew => config = configNew;
const get = key => config[key];
const set = (key, value) => config[key] = value;
const deleteKey = key => delete config[key];


function _writeSync() {
    const appFilesDir = `${CONSTANTS.DATADIR}/${appID}`;
    if (!fs.existsSync(appFilesDir)) {
        try {
            fs.mkdirSync(appFilesDir, { recursive: true });
        }
        catch (err) {
            LOG.error(`Can't create app data folder, error is ${err}`);
        }
    }

    try {
        fs.writeFileSync(config_file, JSON.stringify(config || {}), "utf8");
        LOG.debug(`_writeSync: config_file was saved`)
    }
    catch (err) {
        LOG.error(`Can't write app config file. The error is ${err}`);
    }
}

module.exports = { initSync, getConfig, setConfig, get, set, deleteKey };