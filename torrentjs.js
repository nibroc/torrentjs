var Http = require('http'),
	Url = require('url'),
	Bencode = require('./bencode.js');

function fail(response, msg, code) {
	if (code) {
		response.statusCode = code;
	}
	response.end(Bencode.encode({'failure reason': msg}), "utf8");
}

function toHex(str) {
	return String(str).split("").map(function(c) {
		return c.charCodeAt(0).toString(16);
	}).join("");
}

var Announce = (function() {
	function Announce() {}
	
	function hexToDec(chr) {
		return chr.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
	}
	
	function urlParamToHex(str) {
		var hex = "";
		var i = 0;
		while (i < str.length) {
			if (str[i] === '%' && i + 2 < str.length) {
				// Escape sequence -- already in hex
				hex += str[i + 1].toLowerCase();
				hex += str[i + 2].toLowerCase();
				i += 3;
			} else {
				hex += str[i].charCodeAt(0).toString(16);
				++i;
			}
		}
		return hex;
	}
	
	function parseUrl(url) {
		var query = url.split("?").slice(1)[0];
		var queryPairs = query.split("&");
		var values = {};
		queryPairs.forEach(function(pairStr) {
			var pair = pairStr.split("=");
			values[pair[0]] = pair[1] || "";
		});
		values.info_hash = urlParamToHex(values.info_hash);
		values.peer_id = urlParamToHex(values.peer_id);
		return values;
	}
	
	Announce.fromUrl = function(url) {
		var parts = parseUrl(url);
		console.log(parts);
	};
	
	return Announce;
}());

var server = Http.createServer(function(request, response) {
	if (request.method !== 'GET') {
		fail(response, "invalid request method", 404);
		return;
	}
	var path = Url.parse(request.url).pathname.substr(1);
	if (path !== 'tracker.js') {
		fail(response, "unknown page requested", 404);
		return;
	}
	
	Announce.fromUrl(request.url);
	
	var getParams = Url.parse(request.url, true).query;
	/*console.log({
		params: getParams,
		peer_id: toHex(getParams.peer_id),
		infoHash: toHex(getParams.info_hash)
	});*/
	
	//Tracker responses are bencoded dictionaries. If a tracker response has a key failure reason, then that maps to a human readable string which explains why the query failed, and no other keys are required. Otherwise, it must have two keys: interval, which maps to the number of seconds the downloader should wait between regular rerequests, and peers. peers maps to a list of dictionaries corresponding to peers, each of which contains the keys peer id, ip, and port, which map to the peer's self-selected ID, IP address or dns name as a string, and port number, respectively. Note that downloaders may rerequest on nonscheduled times if an event happens or they need more peers.
	
	var resp = {
		'failure reason': "unable to handle request"
	};
	
	/*response.end(Bencode.encode({
		interval: 30,
		peers: []
	}), "utf8");*/
	
	response.end(Bencode.encode(resp), "utf8");
});

server.listen(8080);
