### [Faux Searchbar](https://github.com/warren-bank/crx-faux-searchbar)

#### Summary:

Chromium browser extension:
* provides the ability to easily:
  * describe custom search engines
    * specifically, any endpoint that can accept _GET_ or _POST_ requests and returns a complete HTML document
  * select an engine
  * run a query
* all data is self-contained
  * can be export and reimport in JSON format
  * does __not__ integrate with any Chrome settings, such as:
    * custom search engines
    * bookmarks
    * history
    * etc..
  * uses the data stores:
    * [WebSQL](https://en.wikipedia.org/wiki/Web_SQL_Database)
    * [localStorage](https://en.wikipedia.org/wiki/Web_storage#localStorage)

#### Notes:

* many of the more advanced/technical options can only be edited in JSON
  * the easiest workflow is: export, edit, clear all search engines, import
* format of JSON data:
```javascript
{
    "restore": "append",
    "searchengines": [{shortname, iconurl, searchurl, method, encoding, position, isdefault}]
}
```
* fields:
  * _restore_:
    * `"append"`
      * import appends new data to existing
    * any other value:
      * import deletes and replaces existing data
  * _searchengines_:
    * array of individual search engines
    * _individual search engines_:
      * _shortname_:
        * String: descriptive name that appears in dropdown list
      * _iconurl_:
        * String: URL for the icon that appears in dropdown list
      * _searchurl_:
        * String: URL to open when the search engine is chosen from dropdown list
          * the substring `"{searchTerms}"` is interpolated with the (url-encoded) value entered in the text search field
      * _method_:
        * String: `"get"` or `"post"`
      * _encoding_:
        * String: modifies url-encoding of the text search field
          * `"other"`:
            * whitespace is replaced by: `"%20"`
          * all other values:
            * whitespace is replaced by: `"+"`
      * _position_:
        * Number: modifies sort order
          * `position ASC, shortname ASC`
            * 1st: search engines are sorted by _position_
            * 2nd: within each group of search engines that share the same _position_, they are sub-sorted by _shortname_
      * _isdefault_:
        * Number (representing a boolean):
          * `1`:
            * can only be set to true for one single search engine in array
            * causes the chosen search engine to be selected by default when the searchbar page is opened
          * `0`:
            * otherwise
* when _searchurl_ does not contain the substring `"{searchTerms}"`:
  * _searchurl_ is a static bookmark
    * the value entered in the text search field is ignored
  * _searchurl_ is opened as soon as the search engine is chosen from dropdown list
* when the dropdown list is toggled open:
  * its contents will be dynamically filtered by the value entered in the text search field
    * case is ignored
    * special filters:
      * `"*"`:
        - only display search engines that utilize: `"{searchTerms}"`
      * `"!*"`:
        - only display static bookmarks that do __not__ utilize: `"{searchTerms}"`
  * to see an unfiltered list of all available search engines, clear the value entered in the text search field

#### Fork:

This extension is a fork of [Fauxbar](https://github.com/ChrisNZL/Fauxbar)
* based on [version 1.7.4](https://github.com/ChrisNZL/Fauxbar/tree/57f1271ff90321c26ce13493efb13098c47c8093) (16 January 2018)
* written by [Chris McFarland](https://github.com/ChrisNZL)

This extension was started with the intention to be a strict subset of the original. It stripped away many of its predecessor's features and functionalities.
* the original is a powerful alternative to the Chrome omnibox
  * it integrates itself tightly with many Chrome settings (ex: bookmarks, history)
  * it maintains a database copy of each of these settings, and uses APIs to be notified of changes so it can keep its database in sync
  * it provides the ability to sync this data to "the cloud"
* in addition, the original includes a search bar that does __not__ integrate with Chrome's custom search engine settings
  * the data only exists in its database
* the purpose of this extension was to carve out only this search bar, and remove all the rest

The initial release of this extension met this goal. It has since added a few bells &amp; whistles of its own.

#### Incognito Limitations:

These limitations are inherited from the design of the original extension:
* cannot open the extension's search page in an incognito window
  * would need to add `"incognito": "split"` to `manifest.json`
* cannot directly access the database from a user-script in an incognito window
  * would need to migrate all code that touches the database to the background script
  * would need to update the user-script to run this code via the background script
  * this wouldn't work with `"incognito": "split"` since:
    * the background script that can be accessed by user-scripts in an incognito window cannot directly access the database

#### Incognito Workaround:

added in v0.2.0:
* Options &gt; General &gt; Query:
  * Upon submitting a search query, open the results: __in an incognito window__
  * pro:
    * displays search results in an incognito window
  * con:
    * the search bar must still be loaded into a non-incognito window
  * caveats:
    * "Allow in incognito" must be true
      * not used for loading the search bar, but needed to access incognito _windowId_ values used by the _tabs_ API
    * new incognito tabs are initialized to an "http:" URL, since extensions cannot access "chrome://newtab/"
      * explains why the new tab might momentarily display a small icon

#### Credits:

* [Fauxbar](https://github.com/ChrisNZL/Fauxbar)
* [icons](http://www.iconarchive.com/show/mono-general-2-icons-by-custom-icon-design/search-icon.html) by [Custom Icon Design](http://www.customicondesign.com/)
  * free for non-commercial use

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
