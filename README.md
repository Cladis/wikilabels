Installation
===========================

This script is available as a gadget on test.wikipedia.org. You can enable it there by checking the box for "QualityCoding" at
https://test.wikipedia.org/wiki/Special:Preferences#mw-prefsection-gadgets

Alternativelly, if you want to install it in other wikis:
1. Go to one of the js subpages of your user page. You can choose a page such as these:
  * [meta:User:`<Name>`/global.js](https://meta.wikimedia.org/wiki/Special:MyPage/global.js), which will be loaded in all wikis, in all skins
  * [meta:User:`<Name>`/common.js](https://meta.wikimedia.org/wiki/Special:MyPage/common.js), which will be loaded only on Meta-wiki, in all skins
  * [meta:User:`<Name>`/vector.js](https://meta.wikimedia.org/wiki/Special:MyPage/vector.js), which will be loaded only on Meta-wiki, in the vector skin
2. Copy the following to the page you have chosen:

  ```javascript
  // [[File:User:He7d3r/Tools/QualityCoding.js]] (workaround for [[phab:T35355]])
  mw.loader.load( '//meta.wikimedia.org/w/index.php?title=User:He7d3r/Tools/QualityCoding.css&action=raw&ctype=text/css', 'text/css' );
  mw.loader.load( '//meta.wikimedia.org/w/index.php?title=User:He7d3r/Tools/QualityCoding.js&action=raw&ctype=text/javascript' );
  ```

3. Clear the cache of your browser.

This will import the minified copy of the script I maintain on Meta-wiki.

Usage
=====

This is a prototype of a gadget for scoring revisions according to their constructiveness, their author's good-faith and other similar (not necessarily binary) criteria.

Once installed, the code will be executed on diff pages (those whose URL contains "diff="). The gadget loads a set of revisions (currently, the newest 50 recent changes) and allows the user to score them one by one. There is a progress bar showing each revision in the set, colored according to its status. Detailed information can be seen by putting the mouse over a specific revision in the bar. When the user submits the scores for a revision, the values are saved in a database in Tool Labs. The table can be viewed at
* https://tools.wmflabs.org/ptwikis/dev/Pontua%C3%A7%C3%A3o.

For discussion on the design, access
* https://meta.wikimedia.org/wiki/Research_talk:Revision_scoring_as_a_service#Revision_handcoding_.28mockups.29
