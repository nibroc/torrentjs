var bencode = require('./bencode.js'),
	fs = require('fs');

bencode.parseTorrentFromFile('test.torrent', function(err, data) {
	console.log(data.info.files);
});
