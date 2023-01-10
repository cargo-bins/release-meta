import {expect, test} from '@jest/globals';
import {runAction} from './runAction';

test('typical input without notes', () => {
	const output = runAction({
		'event-data': JSON.stringify({
			pull_request: {
				body: `
				<!-- {"release-pr":{"v2":{"crates":[{"name":"foo","path":"/runner/foo"},{"name":"bar","path":"workspace/bar"}],"version":{"previous":"0.1.0","desired":"minor","actual":"0.2.0"}}}} -->
			`
			}
		})
	});

	expect(output).toMatchObject({
		'is-release': 'true',
		crates: JSON.stringify([
			{name: 'foo', path: '/runner/foo'},
			{name: 'bar', path: 'workspace/bar'}
		]),
		version: JSON.stringify({
			previous: '0.1.0',
			desired: 'minor',
			actual: '0.2.0'
		}),
		'crates-names': 'foo,bar',
		'crates-paths': '/runner/foo:workspace/bar',
		'version-actual': '0.2.0',
		'version-desired': 'minor',
		'version-previous': '0.1.0'
	});
});

test('multiline input without notes', () => {
	const output = runAction({
		'event-data': JSON.stringify({
			pull_request: {
				body: `
				<!-- {
					"release-pr":{"v2":{
						"crates":[{"name":"foo","path":"/runner/foo"},{"name":"bar","path":"workspace/bar"}],
						"version":{"previous":"0.1.0","desired":"minor","actual":"0.2.0"}}}} -->
			`
			}
		})
	});

	expect(output).toMatchObject({
		'is-release': 'true',
		crates: JSON.stringify([
			{name: 'foo', path: '/runner/foo'},
			{name: 'bar', path: 'workspace/bar'}
		]),
		version: JSON.stringify({
			previous: '0.1.0',
			desired: 'minor',
			actual: '0.2.0'
		}),
		'crates-names': 'foo,bar',
		'crates-paths': '/runner/foo:workspace/bar',
		'version-actual': '0.2.0',
		'version-desired': 'minor',
		'version-previous': '0.1.0'
	});
});

test('typical input with notes (under header)', () => {
	const output = runAction({
		'event-data': JSON.stringify({
			pull_request: {
				body: `
				<!-- {"release-pr":{"v2":{"crates":[{"name":"foo","path":"/runner/foo"},{"name":"bar","path":"workspace/bar"}],"version":{"previous":"0.1.0","desired":"minor","actual":"0.2.0"}}}} -->

### Release notes
- good stuff
- bad stuff
			`
			}
		}),
		'extract-notes-under': '### Release notes'
	});

	expect(output).toMatchObject({
		'is-release': 'true',
		crates: JSON.stringify([
			{name: 'foo', path: '/runner/foo'},
			{name: 'bar', path: 'workspace/bar'}
		]),
		version: JSON.stringify({
			previous: '0.1.0',
			desired: 'minor',
			actual: '0.2.0'
		}),
		'crates-names': 'foo,bar',
		'crates-paths': '/runner/foo:workspace/bar',
		'version-actual': '0.2.0',
		'version-desired': 'minor',
		'version-previous': '0.1.0',
		notes: '- good stuff\n- bad stuff'.replace(/\n/g, '%0A')
	});
});

test('multiline input with notes (under comment)', () => {
	const output = runAction({
		'event-data': JSON.stringify({
			pull_request: {
				body: `
				<!-- {
					"release-pr":{"v2":{
						"crates":[{"name":"foo","path":"/runner/foo"},{"name":"bar","path":"workspace/bar"}],
						"version":{"previous":"0.1.0","desired":"minor","actual":"0.2.0"}}}} -->

<!-- release notes below -->
- good stuff
- bad stuff
			`
			}
		}),
		'extract-notes-under': '<!-- release notes below -->'
	});

	expect(output).toMatchObject({
		'is-release': 'true',
		crates: JSON.stringify([
			{name: 'foo', path: '/runner/foo'},
			{name: 'bar', path: 'workspace/bar'}
		]),
		version: JSON.stringify({
			previous: '0.1.0',
			desired: 'minor',
			actual: '0.2.0'
		}),
		'crates-names': 'foo,bar',
		'crates-paths': '/runner/foo:workspace/bar',
		'version-actual': '0.2.0',
		'version-desired': 'minor',
		'version-previous': '0.1.0',
		notes: '- good stuff\n- bad stuff'.replace(/\n/g, '%0A')
	});
});
