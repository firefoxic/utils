<!-- markdownlint-disable MD007 MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The minimum required `node.js` version has been increased to `20.12.0`, except for version `21`.

## [0.4.0] — 2024–05–12

### Added

- The `setGitHubEnvVar` utility that adds the specified environment variable with the specified value if the `CI` environment variable is set.

## [0.3.0] — 2024–05–11

### Changed

- The `update-changelog` CLI utility has been moved to the [`@firefoxic/update-changelog`](https://github.com/firefoxic/update-changelog#readme) project.

## [0.2.0] — 2024–05–07

### Added

- The `getProjectRoot` utility that returns the subdirectory to which the frontend project is deployed on GitHub Pages.

## [0.1.1] — 2024–05–03

### Fixed

- Creating links for the first version in `update-changelog`.

## [0.1.0] — 2024–04–26

### Added

- The `update-changelog` CLI utility.

[Unreleased]: https://github.com/firefoxic/utils/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/firefoxic/utils/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/firefoxic/utils/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/firefoxic/utils/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/firefoxic/utils/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/firefoxic/utils/releases/tag/v0.1.0
