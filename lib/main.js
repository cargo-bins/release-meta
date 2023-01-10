"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const htmlparser2_1 = require("htmlparser2");
const yup_1 = require("yup");
const schema_1 = __importDefault(require("./schema"));
(async () => {
    var _a, _b;
    try {
        const inputs = await (0, schema_1.default)();
        const body = (_b = (_a = inputs === null || inputs === void 0 ? void 0 : inputs.eventData) === null || _a === void 0 ? void 0 : _a.pull_request) === null || _b === void 0 ? void 0 : _b.body;
        if (typeof body !== 'string')
            throw new Error('Event data input is malformed');
        const releaseData = await extractReleaseData(body);
        const releaseNotes = inputs.extractNotesUnder
            ? extractReleaseNotes(body, inputs.extractNotesUnder)
            : null;
        if (!releaseData) {
            (0, core_1.setOutput)('is-release', 'false');
            return;
        }
        (0, core_1.setOutput)('is-release', 'true');
        (0, core_1.setOutput)('crates', JSON.stringify(releaseData.crates));
        (0, core_1.setOutput)('version', JSON.stringify(releaseData.version));
        (0, core_1.setOutput)('crates-names', releaseData.crates.map(crate => crate.name).join(','));
        (0, core_1.setOutput)('crates-paths', releaseData.crates.map(crate => crate.path).join(':'));
        (0, core_1.setOutput)('version-actual', releaseData.version.actual);
        (0, core_1.setOutput)('version-desired', releaseData.version.desired);
        (0, core_1.setOutput)('version-previous', releaseData.version.previous);
        if (releaseNotes)
            (0, core_1.setOutput)('notes', releaseNotes);
    }
    catch (error) {
        if (error instanceof Error)
            (0, core_1.setFailed)(error.message);
        else if (typeof error === 'string')
            (0, core_1.setFailed)(error);
        else
            (0, core_1.setFailed)('An unknown error has occurred');
    }
})();
async function extractReleaseData(prBody) {
    let foundComment = false;
    return new Promise(resolve => {
        const parser = new htmlparser2_1.Parser({
            oncomment: (comment) => {
                if (foundComment)
                    return;
                foundComment = true;
                (0, core_1.debug)(`Found comment: ${comment}`);
                resolve(parseComment(comment));
            },
            onend: () => {
                if (!foundComment)
                    resolve(false);
            },
            onerror: () => {
                if (!foundComment)
                    resolve(false);
            }
        });
        parser.write(prBody);
        parser.end();
    });
}
function parseComment(comment) {
    var _a;
    try {
        (0, core_1.debug)('parsing comment');
        const data = JSON.parse(comment);
        (0, core_1.debug)('parsed');
        const v2 = V2_SCHEMA.validateSync((_a = data['release-pr']) === null || _a === void 0 ? void 0 : _a.v2);
        if (!v2)
            return false;
        (0, core_1.debug)('validated');
        return v2;
    }
    catch (err) {
        (0, core_1.debug)(`Failed to parse comment: ${err}`);
        return false;
    }
}
const V2_SCHEMA = (0, yup_1.object)({
    crates: (0, yup_1.array)()
        .of((0, yup_1.object)({
        name: (0, yup_1.string)().required(),
        path: (0, yup_1.string)().required()
    }))
        .min(1)
        .required(),
    version: (0, yup_1.object)({
        actual: (0, yup_1.string)().required(),
        desired: (0, yup_1.string)().required(),
        previous: (0, yup_1.string)().required()
    }).required()
});
function extractReleaseNotes(prBody, extractNotesUnder) {
    const lines = prBody.split(/\r?\n/);
    const index = lines.findIndex(line => line.trim() === extractNotesUnder);
    if (index === -1)
        return false;
    return lines
        .slice(index + 1)
        .join('\n')
        .trim();
}
