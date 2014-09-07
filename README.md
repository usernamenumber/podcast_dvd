## What is it?
The build system I use for the DVD version of [Second Shift](http://www.secondshiftpodcast.com), an audio theater podcast that ran from 2006 to 2011. It provides the complete series in one place with a nice web interface that supports dynamically turning commentary tracks on and off (where applicable), bonus content, etc. 

The purpose of this repo is to provide a safe place for the sources, and to give people with similar projects a framework for creating their own. 

## How does it work?
If you are technical and curious aboute the code, the most interesting stuff is in `parse.py` and `src/js/base.js`. See below for details.

The build process is controlled by `build.sh`, does the following (among other things):
* Runs `parse.py`, which looks in each of the page subdirectories (Episodes, CastCrew, About, etc) and uses the Django template therein (`template.html`), along with data in `data.xml` if present, to build HTML for each page into the `Site/` subdirectory.
* Downloads episode MP3s and converts them to OGGs (necessary for HTML5 audio in some browsers) as necessary
* rsyncs all the site data (episodes, images, javascripts, etc) into the `Site/` subdirectory.
* Builds an ISO from the contents of `Site/`
  * *Note:* This step currently uses OSX-specific tools. If you're on another OS, you can run `build.sh content` to just populate `Site/`, and then use local tools (e.g. mkisofs) to build the ISO.

It's also worth noting that the episode pages are designed to be able to play under as many circumstances as possible:
* The HTML produced by `build.sh` has links to open each file, without requiring HTML5 or Javascript
* If HTML5 and Javascript are both active, the code in `src/js/base.js` replaces the simple links with a fancier player (which still provides a button for opening the file in an external player)

## How do I use it?
Much of the content is specific to Second Shift, but it shouldn't be difficult to customize if you are familiar with some of the technologies used, particularly [jQuery](http://api.jquery.com/), and [Django templates](http://django.readthedocs.org/en/latest/topics/templates.html). 

If you want to customize it, do the following:

1. Install [ffmpeg](http://ffmpeg.org). 
  * The build system needs this to convert MP3s to OGGs, which are needed for HTML5 audio in some browsers.
2. Clone this repo
  * If you want to do a test build to see how things work, run `./build.sh`. To preview the rendered content without building an ISO, run `./build.sh content` and then look in the `Site/` subdirectory.
  * This will generate a version of the Second Shift DVD that is missing a lot of content, mainly because it wouldn't be nice to GitHub to make them host a bunch of large binaries. 
  * The ISO building portion of the process currently uses OSX-specific tools and is unlikely to work on other platforms. Expect this to change soon. 
1. Edit `parse.py` and edit some settings:
  * Set `showName` to your show's name (for use in creating certain files)
  * Populate `epFnRes` with regular expressions that extract season and episode numbers from the filenames in your feed's <link> tags.  
    * The following formats are understood by default (no need to change this setting if you use them):
      * `1.01-whatever.mp3`
      * `1.01b-whatever.mp3`
      * `whatever_yr01_Ep01-whatever.mp3`
    * Eventually I'll put together a more flexible system, but for now if your files don't contain season and episode numbers in that order, you're going to have to do some hacking to make the build work.
2. Place your podcast's rss feed file in Episodes/data.xml 
  * If you already have local copies of the episodes and want to save time, put them in `Episodes/mp3/`, and `Episodes/ogg/`, using the same filenames used in the <link> tags of your feed. 
  * The files *must* follow the naming convention `$SHOWNAME_Ep$SEASON$EPISODE` to be recognized 
  * Anything from the feed that isn't present in these directories (and with the expected filename) will be downloaded and converted as needed during the build process.
3. If you have commentary tracks, put them in `Episodes/commentaries/{mp3,ogg}/$EP_FILENAME-commentary.{mp3,ogg}`
  * These will not download automatically. If you want them, you'll need to put them in place manually! 
4. Customize the `template.html` files in `About`, `Bonus`, `CastCrew`, and `Episodes` as desired.
  * Other assets worth looking at include:
    * `src/img/*`
    * `src/css/base.css`
5. Run `./build.sh` as described above.

