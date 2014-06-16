var Range = function(start, end) {
	this.start = start;
	this.end = end;
};

function rangeNotEmpty(range) {
	if (range.start == range.end) {
		throw new Error("Cannot parse empty string");
	}
}

function isDigit(ch) {
	return "0123456789".indexOf(ch) >= 0;
}

function parseInteger(str, range) {
	rangeNotEmpty(range);

	if (str[range.start] !== 'i') {
		throw new Error("invalid integer format (no i prefix)");
	}
	
	for (var lastValid = range.start + 1; lastValid != range.end && str[lastValid] !== 'e'; ++lastValid) {
		var ch = str[lastValid];
		if (ch === '-' && lastValid === range.start + 1) { continue; }
		if (!isDigit(ch)) {
			throw new Error("Integers must be decimal: " + ch);
		}
	}
	
	if (lastValid === range.end || str[lastValid] !== 'e') {
		throw new Error("Integers must end with e");
	}
	
	var intStr = str.substring(range.start + 1, lastValid);
	
	if (intStr === '' || intStr === '-') {
		throw new Error("Integers must have at least one digit");
	} else if (intStr === '-0') {
		// Odd little bencoding quirk -- -0 is invalid per the bencode spec
		throw new Error("-0 is an invalid integer");
	}
	
	range.start = lastValid + 1;
	
	return parseInt(intStr, 10);
}

function parseString(str, range) {
	rangeNotEmpty(range);
	
	var beg = range.start;
	
	for (var it = range.start; it != range.end && str[it] != ':'; ++it) { /* empty */ }
	
	if (it == range.end) {
		throw new Error("Invalid string format");
	}
	
	var len = parseInt(str.substring(beg, it));

	// TODO: verify len properly parsed
	
	// Om nom nom -- eat the colon
	++it;
	
	// All that remains now is the actual string.
	// This means that we should have end - it >= len
	if (range.end - it < len) {
		throw new Error("String length and content do not match");
	}

	range.start = it + len;
	return str.substring(it, range.start);
}

function parseList(str, range) {
	rangeNotEmpty(range);
	
	if (str[range.start] !== 'l') {
		throw new Error("Invalid list format at " + range.start + " -- prefix: " + str[0]);
	}
	
	// Eat the "l" prefix
	range.start += 1;
	
	var list = [];
	while (str[range.start] !== 'e' && range.start != range.end) {
		switch (str[range.start]) {
			case 'i':
				list.push(parseInteger(str, range));
				break;
			case 'l':
				list.push(parseList(str, range));
				break;
			case 'd':
				list.push(parseDict(str, range));
				break;
			default:
				list.push(parseString(str, range));
		}
	}
	if (range.start === range.end || str[range.start] !== 'e') {
		throw new Error("Lists must be suffixed by e");
	} else {
		// Eat the "e" suffix
		range.start += 1;
	}
	return list;
}

// Note: parseDict does not enforce two rules that it should.
// Namely, it does not require that keys are strings, nor does
// it require that keys are ordered.
function parseDict(str, range) {
	rangeNotEmpty(range);
	
	//Eat the prefix "d"
	++range.start;
	
	var dict = {};
	while (range.start !== range.end && str[range.start] !== 'e') {
		var key = parse(str, range);
		var val = parse(str, range);
		dict[key] = val;
	}
	if (range.start === range.end || str[range.start] !== 'e') {
		throw new Error("Dicts must be suffixed by e");
	}

	//Eat the suffix "e"
	++range.start;

	return dict;
}

function parse(str, range) {
	if (range.start === range.end) {
		throw new Error("Cannot parse empty string");
	}
	switch(str[range.start]) {
		case 'i':
			return parseInteger(str, range);
		case 'l':
			return parseList(str, range);
		case 'd':
			return parseDict(str, range);
		default:
			return parseString(str, range);
	}
}

function isString(obj) {
	return typeof obj === "string" || obj instanceof String;
}

function getKeys(obj) {
	var keys = [];
	for (var key in obj) {
		if (obj.hasOwnProperty(key) && isString(key)) {
			keys.push(key);
		}
	}
	return keys;
}

exports.encode = function encode(obj) {
	if (isString(obj)) {
		return obj.length + ":" + obj;
	} else if (typeof obj === "number") {
		if (obj % 1 === 0) {
			return "i" + obj + "e";
		} else {
			throw new Error("Only integers can be encoded");
		}
	} else if (Array.isArray(obj)) {
		return 'l' + obj.map(encode).join("") + 'e';
	} else {
		return "d" + getKeys(obj).sort().map(function encodeMapParts(key) {
			return encode(key) + encode(obj[key]);
		}).join("") + "e";
	}
};

exports.Error = Error;

exports.decode = function(str) {
	var range = new Range(0, str.length);
	var val = parse(str, range);
	if (range.start === range.end) {
		return val;
	} else {
		throw new Error("Entire string not consumed");
	}
};
