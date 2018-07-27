// This file contains functions that are used by both the main Faux Searchbar page and its background page.

function logError(msg, file, line) {
	console.log(msg+'\n'+file+', line '+line);
}

// Do a bit of stack tracing and return filename, line # and column #
function getLineInfo() {
	console.log(new Error().stack);
	var lines = new Error().stack.split("\n");
	var line = lines[lines.length-1];
	var file = line.split(chrome.extension.getURL(""), 2);
	file = file[1];
	var bits = file.split(":");
	return {file:bits[0], line:bits[1], col:bits[2]};
}

// errorHandler catches errors when SQL statements don't work.
// transaction contains the SQL error code and message
// lineInfo contains contains the line number and filename for where the error came from
function errorHandler(transaction, lineInfo) {
	if (!window.goingToUrl) {
		if (transaction.message) {
			var code = '';
			switch (transaction.code) {
				case 1:
					code = "database";
					break;
				case 2:
					code = "version";
					break;
				case 3:
					code = '"too large"';
					break;
				case 4:
					code = "quota";
					break;
				case 5:
					code = "syntax";
					break;
				case 6:
					code = "constraint";
					break;
				case 7:
					code = "timeout";
					break;
				default: // case 0:
					break;
			}
			var errorMsg = 'SQL '+code+' error: "'+transaction.message+'"';
			logError(errorMsg, lineInfo.file, lineInfo.line);
		} else {
			logError('Generic SQL error (no transaction)', lineInfo.file, lineInfo.line);
		}
	}
}

// Get the value of a parameter from the page's hash.
// Example: If page's hash is "#foo=bar", getHashVar('foo') will return 'bar'
function getHashVar(varName) {
	var hash, pieces, piece, key, val
	hash = window.location.hash.substr(1)
	pieces = hash.split('&')
	for (var p in pieces) {
		piece = pieces[p].split('=')
		key = piece[0]
		val = piece[1]
		if (key === varName) {
			return urldecode(val)
		}
	}
	return '';
}

// Select a search engine to use in the Search Box. Function name is kind of misleading.
function selectOpenSearchType(el, focusToo) {
	if (document.title == "faux-searchbar.background") {
		return false;
	}
	if ($(".shortname", el).length == 0) {
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
		$("#opensearch_menufocus").blur();
		return false;
	}
	$("img.opensearch_selectedicon").attr("src", $("img", el).attr("src"));
	var shortNameHtml = $(".shortname", el).html();
	var osi = $("#opensearchinput");
	if ($(".shortname", el).length) {
		osi.attr("placeholder", shortNameHtml.replace('"','&quot;'));
	}
	window.openSearchShortname = shortNameHtml;
	window.openSearchEncoding = $(el).attr("encoding");
	var newTitle = "Search using " + shortNameHtml.replace('"','&quot;');
	osi.attr("title",newTitle).attr("realtitle",newTitle);
	if (focusToo == true || window.changeDefaultOpenSearchType == true) {
		window.changeDefaultOpenSearchType = null;
		if (focusToo) {
			osi.focus();
			osi.select();
		}
		if (openDb()) {
			window.db.transaction(function (tx) {
				tx.executeSql('UPDATE opensearches SET isdefault = 0');
				tx.executeSql('UPDATE opensearches SET isdefault = 1 WHERE shortname = ?', [window.openSearchShortname]);
				localStorage.osshortname = window.openSearchShortname;
				localStorage.osiconsrc = $(".vertline2 img", el).attr("src");
			}, function(t){
				errorHandler(t, getLineInfo());
			}, function(){
				chrome.runtime.sendMessage(null, "backup search engines");
			});
		}
	}
	$('#opensearchmenu .menuitem').removeClass("bold");
	$('#opensearchmenu .menuitem[shortname="' + window.openSearchShortname.replace('"','&quot;') + '"]').addClass("bold");
}

// Initialize/create the database
function openDb() {
	if (!$(document).ready()) {
		return false;
	}
	if (!window.db) {
		window.db = openDatabase('faux-searchbar', '1.0', 'Faux Searchbar data', 100 * 1024 * 1024);
	}

	if (window.db) {
		return true;
	}
	else {
		alert("Faux Searchbar error: Unable to create or open Faux Searchbar's SQLite database.");
		return false;
	}
}

// Set localStorage vars with default Faux Searchbar values.
// Used when first loading Faux Searchbar, or when user chooses to reset all the values.
function resetOptions() {
	localStorage.option_launch_FauxSearchbar = "newTab";				// Open Faux Searchbar upon clicking browser action icon. newTab, currentTab or newWindow
	localStorage.option_optionpage = "option_section_general";	// Option section/subpage to load when Options are shown.
}

// Below are mostly borrowed functions from other sources.
// If you see your function below, thank you!

////////////////////////////////////////////////////////////////////////////

// http://phpjs.org/functions/strstr:551
function strstr (haystack, needle, bool) {
	var pos = 0;

	haystack += '';
	pos = haystack.indexOf(needle);
	if (pos == -1) {
		return false;
	} else {
		if (bool) {
			return haystack.substr(0, pos);
		} else {
			return haystack.slice(pos);
		}
	}
}

// http://phpjs.org/functions/substr_count:559
function substr_count (haystack, needle, offset, length) {
    var pos = 0,
        cnt = 0;

    haystack += '';
    needle += '';
    if (isNaN(offset)) {
        offset = 0;
    }
    if (isNaN(length)) {
        length = 0;
    }
    offset--;

    while ((offset = haystack.indexOf(needle, offset + 1)) != -1) {
        if (length > 0 && (offset + needle.length) > length) {
            return false;
        } else {
            cnt++;
        }
    }

    return cnt;
}

// Sort longest string length to shortest
function compareStringLengths (a, b) {
  if ( a.length < b.length )
    return 1;
  if ( a.length > b.length )
    return -1;
  return 0; // a and b are the same length
}

// http://phpjs.org/functions/urlencode:573
function urlencode (str) {
    str = (str + '').toString();

    // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
    // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
    return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
    replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
}

// http://phpjs.org/functions/urldecode:572
// Modified to catch malformed URI errors
function urldecode (str) {
	try {
		return decodeURIComponent((str + '').replace(/\+/g, '%20'));
	} catch(e) {
		console.log(e);
		if (e.message) {
			return 'Error: '+e.message;
		} else {
			return 'Error: Unable to decode URL';
		}
	}
}

// http://phpjs.org/functions/str_replace:527
function str_replace (search, replace, subject, count) {
	var i = 0,
		j = 0,
		temp = '',
		repl = '',
		sl = 0,
		fl = 0,
		f = [].concat(search),
		r = [].concat(replace),
		s = subject,
		ra = Object.prototype.toString.call(r) === '[object Array]',
		sa = Object.prototype.toString.call(s) === '[object Array]';
	s = [].concat(s);
	if (count) {
		this.window[count] = 0;
	}

	for (i = 0, sl = s.length; i < sl; i++) {
		if (s[i] === '') {
			continue;
		}
		for (j = 0, fl = f.length; j < fl; j++) {
			temp = s[i] + '';
			repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
			s[i] = (temp).split(f[j]).join(repl);
			if (count && s[i] !== temp) {
				this.window[count] += (temp.length - s[i].length) / f[j].length;
			}
		}
	}
	return sa ? s : s[0];
}
