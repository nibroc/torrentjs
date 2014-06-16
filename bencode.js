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

function encode(obj) {
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
}

function decode(str) {
	var range = new Range(0, str.length);
	var val = parse(str, range);
	if (range.start === range.end) {
		return val;
	} else {
		throw new Error("Entire string not consumed");
	}
}

function encodeUtf8(s) {
	return unescape(encodeURIComponent(s));
}

function decodeUtf8(s) {
	return decodeURIComponent(escape(s));
}

function TorrentFile(torrentData) {
	/*{ announce: 'http://localhost:8080/tracker.php',
  'created by': 'qBittorrent v3.1.9.2',
  'creation date': 1402871752,
  info:
   { files: [ [Object], [Object], [Object] ],
     name: 'test',
     'piece length': 32768,
     pieces: 'LJR\u001c_\u0015Qv\f\u001d{DkiV\u0017\u0019\\>4E\u0013lO2u3\u0016YhhOir\t\nb\u0003s<\u001frq:c/^P}u\u0012\
\Cg;*eqQsL8h\f\u00024e\u0006nyHG+7\\\'}ZEn\u001dp)A9W\u0014nZ\u0018k7V!C\f\u001a \u0002\u0010t!\u0017[\u0014,\f\u0013?Dy
Ei\u0012V[N\u001dzy|\u0018m\'4\u001d\u000f-\u0018p+P\u0019>W~\u0004^>\u0015\u000e=\r\u000eOWPh%_r\u001ag&B?0~-/\u0015|\n
Y[\u0006i\u0003O5dT+Ka\u001aL1*.K\u0013{>hUQ/J\u0011DJS\u0006\t:\u000f\'XoL?NuC\u001b\u0003J}5y\u0013||+\u001b5WEo' },
  'url-list': '' }*/
	for (var key in torrentData) {
		if (torrentData.hasOwnProperty(key)) {
			this[key] = torrentData[key];
		}
	}
}

TorrentFile.prototype.announceUrl = function() {
	return this['announce'];
}

TorrentFile.prototype.createdBy = function() {
	return this['created by'];
};

TorrentFile.prototype.creationDate = function() {
	return new Date(this['creation date']);
};



function parseTorrent(str) {
	return new TorrentFile(decode(str));
}

function parseTorrentFromFile(filepath, callback) {
	require('fs').readFile(filepath, {encoding: 'ascii'}, function parseTorrentCb(err, contents) {
		if (err) {
			callback(err);
		} else {
			try {
				var torrent = parseTorrent(contents)
				callback(torrent instanceof Error ? torrent : null, torrent);
			} catch (e) {
				callback(e, null);
			}
		}
	});
}

module.exports = {
	encode: encode,
	decode: decode,
	parseTorrent: parseTorrent,
	parseTorrentFromFile: parseTorrentFromFile
}
