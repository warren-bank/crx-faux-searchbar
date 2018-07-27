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

#### Fork:

This extension is a fork of [Fauxbar](https://github.com/ChrisNZL/Fauxbar)
* based on [version 1.7.4](https://github.com/ChrisNZL/Fauxbar/tree/57f1271ff90321c26ce13493efb13098c47c8093) (16 January 2018)
* written by [Chris McFarland](https://github.com/ChrisNZL)

This extension is a strict subset of the original. It strips away many of its features and functionality.
* the original is a powerful alternative to the Chrome omnibox
  * it integrates itself tightly with many Chrome settings (ex: bookmarks, history)
  * it maintains a database copy of each of these settings, and uses APIs to be notified of changes so it can keep its database in sync
  * it provides the ability to sync this data to "the cloud"
* in addition, the original includes a search bar that does __not__ integrate with Chrome's custom search engine settings
  * the data only exists in its database
* the purpose of this extension is to carve out only this search bar, and remove all the rest

#### Incognito Limitations:

These limitations are inherited from the design of the original extension:
* cannot open the extension's search page in an incognito window
  * would need to add `"incognito": "split"` to `manifest.json`
* cannot directly access the database from a user-script in an incognito window
  * would need to migrate all code that touches the database to the background script
  * would need to update the user-script to run this code via the background script
  * this wouldn't work with `"incognito": "split"` since:
    * the background script that can be accessed by user-scripts in an incognito window cannot directly access the database

#### Credits:

* [Fauxbar](https://github.com/ChrisNZL/Fauxbar)
* [icons](http://www.iconarchive.com/show/mono-general-2-icons-by-custom-icon-design/search-icon.html) by [Custom Icon Design](http://www.customicondesign.com/)
  * free for non-commercial use

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
