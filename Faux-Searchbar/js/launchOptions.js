// If Options page already exists somewhere, switch to it.
// Otherwise, it doesn't exist, create a new tab.
// Then, close this launch page since it's no longer needed.
setTimeout(function(){
	chrome.tabs.getAllInWindow(null, function(tabs){
		var found = false;
		var fb = chrome.extension.getURL("/html/faux-searchbar.html");
		for (var t in tabs) {
			if (tabs[t].title == "Faux Searchbar: Options" && strstr(tabs[t].url, fb+'#')) {
				found = true;
				chrome.tabs.update(tabs[t].id, {selected:true});
				chrome.tabs.getCurrent(function(tab){
					chrome.tabs.remove(tab.id);
				});
			}
		}
		if (!found) {
			for (var tt in tabs) {
				if (tabs[tt].title == "Faux Searchbar" && (strstr(tabs[tt].url, fb) || strstr(tabs[tt].url, "chrome://newtab"))) {
					found = true;
					chrome.tabs.update(tabs[tt].id, {selected:true, url:chrome.extension.getURL("/html/faux-searchbar.html#options=1")}, function(tab){
						chrome.runtime.sendMessage(null, {action:"openOptions", tabId:tab.id});
					});
					chrome.tabs.getCurrent(function(tab){
						chrome.tabs.remove(tab.id);
					});
				}
			}
			if (!found) {
				chrome.tabs.getCurrent(function(tab){
					chrome.tabs.create({url:chrome.extension.getURL("/html/faux-searchbar.html#options=1"), selected:true, index:tab.index+1});
					chrome.tabs.remove(tab.id);
				});
			}
		}
	});
}, 1);
