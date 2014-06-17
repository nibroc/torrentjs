var bencode = require('./bencode.js'),
	fs = require('fs');
	
bencode.parseTorrentFromFile('test.torrent', function(err, torrent) {
	if (err) { throw err; }
	console.log(torrent.files());
});
