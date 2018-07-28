// sort order: [0] = most recent first, [length-1] = least recent last
var incognito_windows = []

// workaround for error: Cannot access contents of url "chrome://newtab/"
var empty_page_URL = 'https://www.google.com/images/icons/product/chrome-32.png'

function add_incognito_window(winId) {
	var index = incognito_windows.indexOf(winId)

	incognito_windows.unshift(winId)
	if (index != -1) {
		incognito_windows.splice(index, 1)
	}
}

function remove_incognito_window(winId) {
	var index = incognito_windows.indexOf(winId)

	if (index != -1) {
		incognito_windows.splice(index, 1)
	}
}

chrome.windows.onFocusChanged.addListener(
	function(winId){
		if (winId >= 0) {
			chrome.windows.get(winId, {populate: false}, function(win){
				if (win.incognito) {
					add_incognito_window(win.id)
				}
			})
		}
	}
)

chrome.windows.onRemoved.addListener(
	function(winId){
		remove_incognito_window(winId)
	}
)

function get_incognito_window() {
	return new Promise(function(resolve, reject){
		if (incognito_windows.length){
			var winId = incognito_windows[0]

			chrome.windows.update(winId, {focused: true, state: "maximized"})

			resolve({
				winId,
				newtab: false
			})
		}
		else {
			chrome.windows.create({url: empty_page_URL, type: "normal", incognito: true, focused: true, state: "maximized"}, function(win){
				if (win && win.id) {
					add_incognito_window(win.id)
					resolve({
						winId: win.id,
						newtab: true
					})
				}
				else {
					reject(new Error('no incognito window ID'))
				}
			})
		}
	})
	.catch(function(e){
		console.log(e.message)
		console.log('using active window, which should be incognito')

		return Promise.resolve({
			winId: chrome.windows.WINDOW_ID_CURRENT,
			newtab: true
		})
	})
}

function get_new_incognito_tab() {
	return 	get_incognito_window()
	.then(function({winId, newtab}){
		return new Promise(function(resolve, reject){
			if (newtab){
				chrome.tabs.query(
					{
						windowId: winId,
						active: true
					},
					function(tabs){
						if (tabs && tabs.length === 1){
							var tab = tabs[0]
	
							resolve({
								winId: tab.windowId,
								tabId: tab.id
							})
						}
						else {
							reject(new Error('no active tab in incognito window'))
						}
					}
				)
			}
			else {
				chrome.tabs.create(
					{
						url: empty_page_URL,
						windowId: winId,
						active: true
					},
					function(tab){
						if (tab && tab.id){
							resolve({
								winId: tab.windowId,
								tabId: tab.id
							})
						}
						else {
							reject(new Error('no tab ID in incognito window'))
						}
					}
				)
			}
		})
	})
	.catch(function(e){
		console.log(e.message)
		console.log('using active tab, which should be incognito')

		return new Promise(function(resolve, reject){
			chrome.tabs.getCurrent(function(tab){
				if (tab && tab.id){
					resolve({
						winId: chrome.windows.WINDOW_ID_CURRENT,
						tabId: tab.id
					})
				}
				else {
					reject(new Error('no active tab in incognito window'))
				}
			})
		})
	})
}

// -----------------------------------------------

function make_GET_request_in_incognito_window(url) {
	get_new_incognito_tab()
	.then(function({winId, tabId}){
		chrome.tabs.update(tabId, {url})
	})
	.catch(function(e){
		console.log(e.message)
	})
}

function make_POST_request_in_incognito_window(DOMstring) {
	get_new_incognito_tab()
	.then(function({winId, tabId}){
		var code = "document.body.innerHTML = '" + DOMstring + "'; document.forms.tempform.submit();"
		chrome.tabs.executeScript(tabId, {matchAboutBlank: true, code})
	})
	.catch(function(e){
		console.log(e.message)
	})
}

// -----------------------------------------------
