"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const yup_1 = require("yup");
const SCHEMA = (0, yup_1.object)({
    eventData: (0, yup_1.string)().required(),
    extractNotesUnder: (0, yup_1.string)().optional()
}).noUnknown();
async function getInputs() {
    (0, core_1.debug)('validating inputs');
    const inputs = await SCHEMA.validate({
        eventData: (0, core_1.getInput)('event-data'),
        extractNotesUnder: (0, core_1.getInput)('extract-notes-under')
    });
    (0, core_1.debug)(`inputs: ${JSON.stringify(inputs)}`);
    return {
        eventData: JSON.parse(inputs.eventData),
        extractNotesUnder: inputs.extractNotesUnder
    };
}
exports.default = getInputs;
