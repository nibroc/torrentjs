module.exports = (function() {
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
	
	function Announce(data) {
		this.data = data;
		this.maxNumPeers = 500;
		this.defaultNumPeers;
	}
	
	// Identifying information
	Announce.prototype.infoHash = function() { return this.data.info_hash; };
	Announce.prototype.peerId = function() { return this.data.peer_id; };
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
	
	// Convert Announce to a human readable string
	Announce.prototype.toString = function() {
		return JSON.stringify(this.data);
	};
	
	// Convenience method to parse a GET request's URL into an Announce
	Announce.fromUrl = function(url) {
		return new Announce(parseUrl(url));
	};
	
	return Announce;
}());
