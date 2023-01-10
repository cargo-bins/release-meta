# Action: release-meta

A companion action to [release-pr] to extract metadata from Release PRs created by that action.

[release-pr]: https://github.com/cargo-bins/release-pr
[release-rust]: https://github.com/cargo-bins/release-rust

## Purpose

This action expects to be on a `pull_request: closed` workflow, where it will read the body of the
PR and, if it is a release PR as created by the [release-pr] action (or compatible), parse the
embedded metadata and optional release notes and return all that as outputs.

These outputs can then be used to perform other actions (we recommend our [release-rust] action!).

See the `onrelease` workflow in test repo for [a complete example](https://github.com/passcod/cargo-release-pr-test/blob/main/.github/workflows/onrelease.yml).

## Usage

```yaml
name: On release
on:
  pull_request:
    types: closed
    branches: [main] # target branch of release PRs

jobs:
  info:
    if: ${{ github.event.merged }}

    outputs: # specific fields extracted from the action's outputs
      is-release: ${{ steps.meta.outputs.is-release }}
      crate: ${{ steps.meta.outputs.crate-names }}
      version: ${{ steps.meta.outputs.version-actual }}
      notes: ${{ steps.meta.outputs.notes }}

    runs-on: ubuntu-latest
    steps:
    - id: meta
      uses: cargo-bins/release-meta@v1
      with:
        event-data: ${{ toJSON(github.event) }}
        extract-notes-under: '### Release notes'

  release:
    needs: info
    if: needs.info.is-release == 'true'
    # ...
```

The action needs no dependencies and can run on any runner platform.

## Inputs

| Name | Type | Default | Description |
|:-|:-:|:-:|:-|
| `event-data` | String | _required_ | The event data. This should always be `${{ toJSON(github.event) }}` |
| `extract-notes-under` | String | _optional_ | The content of a whole line of the PR body. If that line is found, anything below it will be extracted as the "release notes". |

## Outputs

All outputs of a Github Action are strings.

| Name | Description |
|:-|:-|
| `is-release` | The strings `true` or `false` indicating if the PR is a release-pr with attached metadata. If `false` none of the other outputs are populated, but the action still succeeds. |
| `crates` | JSON of an array of Crate objects, containing a `name` string (name of the crate) and `path` string (path to the crate). |
| `version` | JSON of an object with keys: `actual` (string, the version that was released), `desired` (string, either the same as `actual` or the strings `minor`, `patch`, etc), `previous` (string, the version the crate was at before that release). |
| `notes` | If `extract-notes-under` and its corresponding section in the PR body were present, the content of that section. |
| `crates-names` | For convenience, the values of `crates.*.name`, comma-separated. |
| `crates-paths` | For convenience, the values of `crates.*.path`, newline-separated. |
| `version-actual` | For convenience, the value of `version.actual`. |
| `version-desired` | For convenience, the value of `version.desired`. |
| `version-previous` | For convenience, the value of `version.previous`. |
