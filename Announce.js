module.exports = (function() {
	function hexToDec(chr) {
		return chr.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
	}
	
	function urlParamToHex(str) {
		var hex = "";
		var i = 0;
		str = String(str);
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
		var query = url.split("?").slice(1)[0] || "";
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
	
	function clampUp(val, min, max) {
		val = Number(val);
		if (val < min) {
			return min;
		} else if (val > max) {
			return max;
		} else {
			return val;
		}
	}
	
	function hexStringToOctectString(str) {
		if (str.length % 2 !== 0) {
			throw new Error("Cannot convert non-even lengthed hex string to octet form");
		}
		var raw = "";
		for (var i = 0; i < str.length; i += 2) {
			var high = parseInt(str[i], 16);
			var low = parseInt(str[i + 1], 16);
			raw += String.fromCharCode((high << 4) + low);
		}
		return raw;
	}
	
	function Announce(data, remoteAddress) {
		this.data = data;
		this.maxNumPeers = 500;
		this.defaultNumPeers;
		this.remoteAddress = remoteAddress;
		
		if (!data.peer_id || !data.info_hash || !data.port) {
			throw new Error("Invalid announce data provided");
		}
		//Todo: validate formats of peer_id, info_hash, etc
	}
	
	// Identifying information
	Announce.prototype.infoHash = function() { return this.data.info_hash; };
	Announce.prototype.peerId = function() { return this.data.peer_id; };
	Announce.prototype.rawPeerId = function() { return hexStringToOctectString(this.peerId()); };
	Announce.prototype.port = function() { return this.data.port; };
	
	// Data amounts
	Announce.prototype.uploadedBytes = function() { return this.data.uploaded; };
	Announce.prototype.downloadedBytes = function() { return this.data.downloaded; };
	Announce.prototype.remainingBytes = function() { return this.data.left; };
	Announce.prototype.corruptBytes = function() { return this.data.corrupt; };
	Announce.prototype.redundantBytes = function() { return this.data.redundant; };
	
	// Feature support
	Announce.prototype.supportsCompactPeers = function() { return this.data.compact && this.data.compact !== "0"; };
	Announce.prototype.supportsEncryption = function() { return this.data.supportcrypto && this.data.supportcrypto !== "0"; };
	
	// Peering information
	Announce.prototype.desiredNumberOfPeers = function() { return clampUp(this.data.numwant || this.data.defaultNumPeers, 0, this.maxNumPeers); };
	
	// Connection information
	Announce.prototype.hostAddress = function() {
		if (this.data.ip) {
			return ip;
		} else {
			return this.remoteAddress;
		}
	};
	
	Announce.prototype.hostPort = function() { return this.data.port; };
	
	// Convert Announce to a human readable string
	Announce.prototype.toString = function() {
		return JSON.stringify(this.data);
	};
	
	// Convenience method to parse a web request into an Announce
	Announce.fromWebRequest = function(request) {
		return new Announce(parseUrl(request.url), request.socket.remoteAddress);
	};
	
	return Announce;
}());
