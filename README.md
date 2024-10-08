# @firefoxic/utils

[![License: MIT][license-image]][license-url]
[![Changelog][changelog-image]][changelog-url]
[![NPM version][npm-image]][npm-url]
[![Test Status][test-image]][test-url]

Collection of useful utilities for JavaScript and Node.js.

## Installation

```shell
pnpm add -D @firefoxic/utils
```

## Usage

### `getProjectRoot`

Your action should set the `REPO_NAME` environment variable to the step you want. If your action works with pull requests, you should also add two lines (which are marked below with a special comment) to use the `PR_NUMBER` variable. For example:

```yaml
jobs:
  job_name:
    runs-on: ubuntu-latest
    steps:

      # Any steps before building a project

      - name: Build project
        run: pnpm build
        env:
          REPO_NAME: ${{ github.event.repository.name }}
          PR_NUMBER: ${{ github.event.pull_request.number }}     # For PR action

      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: ./dist
          branch: gh-pages
          target-folder: ${{ github.event.pull_request.number }} # For PR action
```

Than you can get the path to the project root when deploying to GitHub Pages, for example in `vite.config.js`:

```js
import { defineConfig } from "vite"
import { getProjectRoot } from "@firefoxic/utils"

export default defineConfig({
	base: `${getProjectRoot()}/`,
})
```

### `setGitHubEnvVar`

Your action must accept the environment variable you pass into it from the JS. For example, you can pass the path to the distribution directory from the `vite.config.js`:

```js
import { defineConfig } from "vite"

import { setGitHubEnvVar } from "@firefoxic/utils"

const PATH_TO_SRC = `./a_very_strange_path_to_source`
const PATH_TO_DIST = `./a_very_strange_path_to_dist`

setGitHubEnvVar(`PATH_TO_DIST`, PATH_TO_DIST)

export default defineConfig({
	root: PATH_TO_SRC,
	build: {
		outDir: `.${PATH_TO_DIST}`,
	},
})
```

Then you can use this variable in the deploy step of your action:

```yaml
jobs:
  job_name:
    runs-on: ubuntu-latest
    steps:

      # Any steps before deploying a project

      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: ${{ env.PATH_TO_DIST }}
          branch: gh-pages
```

[license-url]: https://github.com/firefoxic/utils/blob/main/LICENSE.md
[license-image]: https://img.shields.io/badge/License-MIT-limegreen.svg

[changelog-url]: https://github.com/firefoxic/utils/blob/main/CHANGELOG.md
[changelog-image]: https://img.shields.io/badge/CHANGELOG-md-limegreen

[npm-url]: https://npmjs.org/package/@firefoxic/utils
[npm-image]: https://badge.fury.io/js/@firefoxic%2Futils.svg

[test-url]: https://github.com/firefoxic/utils/actions
[test-image]: https://github.com/firefoxic/utils/actions/workflows/test.yaml/badge.svg?branch=main
