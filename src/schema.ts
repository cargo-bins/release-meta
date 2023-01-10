import {debug, getInput} from '@actions/core';
import {object, string} from 'yup';

const SCHEMA = object({
	eventData: string().required(),
	extractNotesUnder: string().optional(),
}).noUnknown();

export default async function getInputs(): Promise<InputsType> {
	debug('validating inputs');
	const inputs = await SCHEMA.validate({
		eventData: getInput('event-data'),
		extractNotesUnder: getInput('extractNotesUnder'),
	});

	debug(`inputs: ${JSON.stringify(inputs)}`);
	return {
		eventData: JSON.parse(inputs.eventData),
		extractNotesUnder: inputs.extractNotesUnder,
	};
}

export interface InputsType {
	eventData: EventData;
	extractNotesUnder: string;
}

export interface EventData {
	action: string;
	number: number;
	pull_request: PullRequestData;
}

export interface PullRequestData {
	body?: string;
}
