## What is it?
The build system I use for the DVD version of [Second Shift](http://www.secondshiftpodcast.com), an audio theater podcast that ran from 2006 to 2011. It provides the complete series in one place with a nice web interface that supports dynamically turning commentary tracks on and off (where applicable), bonus content, etc. 

The purpose of this repo is to provide a safe place for the sources, and to give people with similar projects a framework for creating their own. 

If you are technical and curious how everything works, most of the interesting stuff is in `parse.py`, which gathers data to feed to templates in the various page directories (e.g. `Episode/`) to generate the site, and `src/js/base.js`, where all the fancy front-end stuff happens.

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

