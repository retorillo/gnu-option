# gnu-option

[![Build Status](https://travis-ci.org/retorillo/gnu-option.svg?branch=master)](https://travis-ci.org/retorillo/gnu-option)
[![Coverage Status](https://coveralls.io/repos/github/retorillo/gnu-option/badge.svg?branch=master)](https://coveralls.io/github/retorillo/gnu-option?branch=master)
[![NPM](https://img.shields.io/npm/v/gnu-option.svg)](https://www.npmjs.com/package/gnu-option)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A simple parser for GNU style command line options

- Supports GNU style long options that start with two dashes. (eg. `--file="filename"` or `--file filename`)
- Supports POSIX style options that start with one dash. (eg. `-cf filename` or `-c -f filename`)

```javascript
const gnuopt = require('gnu-option');

const tar_optmap = {
  'c': '&create', // -c is alias of --create
    // leading ampersand(&) means an alias
  'create': 'switch', // --create is switch
  'f': '&file', // -f is alias of --file
  'file': 'file', // file is string typed value
};

gnuopt.parse(['-cf', 'npmdir.tar', 'npmdir'], tar_optmap);
// { create: 1, file: 'npmdir.tar',  $: ['npmdir'] }

const sed_optmap = {
  'e': '&expression', // -e is alias of --expression
  'expression': '*string', // --expression is string
    // leading asterisk(*) means that such a option can appear multiple times
  'r': '&regex-extended', // -r is alias of --regex-extended
  'regex-extended': 'switch', // --regex-extended is switch
}

gnuopt.parse(['-re', 's/a/b/', '-e', 's/b/c/'], sed_optmap);
// { 'regex-extended': 1, 'expression': [ 's/a/b/', 's/b/c/' ], $: [] }

gnuopt.parse(sed_optmap);
// When only optmap is specified, process.argv.splice(2) is used
```

## optmap

`optmap` (option map) is an important argument of `parse` method.
Represents definition map including type and alias informations.

For example, `--help` and `-c` options like `bash` can be defined as follow:

```javascript
var optmap = {
  'h': '&help',
  'help': 'switch'
  'c': '&command',
  'command', '~string'
}
```

### Alias definition

To define aliaes (eg. `--h` for `--help`), use a combination between leading
amphersand and target option name.

On the following example, `able` refers `baker`, `baker` refers
`charile`, `charlie` refers `dog`, and ...

```javascript
var optmap = {
  able: '&baker',
  baker: '&charile',
  charile: '&dog',
  //...
}
```

**NOTE:**
If reference is looped, [CircularReferenceError](#circularreferenceerror) will
be thrown to prevent infinite loop.

## Type definition

Avaiable built-in types are the followings:

- `string`: accepts any string value without type specific verification.
- `number`: accepts numerical value (parsed by `parseFloat`)
- `integer`: accepts integral value (parsed by `parseInt`)
- `switch`: `switch` typed option never have its value. Similar to `-f` option
  of `rm` command.

#### Leading tilde before type name

Leading tilde `~` means that such a option subsequently collect the all thing as
its value. Similar to `-c` option of `bash`.

```
gnuopt.parse(['-c', 'curl', '-o', 'foo.bar', 'http://foo.bar/'], {
  c: '~string'
});
// { c: [ 'curl', '-o', 'foo.bar', 'http://foo.bar/' ] }
```

#### Leading asterisk before type name

Leading asterisk `*` means that such a option can be present multiple times.
By default, throws `InvalidRepetationError` when same named option are present.

```
gnuopt.parse(['-d', 'dup1', '-d', 'dup2'], { d: '*string' });
// { d: ['dup1', 'dup2'] }
```

**NOTE:** Because `switch` does not own no value, `*switch` is commonly strange.
Therefore `*switch` is treated as special: its value will represent number of
its occurences.

```
gnuopt.parse('-ccccc', { c: '*switch' });
// { c: 5 }
```

## Errors

The following errors will be thrown when verification is failed.
Each errors has some properties to determine which options was related with it.

### InvalidValueError

Thrown when value is not valid type.

- `name`: `'InvalidValueError'`
- `option`: related option name excluding leading dashes
- `value`: actual invalid value of option
- `type`: expected type of option

### InvalidRepetationError

Thrown when same named options will be specified multiple times unless asterisk
`*` is specified.

- `name`: `'InvalidRepetationError'`
- `option`: related option name excluding leading dashes

### UndefinedTypeError

Thrown when undefined type is specified on `optmap`

- `name`: `'UndefinedTypeError'`
- `option`: related option name excluding leading dashes
- `type`: undefined type name of option

### CircularReferenceError

Thrown when ampersand-reference is looped on `optmap`

- `name`: `'CircularReferenceError'`
- `option`: related option name excluding leading dashes
- `route`: array of referred option aliases

## Tips

If you want to first argument treat as a command like `git`,

use `process.argv[3]` to determine `command`,
and use `process.argv.splice(3) for `parse` method.

```javascript
const gnuopt = require('gnu-option')
var optmap;
switch (process.argv[3]) {
  case 'foo':
    optmap = { /* optmap for foo command */ }
    break;
  case 'bar':
    optmap = { /* optmap for bar command */ }
    break;
}
gnuopt.parse(process.argv.splice(3), optmap);
```

## Known Issue

Cannot correctly parse when including POSIX option that immediately followed by
its value like `-A5`. In this case, both `A` and `5` will be treated as option
name. I will fix this issue in the future release.

## License

Distributed under the MIT license

Copyright (C) 2016 Retorillo
