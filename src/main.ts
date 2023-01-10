import {setFailed, debug, setOutput} from '@actions/core';
import {Parser} from 'htmlparser2';
import {object, string, array} from 'yup';

import getInputs from './schema';

(async () => {
	try {
		const inputs = await getInputs();

		const body = inputs?.eventData?.pull_request?.body;
		if (typeof body !== 'string') throw new Error('Event data input is malformed');

		const releaseData = await extractReleaseData(body);
		const releaseNotes = inputs.extractNotesUnder
			? extractReleaseNotes(body, inputs.extractNotesUnder)
			: null;

		if (!releaseData) {
			setOutput('is-release', 'false');
			return;
		}

		setOutput('is-release', 'true');

		setOutput('crates', JSON.stringify(releaseData.crates));
		setOutput('version', JSON.stringify(releaseData.version));

		setOutput(
			'crates-names',
			releaseData.crates.map(crate => crate.name).join(',')
		);
		setOutput(
			'crates-paths',
			releaseData.crates.map(crate => crate.path).join(':')
		);

		setOutput('version-actual', releaseData.version.actual);
		setOutput('version-desired', releaseData.version.desired);
		setOutput('version-previous', releaseData.version.previous);

		if (releaseNotes) setOutput('notes', releaseNotes);
	} catch (error: unknown) {
		if (error instanceof Error) setFailed(error.message);
		else if (typeof error === 'string') setFailed(error);
		else setFailed('An unknown error has occurred');
	}
})();

async function extractReleaseData(prBody: string): Promise<CrateData | false> {
	let foundComment = false;
	return new Promise(resolve => {
		const parser = new Parser({
			oncomment: (comment: string) => {
				if (foundComment) return;
				foundComment = true;

				debug(`Found comment: ${comment}`);
				resolve(parseComment(comment));
			},
			onend: () => {
				if (!foundComment) resolve(false);
			},
			onerror: () => {
				if (!foundComment) resolve(false);
			}
		});
		parser.write(prBody);
		parser.end();
	});
}

function parseComment(comment: string): CrateData | false {
	try {
		debug('parsing comment');
		const data = JSON.parse(comment);
		debug('parsed');
		const v2 = V2_SCHEMA.validateSync(data['release-pr']?.v2);
		if (!v2) return false;

		debug('validated');
		return v2;
	} catch (err) {
		debug(`Failed to parse comment: ${err}`);
		return false;
	}
}

const V2_SCHEMA = object({
	crates: array()
		.of(
			object({
				name: string().required(),
				path: string().required()
			})
		)
		.min(1)
		.required(),
	version: object({
		actual: string().required(),
		desired: string().required(),
		previous: string().required()
	}).required()
});

function extractReleaseNotes(
	prBody: string,
	extractNotesUnder: string
): string | false {
	const lines = prBody.split(/\r?\n/);
	const index = lines.findIndex(line => line.trim() === extractNotesUnder);
	if (index === -1) return false;
	return lines.slice(index + 1).join('\n').trim();
}

interface CrateData {
	crates: Crate[];
	version: Version;
}

interface Crate {
	name: string;
	path: string;
}

interface Version {
	actual: string;
	desired: string;
	previous: string;
}
