module.exports = (function(){
	function TorrentManager() {
		this.peers = {};
		//	infoHash -> {
		//		infoHash: string, 
		// 		peers: { 
		//			peerId: {
		//				peerId: string, 
		//				lastAnnounce: Date
		//			}
		//		}
		//	}
		this.torrents = {};
	}
	
	function filter(obj, pred) {
		var results = {};
		for (var key in obj) {
			if (obj.hasOwnProperty(key) && pred(obj[key], key)) {
				results[key] = obj[key];
			}
		}
		return results;
	}
	
	function dictToArray(dict) {
		var arr = [];
		for (var k in dict) {
			if (dict.hasOwnProperty(k)) {
				arr.push(dict[k]);
			}
		}
		return arr;
	}
	
	function collectPeers(torrent, peerId) {
		return dictToArray(filter(torrent.peers, function filterPeers(peer) {
			return peer.peerId !== peerId;
		})).map(function(peer) {
			return {
				'peer id': peer.rawPeerId,
				ip: peer.ip,
				port: Number(peer.port)
			};
		});
	}
	
	TorrentManager.prototype.announce = function(announcement) {
		var infoHash = announcement.infoHash();
		var peerId = announcement.peerId();
		if (!this.torrents[infoHash]) {
			this.torrents[infoHash] = {infoHash: infoHash, peers: {}};
		}
		var torrent = this.torrents[infoHash];
		torrent.peers[peerId] = {
			peerId: peerId, 
			rawPeerId: announcement.rawPeerId(),
			ip: announcement.hostAddress(), 
			port: announcement.hostPort(),
			lastAnnounce: new Date()
		};
		return {
			interval: 60,
			peers: collectPeers(torrent, peerId)
		};
	};
	
	return TorrentManager;
}());