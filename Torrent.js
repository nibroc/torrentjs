module.exports = (function(){
	var PIECE_HASH_LENGTH = 20;

	function utf8(string) {
		var codes = [];
		for (var i = 0; i < string.length; ++i) {
			codes.push(string.charCodeAt(i));
		}
		return new Buffer(codes).toString();
	}
	
	function Torrent(torrentData) {
		// Do some very crude verification that we received a sane object
		if (!torrentData.announce) {
			throw new Error("The announce url (announce) is required");
		}
		if (!torrentData.info) {
			throw new Error("The info dict is required");
		}
		if (!torrentData.info.files) {
			throw new Error("The info.files list is required");
		}
		if (!torrentData.info.name) {
			throw new Error("The info.name key is required");
		}
		if (torrentData.info.pieces.length % PIECE_HASH_LENGTH !== 0) {
			throw new Error("Piece hashes must be divisible by " + PIECE_HASH_LENGTH);
		}
		if (!torrentData.info['piece length']) {
			throw new Error("Piece length must be provided");
		}
		for (var key in torrentData) {
			if (torrentData.hasOwnProperty(key)) {
				this[key] = torrentData[key];
			}
		}
	}
	
	Torrent.prototype.announceUrl = function() {
		return this['announce'];
	};

	Torrent.prototype.createdBy = function() {
		return this['created by'];
	};

	Torrent.prototype.creationDate = function() {
		return new Date(this['creation date'] * 1000);
	};
	
	Torrent.prototype.pieceLength = function() {
		return this['info']['piece length'];
	};
	
	function cutString(str, len) {
		var pieces = [];
		for (var pos = 0; pos < str.length; pos += len) {
			pieces.push(str.substr(pos, len));
		}
		return pieces;
	}
	
	function utf8Encode(s) {
		return unescape(encodeURIComponent(s));
	}

	function utf8Decode(s) {
		return decodeURIComponent(escape(s));
	}
	
	Torrent.prototype.pieces = function() {
		return cutString(this['info']['pieces'], PIECE_HASH_LENGTH);
	};
	
	Torrent.prototype.files = function() {
		var dirName = this.info.name;
		if (this['length']) {
			// The torrent contains a single file
			return {
				path: dirName,
				length: this.length
			};
		} else {
			// The torrent contains more than 1 file
			return this['info']['files'].map(function(file) {
				return {
					path: dirName + "/" + file.path.map(utf8).join("/"),
					length: file.length
				};
			});
		}
	};
	
	return Torrent;
}());
