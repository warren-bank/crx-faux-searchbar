//// This file is used by Faux Searchbar's main page.

jQuery(document).ready(function($){

	$("body").live("mousedown", function(e){
		if (e.target.className != "menuOption" && e.target.className != "menuOption disabled" && e.target.id != "contextMenu") {
			removeContextMenu();
		}
	});

	$(window).bind("blur", function(){
		removeContextMenu();
	});

	$("*").bind("keydown", function(){
		removeContextMenu();
	});

	$('.errorBoxCross').live('click', function(){
		$('#errorBox').css('display','none');
		return true;
	});

	// Listen to the background page
	chrome.runtime.onMessage.addListener(function (request) {

		// Display error message
		if (request.action == "displayError") {
			$("#errorLine").html(request.errorLine);
			$("#errorMessage").html(request.errorMessage);
			$("#errorBox").css("display","inline-block");
		}

		// Change to options page if user wants to open Faux Searchbar's options
		else if (request.action && request.action == "openOptions") {
			chrome.tabs.getCurrent(function(tab){
				if (tab.id == request.tabId) {
					window.location.reload();
				}
			});
		}
	});

	$("body").live("contextmenu",function(e){
		if (!$(".glow").length) {
			removeContextMenu();
		} else {
			return false;
		}
	});

	$("#contextMenu").live("mouseenter", function(){
		$(".arrowed").removeClass("arrowed");
	});

	$("#contextMenu .menuOption").live("mousedown", function(){
		if (!$(this).hasClass("disabled")) {
			switch ($(this).text()) {

				case "Edit Search Engines...":
					localStorage.option_optionpage = "option_section_searchengines";

					// If "Edit search engines..." is selected, load the options.
					// If options are already loaded, switch to the Search Box subpage
					if (getHashVar("options") != 1) {
						if (window.location.hash.length == 0) {
							window.location.hash = "#options=1";
						} else {
							window.location.hash += "&options=1";
						}
						window.location.reload();
					} else {
						changeOptionPage("#option_section_searchengines");
					}
					break;

				case "Customize "+(localStorage.extensionName ? localStorage.extensionName : "Faux Searchbar")+"...":
					if (window.tileEditMode) {
						localStorage.option_optionpage = "option_section_tiles";
					}
					window.location = chrome.extension.getURL("/html/faux-searchbar.html#options=1");
					window.location.reload();
					break;

				// Search engines
				default:
					if ($(this).hasClass("engine")) {
						var doStaticSearch = function(el) {
							var $el = $('.menuitem[shortname="'+str_replace('"','&quot;',$(el).attr("shortname"))+'"]');
							if ($el.length && typeof $el.attr('searchurl') === 'string') {
								// a search URL without a placeholder variable for dynamic search terms is a static bookmark
								if ($el.attr('searchurl').indexOf('{searchTerms}') === -1){
									window.openSearchShortname = $el.attr("shortname");
									submitOpenSearch('static');
									return true;
								}
							}
						};
						if (doStaticSearch(this)) return;

						if ($("#opensearchinput:focus").length || $("#opensearch_triangle .glow").length) {
							selectOpenSearchType($('.menuitem[shortname="'+str_replace('"','&quot;',$(this).attr("shortname"))+'"]'), true);
							if ($("#opensearch_triangle .glow").length) {
								$("#opensearchinput").focus();
							}
						}
					}
					break;
			}
			removeContextMenu();
			return false;
		} else {
			return false;
		}
	});

	$("#opensearchinput_cell").html('<input type="text" id="opensearchinput" spellcheck="false" autocomplete="off" '+
		' placeholder="'+str_replace('"', '&quot;', localStorage.osshortname)+'" />');

	$('#opensearchinput').ready(function(){
		if (getHashVar('options') == 1) {
			$('#opensearchinput').attr('placeholder', str_replace('"', '&quot;', localStorage.osshortname));
		} else {
			$('#opensearchinput:focus').live('focus', function(){
				$(this).attr('placeholder', str_replace('"', '&quot;', localStorage.osshortname));
			});
			$('#opensearchinput').focus().live('blur', function(){
				$(this).attr('placeholder', str_replace('"', '&quot;', localStorage.osshortname));
			});
		}
	});

	$("#opensearchinput").focus(function(){
		$(this).attr("title","");
	});

	$("#opensearchinput").blur(function(){
		if ($(this).val() == "") {
			$(this).attr("placeholder",window.openSearchShortname);
		}
		$(this).attr("title",$(this).attr("realtitle"));
	});

	if (localStorage.osiconsrc) {
		var ico = localStorage.osiconsrc == "google.ico" || localStorage.osiconsrc == "yahoo.ico" || localStorage.osiconsrc == "bing.ico" || localStorage.osiconsrc == "duckduckgo.ico" ? "/img/"+localStorage.osiconsrc : localStorage.osiconsrc;
		$("#opensearch_triangle span").first().html('<img class="opensearch_selectedicon" src="'+ico+'" style="height:16px; width:16px;" /><span class="triangle static" style="margin-top:1px"></span>');
	} else {
		$("#opensearch_triangle span").first().html('<img class="opensearch_selectedicon" src="/img/null.png" style="height:16px; width:16px;" /><span class="triangle static" style="margin-top:1px"></span>');
	}

	// When user clicks the Search Box's triangle/arrow, show the list of selectable search engines to choose from, or close the list if it's showing
	$("#opensearch_triangle").bind("mouseup", function(e){
		$("#opensearch_triangle .triangle").addClass("glow");
		showContextMenu(e);
	});

	// When user clicks the Search Box's magnifying glass, submit the search if text is entered
	$("#searchicon_cell").bind("mousedown", function(){
		if ($("#opensearchinput").val().trim().length) {
			submitOpenSearch();
		}
	});

	// When user hovers over magnifying glass, change color slightly
	$("#searchicon_cell")
		.live("mouseenter", function(){
			$("#searchicon").attr("src","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABdUlEQVQ4T5WTIUzDUBCG7zqWgBpqAgNBYtgWZrAEhSJZQpssm8DjIG0wGCgJDoFDQAitICEBiZ9ZslVNIVAkJAjAzECPu0fbdN1bw6rWvvd/7//vf0P4x1M1nQYhlYtUCLr+cSctwTx91XLOeUMbCGbifQTwxr8P+r57J98mAmo79gMgbighwicQffB7mWFz/P5NBLsC0QLq5uH6D4RPoiWEy77n7sUOapbTZciKOGHAshZQsZwbg2CbTxr0PLeejcmQd3FSAGNTC0jsG3jWuz05GgOY9oBzLYZI+7mAEOE+8NymxsErOyhxjLYWILXxwpUMKyRaDfzTlxiimuEByhrHK01uIcqpIACPBuIzN7ElA0wPdwwQdd8QiyweqtoyTzraCCCxF3XPFhdUHKKWfAoN/CqScZG+jQlgRKzpf9KNVYBkaNGu7OXJu+74J6ZrrmQWAYfTiFXSimkv8YQ7POF5AmzFf5K8U9NrKoJA+PS1acWi/QVHr6EUsRkP6wAAAABJRU5ErkJggg==");
		})
		.live("mouseleave", function(){
			$("#searchicon").attr("src","/img/search.png");
		});

	// When user presses a key with the Search Box focused...
	$("#opensearchinput").bind("keydown", function(e){
		// Enter/Return - execute the search, hide the results
		if (e.keyCode == 13) {
			if ($("#opensearchinput").val().trim().length) {
				submitOpenSearch();
			}
			return false;
		}
	});

	// Populate the Search Box's list of search engines now, so that they appear instantly when the user clicks to change search engine.
	populateOpenSearchMenu();

	if (getHashVar("options") == 1) {
		var newScript = document.createElement("script");
		newScript.setAttribute("src", "/js/options.js");
		document.getElementById('head').appendChild(newScript);
	}

})

// Tell the tab to go to a URL.
function goToUrl(url) {
	chrome.tabs.getCurrent(function(tab){
		chrome.tabs.update(tab.id, {url:url});
	});
}

// Submit the Search Box's input as a search to the selected search engine.
// Need to create a simple URL if it's a GET, otherwise create a form and POST it.
function submitOpenSearch(query) {
	var selectedMenuItem = '.menuitem[shortname="' + window.openSearchShortname + '"]';
	var searchUrl = $(selectedMenuItem).attr("searchurl");
	var openSearchInputVal = query ? query : $("#opensearchinput").val();

	if ($(selectedMenuItem).length && $(selectedMenuItem).attr("method") && $(selectedMenuItem).attr("method").length && $(selectedMenuItem).attr("method").toLowerCase() == 'get') {
		// GET

		searchUrl = str_replace('{searchTerms}', urlencode(openSearchInputVal), searchUrl);

		var encoding = "";
		if (window.openSearchEncoding) {
			encoding = window.openSearchEncoding;
		}
		if (encoding == "other") {
			searchUrl = str_replace("+", "%20", searchUrl);
		}

		goToUrl(searchUrl);
	}
	else {
		// POST

		searchUrl = str_replace('{searchTerms}', openSearchInputVal, searchUrl);

		var qs, action, qs_param, qs_param_key, qs_param_val
		var qs_array = []

		qs = searchUrl.split('?')
		if (qs.length > 1) {
			action = qs.shift()
			qs = qs.join('&')
			qs = qs.split('&')

			for (var i=0; i<qs.length; i++){
				qs_param = qs[i]
				qs_param = qs_param.split('=')
				if (qs_param.length === 2){
					qs_param_key = qs_param[0]
					qs_param_val = qs_param[1]

					qs_array.push([qs_param_key, qs_param_val])
				}
			}
		}

		if (!qs_array.length){
			return goToUrl(searchUrl)
		}

		$("#tempform").remove();
		$("body").append('<form method="post" action="'+ action +'" id="tempform" style="position:absolute;z-index:-999;opacity:0"></form>')
		for (var i=0; i<qs_array.length; i++){
			qs_param_key = qs_array[i][0]
			qs_param_val = qs_array[i][1]

			$('#tempform').append('<input type="hidden" name="' + qs_param_key + '" value="' + qs_param_val + '" />')
		}
		$("#tempform").submit()
	}
}

function removeContextMenu() {
	$("#contextMenu").remove();
	setTimeout(function(){
		$(".glow").removeClass("glow");
	}, 1);
}

function showContextMenu(e) {
	var html = '';
	if ($("#opensearch_triangle .glow").length) {
		var y = $("#opensearch_triangle").offset().top+$("#opensearch_triangle").outerHeight();
		var x = $("#opensearch_triangle").offset().left;
	}
	else {
		var y = e.pageY;
		var x = e.pageX;
	}

	html += '<div id="contextMenu" style="top:'+y+'px; left:'+x+'px; opacity:0;" >';
	if ($("#opensearchinput:focus").length || $("#opensearch_triangle .glow").length) {
		$(".menuitem").each(function(){
			if ($(this).attr("shortname")) {
				html += '	<div class="menuOption engine" shortname="'+$(this).attr("shortname")+'" encoding="'+$(this).attr("encoding")+'" style="background-image:url('+$(this).attr("iconsrc")+'); background-size:16px 16px; background-repeat:no-repeat; background-position:4px 2px;">'+
				$(this).attr("shortname")+
				'</div>';
			}
		});
		html += '	<div class="menuHr"></div>';
		html += '	<div class="menuOption icon16">Edit Search Engines...</div>';
	}
	if (!getHashVar("options").length) {
		html += '	<div class="menuOption icon16">Customize '+(localStorage.extensionName ? localStorage.extensionName : "Faux Searchbar")+'...</div>';
		html += '	<div class="menuHr"></div>';
	} else {
		html += '	<div class="menuOption icon16">Close Options</div>';
		html += '	<div class="menuHr"></div>';
	}
	html += '		<div class="menuOption disabled" style="">'+(localStorage.extensionName ? localStorage.extensionName : "Faux Searchbar")+' v'+localStorage.currentVersion+'</div>';
	html += '</div>';

	$("body").append(html);

	// Position the context menu

	if ($("#contextMenu").offset().left + $("#contextMenu").outerWidth() > window.innerWidth) {
		$("#contextMenu").css("left", window.innerWidth - $("#contextMenu").outerWidth() + "px");
	}

	if ($("#contextMenu").offset().top + $("#contextMenu").outerHeight() - $(window).scrollTop() > window.innerHeight) {
		$("#contextMenu").css("top", window.innerHeight - $("#contextMenu").outerHeight() + $(window).scrollTop() + "px");
	}

	$(".menuOption.icon16").first().css("background-image","url(/img/icon16.png)").css("background-repeat","no-repeat").css("background-position","4px 2px");
	$("#contextMenu").animate({opacity:1},100);
}

// Fill the search engine menu with the engines that have been added to Faux Searchbar
function populateOpenSearchMenu() {
	if (openDb()) {
		window.db.readTransaction(function (tx) {
			tx.executeSql('SELECT shortname, iconurl, searchurl, method, encoding, isdefault FROM opensearches ORDER BY position ASC, shortname COLLATE NOCASE asc', [], function (tx, results) {
				var menuItems = '';
				var len = results.rows.length, i;
				var isDefault = false;
				var defaultShortname = '';
				var iconUrl = "";
				var result = "";
				var encoding = '';
				var fakecount = 1;

				for (var i = 0; i < len; i++) {
					result = results.rows.item(i);
					isDefault = result.isdefault == 1 ? true : false;
					if (isDefault == true || defaultShortname == '') {
						defaultShortname = result.shortname;
					}
					iconUrl = result.iconurl;
					if (iconUrl == "google.ico" || iconUrl == "yahoo.ico" || iconUrl == "bing.ico" || iconUrl == "duckduckgo.ico") {
						iconUrl = "/img/"+iconUrl;
					}

					encoding = result.encoding && result.encoding.length ? result.encoding : "";
					menuItems += '<div class="menuitem" shortname="' + str_replace('"',"&quot;",result.shortname) + '" iconsrc="' + iconUrl + '" searchurl="' + result.searchurl + '" method="' + result.method + '" encoding="' + encoding + '">';
					menuItems += '<div class="vertline2">';
					menuItems += '<img src="'+iconUrl+'" style="height:16px;width:16px" /> ';
					menuItems += '<div class="vertline shortname">' + result.shortname;
					menuItems += '</div></div></div>\n\n';
				}

				menuItems += '<div class="menuitemline" style="border:0">';
				menuItems += '<div class="vertline2" style="">';

				menuItems += '<div class="vertline" style="line-height:1px; font-size:1px; padding:2px">&nbsp;';
				menuItems += '</div></div></div>';

				menuItems += '<div class="osMenuLine" style="border-bottom:1px solid #fff; border-top:1px solid #e2e3e3; display:block; height:0px; line-height:0px; font-size:0px; width:100%; margin-left:27px; margin-top:-3px; position:absolute; "></div>';

				menuItems += '<div class="menuitem edit"><div class="vertline2">';
				menuItems += '	<img src="/img/icon16.png" style="height:16px; width:16px" /> ';
				menuItems += '	<div class="vertline">Edit search engines...</div>';
				menuItems += '</div></div>';
				var osm = $("#opensearchmenu");
				osm.html(menuItems);
				$(".osMenuLine").css("width", osm.outerWidth()-34+"px");
				if (i > 0) {
					selectOpenSearchType($('.menuitem[shortname="'+str_replace('"',"&quot;",defaultShortname)+'"]'), false);
				}
			});
		}, function(t){
			errorHandler(t, getLineInfo());
		});
	}
}

function focusSearchBox () {
	setTimeout(function(){
		$("#opensearchinput").focus().setSelection(0,$("#opensearchinput").val().length);
	}, 1);
}

///////// OPTIONS //////////////

// Switch to a new Options subpage
function changeOptionPage(el) {
	$("#option_menu div").removeClass("section_selected");
	$(el).addClass("section_selected");
	$("div.optionbox").css("display","none");
	$("#"+$(el).attr("optionbox")).css("display","block");
	localStorage.option_optionpage = $(el).attr("id");
	if ($(el).attr("id") == "option_section_support" && !window.clickedSupportMenu) {
		window.clickedSupportMenu = true;
	}
}

// Below are mostly borrowed functions from other sources.
// If you see your function below, thank you!

////////////////////////////////////////////////////////////////////////////

// http://phpjs.org/functions/microtime:472
function microtime (get_as_float) {
	// *     example 1: timeStamp = microtime(true);
	// *     results 1: timeStamp > 1000000000 && timeStamp < 2000000000
	var now = new Date().getTime() / 1000;
	var s = parseInt(now, 10);

	return (get_as_float) ? now : (Math.round((now - s) * 1000) / 1000) + ' ' + s;
}

// http://www.somacon.com/p355.php
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
}

// http://www.java2s.com/Code/JavaScript/Language-Basics/CaseInsensitiveComparisonfortheArraySortMethod.htm
// Case insensitive sort
function sortKeysAlphabetically (x,y){
	var a = String(x).toUpperCase();
	var b = String(y).toUpperCase();
	if (a > b)
		return 1;
	if (a < b)
		return -1;
	return 0;
}
