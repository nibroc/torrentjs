var bencode = require('./bencode.js'),
	fs = require('fs');

fs.readFile('test.torrent', {encoding: 'ascii'}, function(err, contents) {
	if (err) { throw err; }
	console.log(
	console.log(bencode.decode(contents));
});
