var Http = require('http'),
	Url = require('url'),
	Bencode = require('./bencode.js'),
	Announce = require('./Announce.js'),
	TorrentManager = require('./TorrentManager.js');

function fail(response, msg, code) {
	if (code) {
		response.statusCode = code;
	}
	response.end(Bencode.encode({'failure reason': msg}), "utf8");
}

var manager = new TorrentManager();

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
	
	var announce = Announce.fromUrl(request.url);
	if (announce instanceof Error) {
		response.end(Bencode.encode("error parsing request -- " + announce), "utf8");
	} else {
		response.end(Bencode.encode(manager.announce(announce)), "utf8");
	}
});

server.listen(8080);
