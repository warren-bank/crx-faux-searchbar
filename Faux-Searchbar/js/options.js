// Load the Options page HTML
$.get("/html/options.html", function(response){
	var optionsDiv = document.createElement("div");
	optionsDiv.innerHTML = response;
	document.getElementById('body').appendChild(optionsDiv);
	
	var scriptsToLoad = ['options-2.js']
	var head = document.getElementById('head');
	for (var s in scriptsToLoad) {
		var newScript = document.createElement("script");
		newScript.setAttribute('src', '/js/'+scriptsToLoad[s]);
		head.appendChild(newScript);
	}
});

// Fill the Management Options' "Backup..." textarea with the user's localStorage options in JSON format
function showBackupInfo() {
	if (openDb()) {
		window.db.readTransaction(function(tx) {
			tx.executeSql('SELECT * FROM opensearches', [], function(tx, results) {
				var backup = {};

				backup.restore = 'append';

				backup.searchengines = [];
				var len = results.rows.length, i;
				if (len > 0) {
					var i = 0;
					for (i = 0; i < len; i++) {
						backup.searchengines[i] = results.rows.item(i);
					}
				}

				$("#restoreinfo").css("display","none");
				$("#backupinfo").css("display","block");
				var backupText = JSON.stringify(backup);
				backupText = str_replace('","', '",\n"', backupText);
				backupText = str_replace('":{"', '": {\n"', backupText);
				backupText = str_replace('"},"', '"},\n\n"', backupText);
				backupText = str_replace('":[{"', '": [\n{"', backupText);
				backupText = str_replace('"shortname":', '\n\n"shortname":', backupText);
				$("#backup").text(backupText).select();
			});
		}, function(t){
			errorHandler(t, getLineInfo());
		});
	}
}

// Show the Management Options' "Restore..." box prompt
function showRestoreInfo() {
	$("#backupinfo").css("display","none");
	$("#restoreinfo").css("display","block");
	$("#restore").focus();
}

// Process the user's input from the "Restore..." box and overwrite the localStorage options and the odd database option with what the user has entered
function restoreOptions() {
	if ($("#restore").val().trim().length == 0) {
		alert("Oops! The import box appears to be empty.\n\nPaste your exported options text into the box, then click Apply again.");
		$("#restore").focus();
		return false;
	}
	$("#applyrestore").prop("disabled",true);
	setTimeout(function(){
		if (window.restoreIsOkay == false) {
			alert("Oops! Faux Searchbar was unable to process your backup.\n\nPlease ensure the pasted text is a well-formed JSON string.");
			$("#applyrestore").prop("disabled",false);
		}
	}, 500);
	window.restoreIsOkay = false;
	var text = jQuery.parseJSON($("#restore").val());
	if (text && text.searchengines) {
		window.restoreIsOkay = true;
		if (openDb()) {
			window.db.transaction(function(tx){
				if (text.restore !== 'append'){
					tx.executeSql('DELETE FROM opensearches');
				}
				for (var s in text.searchengines) {
					var se = text.searchengines[s];
					tx.executeSql('INSERT INTO opensearches (shortname, iconurl, searchurl, method, encoding, position, isdefault) VALUES (?, ?, ?, ?, ?, ?, ?)',
						[se.shortname, se.iconurl, se.searchurl, se.method, se.encoding, se.position, se.isdefault]);
				}
			}, function(t){
				errorHandler(t, getLineInfo());
			}, function(){
				chrome.runtime.sendMessage(null, "backup search engines");
				alert("The import was successful.\n\nFaux Searchbar will now restore your options.");
				window.location.reload();
			});
		} else {
			alert("Uh-oh! Faux Searchbar is unable to open its database to restore your search engines, but your other options will be restored.");
			window.location.reload();
		}
	}
}

// Remove any custom ordering of the Search Box's search engines, and sort them alphabetically
function sortSearchEnginesAlphabetically() {
	if (openDb()) {
		window.db.transaction(function(tx){
			tx.executeSql('UPDATE opensearches SET position = 0');
			getSearchEngines();
			populateOpenSearchMenu();
		}, function(t){
			errorHandler(t, getLineInfo());
		}, function(){
			chrome.runtime.sendMessage(null, "backup search engines");
		});
	}
}

// If user selects a different encoding for a search engine, update the database
$("#opensearchoptionstable td.encoding select").live("change", function(){
	if (openDb()) {
		var encodingValue = $(this).val();
		var searchUrl = $(this).parent().parent().find("td.searchurl input").val();
		window.db.transaction(function(tx){
			tx.executeSql('UPDATE opensearches SET encoding = ? WHERE searchurl = ?', [encodingValue, searchUrl]);
		}, function(t){
			errorHandler(t, getLineInfo());
		}, function(){
			getSearchEngines();
			populateOpenSearchMenu();
			chrome.runtime.sendMessage(null, "backup search engines");
		});
	}
});

// Update the list of search engines in the Search Box Options page
function getSearchEngines() {
	if (openDb()){
		window.db.readTransaction(function(tx){
			tx.executeSql('SELECT shortname, iconurl, searchurl, encoding FROM opensearches ORDER BY position ASC, shortname COLLATE NOCASE ASC', [], function(tx,results){
				var openEngines = '';
				var len = results.rows.length, i;
				var iconUrl = "";
				if (len > 0) {
					for (var i = 0; i < len; i++) {
						var searchEngine = results.rows.item(i);
						iconUrl = searchEngine.iconurl;
						if (iconUrl == "google.ico" || iconUrl == "yahoo.ico" || iconUrl == "bing.ico" || iconUrl == "duckduckgo.ico") {
							iconUrl = "/img/"+iconUrl;
						}
						openEngines += '<tr class="opensearch_optionrow">';
						openEngines += '<td class="osicon" style="padding:0px 0px 0 5px"><img src="'+iconUrl+'" style="height:16px; width:16px" /></td>';
						openEngines += '<td style="width:23%" class="shortname"><input class="inputoption" type="text" value="'+str_replace('"', '&quot;', searchEngine.shortname)+'" origvalue="'+str_replace('"', '&quot;', searchEngine.shortname)+'" /></td>';
						openEngines += '<td style="width:75%" class="searchurl"><input class="inputoption" type="text" value="'+searchEngine.searchurl+'" origvalue="'+searchEngine.searchurl+'" style="color:rgba(0,0,0,.52)" spellcheck="false" autocomplete="off" /></td>';
							
						openEngines +=
							'<td class="encoding" style="width:13%">'+
								'<select>' +
									'<option value="" '+(searchEngine.encoding == "" ? " selected" : "")+'>Default</option>' +
									'<option value="other" '+(searchEngine.encoding == "other" ? " selected" : "")+'>Other</option>' +
								'</select>' +
							'</td>';

						if (len > 1) {
							openEngines += '<td style="width:1px; padding:0 5px 0 4px" class="opensearchcross" title="Remove &quot;'+str_replace('"','&quot;',searchEngine.shortname)+'&quot; from Faux Searchbar"><img class="crossicon" src="/img/cross.png" /></td>';
						} else {
							openEngines += '<td></td>';
						}
						openEngines += '</tr>\n';
					}

					var encodingHelp = '<span style="opacity:.5; cursor:help; font-weight:normal" title="Certain search engines handle space characters differently.\n\n&bull; Default (most common): Spaces will be replaced with +\n\n&bull; Other: Spaces will be replaced with %20">(?)</span>';

					$("#opensearchengines").html(
						'<table id="opensearchoptionstable" class="opensearchoptionstable" style="width:100%" cellpadding="2" cellspacing="0" style="border-collapse:collapse">'+
							'<tr style="opacity:.55">'+
								'<td colspan="2" style="font-size:12px;font-weight:bold; padding-left:4px">Name</td>'+
								'<td style="padding-left:4px; text-align:left; font-size:12px; font-weight:bold">URL</td>'+
								'<td colspan="2" style="padding-left:4px; text-align:left; font-size:12px; font-weight:bold">Encoding&nbsp;'+encodingHelp+'</td>'+
							'</tr>'+
							openEngines+
						'</table>'
					);
				}
				else {
					$("#opensearchengines").text(
						"You haven't added any search engines to Faux Searchbar yet."
					);
				}
				var visibleSEButtons = 0;
				$(".searchenginebutton").each(function(){
					if ($('td.searchurl input[value="'+$(this).attr("searchurl")+'"]').length > 0) {
						$(this).css("display","none");
					} else {
						$(this).css("display","inline-block");
						visibleSEButtons++;
					}
				});
				if (visibleSEButtons == 0) {
					$("#restorebig3").css("display","none");
				} else {
					$("#restorebig3").css("display","block");
				}
			});
		}, function(t){
			errorHandler(t, getLineInfo());
		});
	}
}

function loadOptionsJS() {
	chrome.runtime.onMessage.addListener(function(r){
		if (r == "reload options") {
			window.location.reload();
		}
	});
}

// Hide the Options container/page
function closeOptions() {
	var hash = window.location.hash;
	hash = hash.replace('options=1', '').replace('#&', '#').replace('&&', '')
	if (hash == '#') {
		window.location.hash = '';
	} else {
		window.location.hash = hash;
	}
	window.location.reload();
}

// Let user add a search engine manually
function addEngineManually() {
	if (openDb()) {
		window.db.transaction(function(tx){
			tx.executeSql('INSERT INTO opensearches (shortname, searchurl) VALUES (?, ?)', ['Untitled', '']);
		}, function(t){
			errorHandler(t, getLineInfo());
		}, function(){
			getSearchEngines();
			chrome.runtime.sendMessage(null, "backup search engines");
		});
	}
}

// Remove all non-default search engines
function resetSearchEngines() {
	if (openDb()) {
		window.db.transaction(function(tx){
//			tx.executeSql('DELETE FROM opensearches WHERE iconurl NOT IN (?, ?, ?, ?)', ['google.ico', 'duckduckgo.ico', 'yahoo.ico', 'bing.ico']);
			tx.executeSql('DELETE FROM opensearches');
		}, function(t){
			errorHandler(t, getLineInfo());
		}, function(){
			getSearchEngines();
			populateOpenSearchMenu();
			chrome.runtime.sendMessage(null, "backup search engines");
		});
	}
}

$('.closeoptions').live('click', closeOptions);
