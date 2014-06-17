module.exports = (function(){
	function TorrentManager() {}
	
	TorrentManager.prototype.announce = function(announcement) {
		console.log("Announce: " + announcement);
		return {
			interval: 10,
			peers: []
		};
	};
	
	return TorrentManager;
}());