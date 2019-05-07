/**
 * Unit tests for DefaultSettings.js object.
 *
 * You can embed it in your unit tests to check the vadility of your default settings object.
 *
 * @public
 * @module defaultSettingsTest
 * @requires mocha
 * @requires chai
 * @requires data/DefaultSettings
 */

import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import isPlainObject from "../../../lodash/isPlainObject.js";

import { DEFAULT_SETTINGS } from "../../../data/DefaultSettings.js";

describe("data: DEFAULT_SETTINGS", function () {
    describe("DEFAULT_SETTINGS", function () {
        it("is there", function () {
            chai.assert.exists(DEFAULT_SETTINGS);
            chai.assert.isNotEmpty(DEFAULT_SETTINGS);
        });

        it("is object", function () {
            chai.assert.isObject(DEFAULT_SETTINGS);
        });

        it("is frozen", function () {
            chai.assert.isFrozen(DEFAULT_SETTINGS);
        });
    });

    describe("DEFAULT_SETTINGS – inner objects", function () {
        it("are frozen", function () {
            for (const defaultSetting of Object.values(DEFAULT_SETTINGS)) {
                // if it cannot be frozen (if no object or so) ignore it
                if (!isPlainObject(defaultSetting)) {
                    continue;
                }

                chai.assert.isFrozen(defaultSetting);
            }
        });
    });
});
