var bencode = require('./bencode.js');
var assert = require('assert');

var decode = bencode.decode;
var encode = bencode.encode;

var assertThrows = function(str, message) {
	assert.throws(function() {
		bencode.decode(str);
	}, bencode.BencodeException, message);
}

function stringify(obj) {
	if (typeof obj === "string" || obj instanceof String
	     || typeof obj === "number" || obj instanceof Number) {
		return String(obj);
	} else if (Array.isArray(obj)) {
		return "[" + obj.join(", ") + "]";
	} else {
		return JSON.stringify(obj);
	}
}

function runTests(tests, assertion, assertThrows) {
	tests.correct.forEach(function(test) {
		assertion(decode(test.text), test.value, "decoding: " + stringify(test.text));
		assertion(encode(test.value), test.text, "encoding: " + stringify(test.value));
	});
	tests.throws.forEach(assertThrows);
}

// Integers
runTests({
	correct: [
		{text: "i0e", value: 0},
		{text: "i3e", value: 3},
		{text: "i-3e", value: -3},
		{text: "i314159e", value: 314159},
		{text: "i-314159e", value: -314159}
	],
	throws: ["iabce", "ie", "i-0e", "i-e", "i25ee", "i25ei25e"]
}, assert.strictEqual, assertThrows);

// Strings
runTests({
	correct: [
		{text: "5:hello", value: "hello"},
		{text: "11:hello world", value: "hello world"},
		{text: "9:!!!333@@@", value: "!!!333@@@"},
		{text: "0:", value: ""}
	],
	throws: ["9:!!!", "-3:!!!", "abc:!!!", ":", ":abc", "3:", "3", "a:1", ""]
}, assert.strictEqual, assertThrows);

// Lists
var simpleList = ["spam", "eggs"];
var simpleListString = "l4:spam4:eggse";
var nestedList = [35, simpleList];
var nestedListString = "li35e" + simpleListString + "e";
runTests({
	correct: [
		{text: simpleListString, value: simpleList},
		{text: nestedListString, value: nestedList},
		{text: "le", value: []},
		{text: "llee", value: [[]]}
	],
	throws: ["", "lee", "lnonsensee", "lle"]
}, assert.deepEqual, assertThrows);

// Dictionaries
var simpleDictionary = {baz: 3, foo: "bar", much: "wow"};
var simpleDictionaryString = "d3:bazi3e3:foo3:bar4:much3:wowe";
var nestedDictionary = {foo: "bar!", nest: simpleDictionary};
var nestedDictionaryString = "d3:foo4:bar!4:nest" + simpleDictionaryString + "e";
runTests({
	correct: [
		{text: simpleDictionaryString, value: simpleDictionary},
		{text: nestedDictionaryString, value: nestedDictionary},
		{text: "de", value: {}}
	],
	throws: ["", "dde", "dee"]
}, assert.deepEqual, assertThrows);
