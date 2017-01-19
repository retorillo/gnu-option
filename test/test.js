'use strict';

var should = require('should');
var gnuopt = require('../');

function parseInterval(value) {
  var m = /^([0-9]+)([hm])$/i.exec(value);
  if (!m)
    throw new Error(`${value} is invalid`);
  return [parseInt(m[1]), m[2]]
}

var sources = {
  "parse()": [
    {
      it: 'Parse POSIX options',
      method: gnuopt.parse,
      input: [
        [ 'able', 'baker', '-abc', 'charlie' ],
        { a: 'switch', b: 'switch', c: 'string' }
      ],
      expected: { $:['able', 'baker'], a: 1, b: 1, c: 'charlie', }
    },
    {
      it: 'Parse string options',
      input: [
        [ '-a', 'able', '-b', 'baker', '-c', 'charlie' ],
        { a: 'string', b: 'string', c: 'string' }
      ],
      expected: { $:[],  a: 'able', b: 'baker', c: 'charlie', }
    },
    {
      it: 'Parse string options with pathes',
      input: [
        [ 'path0', '-a', 'able', 'path1', '-b', 'baker', 'path2'],
        { a: 'string', b: 'string' }
      ],
      expected: { $: ['path0', 'path1', 'path2'], a: 'able', b: 'baker' }
    },
    {
      it: 'Parse number options',
      input: [
        [ '-a', '1.23', '-b', '4' ],
        { a: 'number', b: 'integer',  }
      ],
      expected: { $:[],  a: 1.23, b: 4, }
    },
    {
      it: "Parse custom type",
      input: [
        [ "--interval", "30m" ],
        { interval: parseInterval }
      ],
      expected: { $: [], interval: [ 30 , 'm' ] }
    },
    {
      it: 'Parse GNU long options without equal sign',
      input: [
        [ '--able', 'able1', '-a', 'able2', '--ab', 'able3' ],
        { able: '*string', a: '&ab', ab: '&able' },
      ],
      expected: { $: [], able: [ 'able1', 'able2', 'able3' ] },
    },
    {
      it: 'Parse GNU long options with equal sign',
      input: [
        [ '--able=able1', '-a', 'able2', '--ab=able3' ],
        { able: '*string', a: '&ab', ab: '&able' },
      ],
      expected: { $: [], able: [ 'able1', 'able2', 'able3' ] },
    },
    {
      it: 'Parse bash -c like switch (~string)',
      input: [
        [ '-a', 'able', '-c', 'baker', '--charie' ],
        { a: 'string', c: '~string' }
      ],
      expected: { $:[], a: 'able', c: ['baker', '--charie'], }
    },
    {
      it: 'Parse bash -c like switch (~integer)',
      input: [
        [ '-a', 'able', '-c', '1', '2' ],
        { a: 'string', c: '~integer' }
      ],
      expected: { $:[], a: 'able', c: [1, 2], }
    },
    {
      it: 'Parse options with optmap wildcard',
      input: [
        [ 'able', 'baker', '-abc', '1', '-d', '2' ],
        { a: 'switch', b: 'switch', '-': 'number' }
      ],
      expected: { $:['able', 'baker'], a: 1, b: 1, c: 1, d: 2 }
    },
    {
      it: 'Parse by automatically using process.argv',
      input: [
        { }
      ],
      expected: { $:[] }
    },
    {
      it: 'Parse options by switch* (must be number of occurence)',
      input: [
        [ '-cccddd', 'filename1', '--able', '-dda', 'filename2' ],
        { a: '*switch', able: '&a', c: '*switch', d: '*switch' },
      ],
      expected: { $:[ 'filename1', 'filename2' ], a:2, c:3, d:5, }
    },
    {
      it: 'Throw InvalidValueError when value is no specified (middle of arguments)',
      method: (args, opt) => {
        try {
          gnuopt.parse(args, opt)
          return 'SUCCESS'
        }
        catch (e) {
          return [e.name, e.option, e.type, e.value, e.route];
        }
      },
      input: [
        [ '-n', '-b'  ],
        { 'n': 'string', 'b': 'string' },
      ],
      expected: [ 'InvalidValueError', 'n', 'string', undefined, undefined ],
    },
    {
      it: 'Throw InvalidValueError when value is no specified (end of arguments)',
      input: [
        [ '-n', 'noproblem', '-b'  ],
        { 'n': 'string', 'b': 'string' },
      ],
      expected: [ 'InvalidValueError', 'b', 'string', undefined, undefined ],
    },
    {
      it: 'Throw InvalidValueError when value is invalid(number)',
      input: [
        [ '-n', 'string' ],
        { 'n': '&number', number: 'number' },
      ],
      expected: [ 'InvalidValueError', 'n', 'number', 'string', undefined ],
    },
    {
      it: 'Throw InvalidValueError when value is invalid(integer)',
      input: [
        [ '-n', 'string' ],
        { 'n': '&number', number: 'integer' },
      ],
      expected: [ 'InvalidValueError', 'n', 'integer', 'string', undefined ],
    },
    {
      it: 'Throw InvalidValueError when value is invalid(string)',
      input: [
        [ '-s' ],
        { 's': '&str', str: 'string' },
      ],
      expected: [ 'InvalidValueError', 's', 'string', undefined, undefined ],
    },
    {
      it: 'Throw InvalidValueError when `~switch` because switch cannnot have its value',
      input: [
        [ '-s', 'use', ],
        { s: '~switch' }
      ],
      expected: [ 'InvalidValueError', 's', 'switch', 'use', undefined ],
    },
    {
      it: 'Throw InvalidValueError with custom type',
      input: [
        [ '--interval', '30k'  ],
        { interval: parseInterval },
      ],
      expected: [ 'InvalidValueError', 'interval', parseInterval, '30k', undefined ],
    },
    {
      it: 'Throw UndefinedTypeError when type is undefined',
      input: [
        [ '-d', 'unkownValue' ],
        { d: 'unknownType' }
      ],
      expected: [ 'UndefinedTypeError', 'd', 'unknownType', undefined, undefined],
    },
    {
      it: 'Throw UndefinedTypeError when option is not correctly defined',
      input: [
        [ '-d' ],
        { }
      ],
      expected: [ 'UndefinedTypeError', 'd', undefined, undefined, undefined],
    },
    {
      it: 'Throw UndefinedTypeError when unreachable reference regardless of optmap wildcard',
      input: [
        [ '-d' ],
        { d: '&unkown', '-': 'switch' }
      ],
      expected: [ 'UndefinedTypeError', 'd', '&unkown', undefined, undefined],
    },
    {
      it: 'Throw InvalidRepetationError when option is specified multiple times without asterisk',
      input: [
        [ '-a', 'str1', '-a', 'str2' ],
        { a: 'string' }
      ],
      expected: [ 'InvalidRepetationError', 'a', undefined, undefined, undefined ],
    },
    {
      it: 'Throw CircularReferenceError when circular reference',
      input: [
        [ '-a' ],
        { a: '&b', b: '&c', c: '&a' }
      ],
      expected: [ 'CircularReferenceError', 'a', undefined, undefined, [ 'a', 'b', 'c', 'a' ] ],
    },
  ],
}

var lastm;
for (let desc in sources) {
  describe(desc, function() {
    for (let test of sources[desc]) {
      it(test.it, function() {
        var p = (test.method ? lastm = test.method : lastm).apply(this, test.input || []);
        should(p).be.eql(test.expected);
      });
    }
  });
}
