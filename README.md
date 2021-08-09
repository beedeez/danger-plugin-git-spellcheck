# danger-plugin-git-spellcheck

[![Build Status](https://travis-ci.org/Ccccclong/danger-plugin-git-spellcheck.svg?branch=master)](https://travis-ci.org/Ccccclong/danger-plugin-git-spellcheck)
[![npm version](https://badge.fury.io/js/danger-plugin-git-spellcheck.svg)](https://badge.fury.io/js/danger-plugin-git-spellcheck)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> This plugin checks the spelling in code and reports any error as markdown PR comment.

## Usage

Install:

```sh
yarn add danger-plugin-git-spellcheck --dev
```

At a glance:

```js
// dangerfile.js
import gitSpellcheck from "danger-plugin-git-spellcheck";

gitSpellcheck();
```

Configuration:

This plugin use the [cspell](https://github.com/streetsidesoftware/cspell) library under the hood to perform spellchecking, which can be configured using a `cspell.json` configuration file. Please see [here](https://www.npmjs.com/package/cspell) for more details on cspell configuration.

```json
// cSpell Settings
{
  // Version of the setting file.  Always 0.1
  "version": "0.1",
  // language - current active spelling language
  "language": "en",
  // words - list of words to be always considered correct
  "words": [
    "mkdirp",
    "tsmerge",
    "githubusercontent",
    "streetsidesoftware",
    "vsmarketplacebadge",
    "visualstudio"
  ],
  // flagWords - list of words to be always considered incorrect
  // This is useful for offensive words and common spelling errors.
  // For example "hte" should be "the"
  "flagWords": ["hte"]
}
```

## Changelog

See the GitHub [release history](https://github.com/Ccccclong/danger-plugin-git-spellcheck/releases).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
