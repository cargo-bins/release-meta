import {expect, test} from '@jest/globals';
import {runAction} from './runAction';

test('no event data', () => {
	expect(() => runAction({})).toThrow();
});

test('bad event data', () => {
	expect(() =>
		runAction({
			'event-data': 'not json'
		})
	).toThrow();
});

test('event data for something not a pull request', () => {
	expect(() =>
		runAction({
			'event-data': JSON.stringify({action: 'not a pull request'})
		})
	).toThrow();
});

test('pull request without a body', () => {
	expect(() =>
		runAction({
			'event-data': JSON.stringify({pull_request: {}})
		})
	).toThrow();
});

test('pull request with an empty body', () => {
	const output = runAction({
		'event-data': JSON.stringify({pull_request: {body: ''}})
	});

	expect(output).toMatchObject({
		'is-release': 'false'
	});
});

test('pull request with no metadata', () => {
	const output = runAction({
		'event-data': JSON.stringify({
			pull_request: {
				body: `
		This is a pull request, but it doesn't have any release-pr metadata.
		`
			}
		})
	});

	expect(output).toMatchObject({
		'is-release': 'false'
	});
});

test("pull request with a first comment that's not JSON", () => {
	const output = runAction({
		'event-data': JSON.stringify({
			pull_request: {
				body: `
		<!-- not json -->
		This is a pull request, but it doesn't have any release-pr metadata.
		`
			}
		})
	});

	expect(output).toMatchObject({
		'is-release': 'false'
	});
});

test("pull request with a first comment that's not release-pr JSON", () => {
	const output = runAction({
		'event-data': JSON.stringify({
			pull_request: {
				body: `
		<!-- {"something":"else"} -->
		This is a pull request, but it doesn't have any release-pr metadata.
		`
			}
		})
	});

	expect(output).toMatchObject({
		'is-release': 'false'
	});
});

test("comment JSON that's missing some fields", () => {
	const output = runAction({
		'event-data': JSON.stringify({
			pull_request: {
				body: `
		<!-- {"release-pr":{"v2":{"version":{"actual":"1","desired":"2","previous":"3"}}}} -->
		This is a pull request
		`
			}
		})
	});

	expect(output).toMatchObject({
		'is-release': 'false'
	});
});

test('comment JSON with no crates', () => {
	const output = runAction({
		'event-data': JSON.stringify({
			pull_request: {
				body: `
		<!-- {"release-pr":{"v2":{"version":{"actual":"1.2.1","desired":"patch","previous":"1.2.0"},"crates":[]}}} -->
		This is a pull request
		`
			}
		})
	});

	expect(output).toMatchObject({
		'is-release': 'false'
	});
});

test('comment JSON with no version data', () => {
	const output = runAction({
		'event-data': JSON.stringify({
			pull_request: {
				body: `
		<!-- {"release-pr":{"v2":{"crates":[{"name":"foo","path":"/foo"}]}}} -->
		This is a pull request
		`
			}
		})
	});

	expect(output).toMatchObject({
		'is-release': 'false'
	});
});
