$(window).bind("resize", function(){
	$("#options").css("position","absolute").css("top",$(".wrapper").offset().top+$(".wrapper").outerHeight()+30+"px").css("margin","0");
	if (window.innerWidth >= 1100) {
		$("#options").css("width","1000");
	} else {
		$("#options").css("width",window.innerWidth - 50 + "px");
	}
	$("#options").css("left", window.innerWidth/2 - $("#options").outerWidth()/2 + "px" );
}).trigger("resize");

// Update the page/tab title
document.title = (localStorage.extensionName ? localStorage.extensionName : "Faux Searchbar")+": Options";

// Stop animating the Faux Searchbar's Search Box reordering/fading animation when the user presses a key to change it to something else (so there's no animation queueing)
$("select").live("keyup", function(){
	$("#the-faux-searchbar").children("table").first().stop();
	$(this).change();
});

// Apply some Options page CSS automatically, sice I'm too lazy to keep on top of hard-coding the styles myself as I change the order of the HTML elements here and there.
$("table#options td").each(function(){
	$(this).children("label.legend").last().css("margin-bottom","0");
});

// Some more automatic HTML insertion, making my life easier
$("label.legend:not(.noBreak)").after("<br />");

// When the Chrome window is resized, resize the Options page appropriately
$(window).bind("resize", function(){
	$(".optionbox").css("height", $(window).height()-150-$("#the-faux-searchbar").height()+"px");
});
// And trigger it too here, so that the Option page's dimensions are correct from the getgo
$(window).resize();

// When the user clicks to change to a different Options page, make it so
$("#option_menu div").bind("mousedown", function(){
	changeOptionPage(this);
});

// Change to the last Options page the user was on
changeOptionPage($("#" + (localStorage.option_optionpage ? localStorage.option_optionpage : "option_section_general")));

// Load the list of search engines for the Search Box Options page
getSearchEngines();

//////////////////////////////////////////////////////
// Drag open search engine to change position/order //
//////////////////////////////////////////////////////

// When user begins to click and drag a search engine to rearrange the order, make it liftable
$(".osicon").live("mousedown", function() {
	window.mouseHasMoved = false;
	var thisParent = $(this).parent();
	var thisOffset = $(this).offset();
	$("body").append('<table id="dragging_os_row" style="width:'+thisParent.width()+'px; top:'+thisOffset.top+"px"+'; left:'+thisOffset.left+"px"+';"><tr class="opensearch_optionrow">'+thisParent.html()+'</tr></table>');
	$("#dragging_os_row tr td.shortname input").val($(this).nextAll("td.shortname").children("input").val());
	$("#dragging_os_row tr td.searchurl input").val($(this).nextAll("td.searchurl").children("input").val());
	$(this).parent().before('<tr class=".opensearch_optionrow dotted_os_row" style="height:'+$(this).parent().outerHeight()+'px;"><td colspan="5">&nbsp;</td></tr>');
	$(this).parent().css("display","none");
	window.draggingOsRow = true;
	return false;
});

// When the user moves their mouse...
$(document).mousemove(function(e){
	window.mouseHasMoved = false;
	if (window.mousemovePageX && window.mousemovePageY && (window.mousemovePageX != e.pageX || window.mousemovePageY != e.pageY)) {
		window.mouseHasMoved = true;
	}
	window.mousemovePageX = e.pageX;
	window.mousemovePageY = e.pageY;

	// If user is dragging a search engine from the Options page to rearrange the order, make the clicking and dragging work :)
	if (window.draggingOsRow == true && window.mouseHasMoved == true) {
		$(".opensearch_optionrow").css("opacity",1);
		$("#dragging_os_row").css("top", e.pageY-10+"px");
		$(".dotted_os_row").remove();
		$("table#opensearchoptionstable tr.opensearch_optionrow").each(function(){
			if (e.pageY < $(this).offset().top+$(this).outerHeight() && $(".dotted_os_row").length == 0) {
				$(this).before('<tr class=".opensearch_optionrow dotted_os_row" style="height:'+$(this).outerHeight()+'px;"><td colspan="4">&nbsp;</td></tr>');
			}
		});
		if ($(".dotted_os_row").length == 0) {
			var lastOptionRow = "table#opensearchoptionstable tr.opensearch_optionrow:last";
			$(lastOptionRow).after('<tr class=".opensearch_optionrow dotted_os_row" style="height:'+$(lastOptionRow).outerHeight()+'px;"><td colspan="4">&nbsp;</td></tr>');
		}
	}
});

// When the user releases the mouse button...
$("*").live("mouseup", function(){
	// If we're done rearranging the search engines, save the changes and update the order
	if (window.draggingOsRow == true) {
		window.draggingOsRow = false;
		var dottedOSRowOffset = $(".dotted_os_row").offset();
		$("#dragging_os_row").animate({top:dottedOSRowOffset.top+"px", left:dottedOSRowOffset.left+"px"}, 100, function(){
			$(".dotted_os_row").after($(".opensearch_optionrow:hidden"));
			$("#dragging_os_row").remove();
			$(".opensearch_optionrow").css("display","table-row");
			$(".dotted_os_row").remove();
			if (openDb()) {
				window.db.transaction(function(tx){
					tx.executeSql('UPDATE opensearches SET position = 0', []);
					var orderCount = 0;
					$($(".opensearch_optionrow").get()).each(function() {
						orderCount++;
						tx.executeSql('UPDATE opensearches SET position = ? WHERE shortname = ?', [orderCount, $("td.shortname input",this).val()]);
					});
				}, function(t){
					errorHandler(t, getLineInfo());
				}, function(){
					chrome.runtime.sendMessage(null, "backup search engines");
				});
				populateOpenSearchMenu();
			}
		});
	}
});

// When user presses Enter/Return in an input box, make the input box lose focus, since the user is done making changes
$('table#options input[type="text"], table#options input[type="number"]').live("keyup", function(e){
	if (e.keyCode == 13) {
		$(this).blur();
	}
});

// When the user edits one of the search engines (like its name or URL), update the database
$("tr.opensearch_optionrow td input").live("change", function(){
	$(this).val(str_replace('"','',$(this).val()));
	if (openDb()) {
		var osRow = $(this).parent().parent();
		window.db.transaction(function(tx){
			tx.executeSql('UPDATE opensearches SET shortname = ?, searchurl = ? WHERE shortname = ?', [str_replace('"','',$('.shortname > input',osRow).val().trim()), $('.searchurl > input',osRow).val().trim(), $('.shortname > input',osRow).attr("origvalue")]);
		}, function(t){
			errorHandler(t, getLineInfo());
		}, function(){
			$("#opensearchoptionstable > tbody > tr > td.shortname > input, #opensearchoptionstable > tbody > tr > td.searchurl > input").each(function(){
				$(this).attr("origvalue",$(this).val());
			});
			populateOpenSearchMenu();
			chrome.runtime.sendMessage(null, "backup search engines");
		});
	}
});

// When user clicks the cross next to a search engine, remove it from the database and from the screen
$(".opensearchcross").live("mousedown", function(){
	if (openDb()) {
		var theCell = this;
		window.db.transaction(function(tx){
			tx.executeSql('DELETE FROM opensearches WHERE shortname = ?', [$(theCell).prevAll('td.shortname').children('input').first().val()]);
		}, function(t){
			errorHandler(t, getLineInfo());
		}, function(){
			chrome.runtime.sendMessage(null, "backup search engines");
		});
		$(theCell).parent().animate({opacity:0}, 0, function() {
			$(this).remove();
			populateOpenSearchMenu();
			getSearchEngines();
		});
	}
});

// Retrieve and set saved options from localStorage, loading the values into input boxes and checking checkboxes as needed
var thisAttrId = "";
$("table#options input").each(function(){
	thisAttrId = $(this).attr("id");
	switch ($(this).attr("type")) {
		case "checkbox":
			if (thisAttrId) {
				$(this).prop("checked", localStorage[thisAttrId] == 1 ? "checked" : "");
			}
			break;
		default: //"text", "number"
			var defaultVal = '';
			$(this).val(localStorage[thisAttrId] && localStorage[thisAttrId].length > 0 ? localStorage[thisAttrId] : defaultVal);
			break;
	}
});

// Set each <select> element with the appropriate stored option
$("table#options select").each(function(){
	$(this).val(localStorage[$(this).attr("id")]);
});

// If user clicks one of the 3 preset search engine buttons, restore the clicked engine by adding it to the database and have it appear on screen
$(".searchenginebutton").live("click", function(){
	if (openDb()) {
		var button = this;
		window.db.transaction(function(tx) {
			tx.executeSql('DELETE FROM opensearches WHERE searchurl = ?', [$(button).attr("searchurl")]);
			tx.executeSql('INSERT INTO opensearches (shortname, iconurl, searchurl, method, isdefault) VALUES (?, ?, ?, ?, ?)', [$(button).attr("shortname"), $("img",button).attr("src").substr(5), $(button).attr("searchurl"), "get", "0"]);
			$(button).css("display","none");
		}, function(t){
			errorHandler(t, getLineInfo());
		}, function(){
			chrome.runtime.sendMessage(null, "backup search engines");
		});
		getSearchEngines();
		populateOpenSearchMenu();
	}
});

$("table#options").bind("mouseenter", function(){
	$(this).stop().animate({opacity:1}, 250)
});

// Update localStorage with the chosen option when an input element changes
$("table#options input").bind("change", function(){
	switch ($(this).attr("type")) {
		case "checkbox":
			localStorage[$(this).attr("id")] = $(this).prop("checked") ? 1 : 0;
			break;
		case "text":
			localStorage[$(this).attr("id")] = $(this).val();
			break;
		case "number":
			localStorage[$(this).attr("id")] = $(this).val();
			break;
		default:
			break;
	}
});
$("table#options select").bind("change", function(){
	localStorage[$(this).attr("id")] = $(this).val();
});

// All the Options have been loaded and primed, so let's show the Options page now
$("#options").css("display","block");

$('button[addManually]').live('click', addEngineManually);
$('button[showBackupInfo]').live('click', showBackupInfo);
$('button[showRestoreInfo]').live('click', showRestoreInfo);
$('button#applyrestore').live('click', restoreOptions);

$('a[sortSearchEnginesAlphabetically]').live('click', sortSearchEnginesAlphabetically);

$('#backupinfo').live('click', function(){
	$('#backup').select();
});

$('#restoreSearchEngines button[resetEngines]').live('click', function(){
	if (confirm('Remove all search engines?')) {
		var $b = $(this);
		var txt = $b.text();
		$b.text('Restoring...').prop('disabled','disabled');
		setTimeout(function(){
			resetSearchEngines();
			$b.text(txt);
			$b.removeProp('disabled');
		}, 500);
	}
});
