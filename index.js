// Distributed under the MIT license
// Copyright (C) 2016 Retorillo

module.exports = {
  parse: parse,
  InvalidValueError: InvalidValueError,
  InvalidRepetationError: InvalidRepetationError,
  UndefinedTypeError: UndefinedTypeError,
  CircularReferenceError: CircularReferenceError
}
function parse() {
  var args, optmap;
  if (arguments.length == 1 && typeof(arguments[0]) === 'object') {
    args = process.argv.splice(2);
    optmap = arguments[0];
  }
  else {
    args = arguments[0];
    optmap = arguments[1];
  }
  var opt = { $: [] };
  var last = null;
  for (var a of gnuargs(args)) {
    if (last && last.sign === '~') {
      if (opt[last.name] === undefined)
        opt[last.name] = [];
      opt[last.name].push(last.value = parseValue(a, last.type, last.origin));
    }
    else if (/^-/.test(a)) {
      if (last && last.value === undefined)
        throw new InvalidValueError(last.origin, last.type, undefined);
      var names = /^--/.test(a) ? [ a.substr(2) ] : a.substr(1).split(/(?=)/);
      for (var name of names) {
        last = solve(optmap, name);
        if (last.name in opt) {
          if (!last.sign)
            throw new InvalidRepetationError(last.origin, last.type);
          if (last.type === 'switch')
            last.value = ++opt[last.name];
        }
        else {
          if (last.type === 'switch')
            last.value = opt[last.name] = 1;
          else
            last.value = opt[last.name] = undefined;
        }
      }
    }
    else {
      if (!last || last.value)
        opt.$.push(a);
      else if (last.sign === '*') {
        if (opt[last.name] === undefined)
          opt[last.name] = [];
        opt[last.name].push(last.value = parseValue(a, last.type, last.origin));
      }
      else
        opt[last.name] = last.value = parseValue(a, last.type, last.origin);
    }
  }
  if (last && last.value == undefined)
    throw new InvalidValueError(last.origin, last.type, undefined)
  return opt;
}
function parseValue(value, type, origin) {
  switch (type) {
    case 'string':
      return value;
    case 'number':
      var f = parseFloat(value);
      if (isNaN(f))
        throw new InvalidValueError(origin, type, value);
      return  f;
    case 'integer':
      var i = parseInt(value);
      if (isNaN(i))
        throw new InvalidValueError(origin, type, value);
      return i;
    case 'switch':
      throw new InvalidValueError(origin, type, value);
    default: {
      if (typeof(type) === 'function') {
        try {
          return type.apply(origin, [value]);
        }
        catch (e) {
          throw new InvalidValueError(origin, type, value, e);
        }
      }
      throw new UndefinedTypeError(origin, type);
    }
  }
}
function solve(optmap, name){
  const origin = name;
  var type = optmap[name] || optmap['-'];
  if (!type)
    throw new UndefinedTypeError(origin);
  var refs = [ '&' + origin ]
  while (/^&/.test(type)) {
    if (refs.indexOf(type) != -1) {
      refs.push(type);
      throw new CircularReferenceError(origin,
        refs.map(r => { return r.substr(1) }));
    }
    refs.push(type);
    name = type.substr(1);
    if (!optmap.propertyIsEnumerable(name))
      throw new UndefinedTypeError(origin, type);
    type = optmap[name];
  }
  var sign = null;
  if (/^[*~]/.test(type)) {
    sign = type.substr(0, 1)
    type = type.substr(1)
  }
  return { name: name, type: type, sign: sign, origin: origin };
}
function* gnuargs(args){
  for (var a of args) {
    var m = a.match(/^(--[^=]+)=(.*)/)
    if (m)
      yield* m.splice(1, 2);
    else
      yield a;
  }
}
function InvalidValueError(option, type, value, error) {
  this.name = 'InvalidValueError';
  this.message = `"${value}" is invalid for "${option}" (${type})`;
  this.innerError = error;
  this.option = option;
  this.type = type;
  this.value = value;
  Error.captureStackTrace(this, InvalidValueError);
}
function InvalidRepetationError(option) {
  this.name = 'InvalidRepetationError';
  this.message = `"${option}" is unallowed to appear multiple times`;
  this.option = option;
  Error.captureStackTrace(this, InvalidValueError);
}
function UndefinedTypeError(option, type) {
  this.name = 'UndefinedTypeError';
  this.message = `"${type}" is undefined type`;
  this.option = option;
  this.type = type;
  Error.captureStackTrace(this, UndefinedTypeError);
}
function CircularReferenceError(option, route) {
  this.name = 'CircularReferenceError';
  this.message = `"${option}" has circular reference: ${ route.join(' -> ') }`;
  this.option = option;
  this.route = route;
  Error.captureStackTrace(this, CircularReferenceError);
}

