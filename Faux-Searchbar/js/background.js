localStorage.extensionName = chrome.runtime.getManifest().name;

// Background event page listens for requests...
chrome.runtime.onMessage.addListener(function(request, sender){

	// Backup search engines to localStorage in case Faux Searchbar's database becomes corrupted
	if (request == "backup search engines") {
		backupSearchEngines();
	}
});

chrome.browserAction.onClicked.addListener(function(tab) {
	if (localStorage.option_launch_FauxSearchbar == "currentTab") {
		chrome.tabs.getSelected(null, function(tab){
			chrome.tabs.update(tab.id, {url:chrome.extension.getURL("html/faux-searchbar.html")});
		});
	} else if (localStorage.option_launch_FauxSearchbar == "newTab") {
		chrome.tabs.create({url:chrome.extension.getURL("/html/faux-searchbar.html"), selected:true});
	} else if (localStorage.option_launch_FauxSearchbar == "newWindow") {
		chrome.windows.create({url:chrome.extension.getURL("html/faux-searchbar.html")});
	}
});

chrome.runtime.onInstalled.addListener(function(details){
	var currentVersion = chrome.runtime.getManifest().version;

	switch (details.reason) {
		case 'install':
			localStorage.currentVersion = currentVersion;

			// If Faux Searchbar is being started for the first time, load in the default options.
			// os* usually stands for OpenSearch
			if (!localStorage.firstrundone || localStorage.firstrundone != 1) {
				resetOptions();
				initializeDatabase();
				localStorage.osshortname = 'Google';
				localStorage.osiconsrc = 'google.ico';
				localStorage.firstrundone = 1;
			}
			break;

		case 'update':
			break;

		case 'chrome_update':
			break;
	}
});

// Initialize SQLite database
function initializeDatabase() {
	if (openDb()) {
		window.db.transaction(function(tx){
			tx.executeSql('DROP TABLE IF EXISTS opensearches');
			tx.executeSql('CREATE TABLE IF NOT EXISTS opensearches (shortname TEXT UNIQUE ON CONFLICT REPLACE, iconurl TEXT, searchurl TEXT, method TEXT DEFAULT "get", encoding TEXT DEFAULT "", position NUMERIC DEFAULT 0, isdefault NUMERIC DEFAULT 0)');

			var searchEngines = [
				{shortname:"Google", iconurl:"google.ico", searchurl:"https://www.google.com/search?q={searchTerms}", method:"get", isdefault:1},
				{shortname:"DuckDuckGo", iconurl:"duckduckgo.ico", searchurl:"https://duckduckgo.com/?q={searchTerms}", method:"get", isdefault:0},
				{shortname:"Yahoo!", iconurl:"yahoo.ico", searchurl:"https://search.yahoo.com/search?p={searchTerms}", method:"get", isdefault:0},
				{shortname:"Bing", iconurl:"bing.ico", searchurl:"https://www.bing.com/search?q={searchTerms}", method:"get", isdefault:0}
			];

			for (var en in searchEngines) {
				var e = searchEngines[en];
				tx.executeSql('INSERT INTO opensearches (shortname, iconurl, searchurl, method, isdefault) VALUES (?, ?, ?, ?, ?)',
				[e.shortname, e.iconurl, e.searchurl, e.method, e.isdefault]);
			}
		}, function(t){
			errorHandler(t, getLineInfo());
		});
	}
}

// Backup search engines from SQLite to Local Storage
function backupSearchEngines() {
	if (openDb()) {
		window.db.readTransaction(function(tx){
			tx.executeSql('SELECT * FROM opensearches', [], function(tx, results){
				if (results.rows.length > 0) {
					var engines = [];
					for (var x = 0; x < results.rows.length; x++) {
						var item = results.rows.item(x);
						engines[engines.length] = {
							shortname:	item.shortname,
							iconurl:	item.iconurl,
							searchurl:	item.searchurl,
							method:		item.method,
							encoding:   item.encoding,
							position:	item.position,
							isdefault:	item.isdefault
						};
					}
					localStorage.backup_searchEngines = JSON.stringify(engines);
				} else {
					delete localStorage.backup_searchEngines;
				}
			});
		}, function(t){
			errorHandler(t, getLineInfo());
		});
	}
}
