#!/usr/bin/python
import lxml.etree as E
import lxml.html
import json, os.path, re, sys, urllib
import django.conf
from django.template.loader import render_to_string
django.conf.settings.configure(TEMPLATE_DIRS=([".","Templates"]))

# Output directory
site_dir = "Site"

# Subdir of site_dir where most things will go
# TODO: For now the trailing "/" is needed, but it really shouldn't be
content_prefix = "Files/"

epFnRe1 = re.compile("(\d)\.(\d\d[a-z]?)-.*\.")
epFnRe2 = re.compile("2ndShift_yr0(\d)_Ep(\d\d[a-z]?)\.")

class xmlData(object):
    def __init__(self, e):
        for c in e.getchildren():
            p = c.tag
            v = ((c.text or "") + "".join(map(lxml.html.tostring,c.iterchildren()))).encode("utf-8","replace")
            setattr(self,p,v)
            

class EpAttachment(object):
    def __init__(self,name,path,css_class=None,display="link",description=None):
        self.name = name
        self.path = path
        self.css_class = css_class
        self.display=display
        self.description=description        
        
        if path.startswith("http://"):
            self.display = "extlink"
        elif "audio" in css_class:
            self.display = "audio"
        elif "video" in css_class:
            self.display = "video"

class EpData(object):
    def __init__(self):
        for p in [
            "s_num",
            "e_num",
            "ep_fn",
            "script_fn",
            "commentary_fn",
            "date",
            "title",
            "summary",
            "duration",
            "freesound",
        ]:
            setattr(self,p,None)
        self.files = []
        self.notes = []
            
    def toString(self):
        s = []
        s.append("Season %s, Episode %s" % (self.s_num,self.e_num))
        return "\n".join(s)
        
        
    def __unicode__(self):
        return self.toString()
        
    def __str__(self):
        return self.toString()

# TODO: Build each page with a script in the page's directory
# instead of this clunky, monolithic approach

## EPISODES ##
d = E.parse("Episodes/data.xml")
for s in ("mp3","ogv"):
    sp = os.path.join("Episodes",s)
    if not os.path.exists(sp):
        os.makedirs(sp)
eps = {}
for ep in d.xpath("//item"):
    link = ep.find("link").text
    fn_link = link.split("/")[-1]
    m = epFnRe1.match(fn_link)
    if m is None:
        m = epFnRe2.match(fn_link)
        if m is None:
            continue
    (s_num,e_num) = m.groups()
    basefn = "SecondShift_Ep%s%s" % (s_num,e_num)
    
    ed = EpData()
    ed.epid = "%s%s" % (s_num,e_num)
    ed.s_num = s_num
    ed.e_num = e_num 
    ed.date = ep.find("pubDate").text
    ed.title = ep.find("title").text
    ed.summary = ep.find("summary").text
    ed.duration = ep.find("duration").text  
    ed.fn = basefn
    
    print "%s (%s/%s)" % (basefn,s_num,e_num) 
    fn_mp3 = "Episodes/mp3/%s.mp3" % (basefn)
    if os.path.exists(fn_mp3):
        ed.fn_mp3 = fn_mp3
    else:
        print "Downloading %s" % link
        try:
            data = urllib.urlopen(link).read()
            open(fn_mp3,"w").write(data)
        except Exception, e:
            sys.stderr.write("FATAL: No file for %s, and failed to download.\n URL: %s\n:Error: %s" % (fn_mp3,link,e))
            sys.exit()
        
    fn_ogg = "Episodes/ogg/%s.ogg" % (basefn)
    if os.path.exists(fn_ogg):
        ed.fn_ogg = fn_ogg
    else:
        print "Converting %s to .ogg" % fn_mp3
        command = "ffmpeg -i %s %s" % (fn_mp3,fn_ogg)
        try:
            os.system(command)
        except Exception, e:
            sys.stderr.write("Could not convert mp3 to ogg. Do you have ffmpeg installed?\n Command: %s\n Error: %s\n" % (command,e))
            sys.exit()
        
    fn_script = "Episodes/scripts/%s.pdf" % basefn
    if os.path.exists(fn_script):
        f = EpAttachment("Recording Script",fn_script,"script")
        ed.files.append(f)
        
    freesound = ep.find("freesound")
    if freesound is not None:
        ed.freesound = freesound.text

    flink = ep.find("forum")
    if flink is not None:
        if flink.get("href"):
            url = flink.get("href")
            description = flink.text
        else:
            url = flink.text
            description = None
        f = EpAttachment("Listener comments from the Second Shift forums",url,"feedback", description=description)
        ed.notes.append(f)

    for d in os.listdir("Episodes/notes"):
        # accept directories or symlinks
        if os.path.isfile(d): 
            continue

        fn= os.path.join("Episodes/notes",d,"%s.html" % basefn)
        if os.path.exists(fn):
            props = {
                "name" : "Notes about the show",
                "description" : "Thoughts and analysis from a listener",
                "path" : fn,
                "css_class" : d,
                "display" : "inline",
            }
            props_override = os.path.join("Episodes/notes",d,"props.json")
            if os.path.exists(props_override):
                props.update(json.load(open(props_override,"r")))
            f = EpAttachment(**props)
            ed.notes.append(f)
        
    fn_commentary = "Episodes/commentaries/mp3/%s-commentary.mp3" % basefn
    if os.path.exists(fn_commentary):
       ed.fn_commentary = fn_commentary
       
    for e in ep.xpath(".//file"):
        path = e.get("path")
        css_class = e.get("css_class")
        if e.get("name"):
            name = e.get("name")
            description = e.text
        else:
            name = e.text    
            description = None
        f = EpAttachment(
            name=name,
            path=path,
            css_class=css_class,
            description=description,
        )
        ed.files.append(f)
        
    if not eps.has_key(s_num):
        eps[s_num] = []
    eps[s_num].append(ed)
    
if not os.path.exists(site_dir):
    os.makedirs(os.path.join(site_dir,content_prefix))

for (s,s_eps) in eps.items():
    p = os.path.join(site_dir,content_prefix,"season"+s)
    fn = p + ".html"
    tpl = "Episodes/template.html"
    f = open(fn,"w+")
    f.write(render_to_string(tpl,{"page":p, "eps":s_eps}));
    f.close()

## Cast and Crew Bios ##
castcrew = []
castcrew_xml = E.fromstring(open("CastCrew/data.xml","r").read().decode("latin-1").encode("utf-8")).xpath("//person")
for c in castcrew_xml:
    x = xmlData(c)
    x.pic = x.name.replace(" ","").lower()+".png"
    if ( not os.path.exists("CastCrew/img/"+x.pic) ):
        x.pic = "default.png"
    castcrew.append(x)
fn = os.path.join(site_dir,content_prefix,"castcrew.html")
tpl = "CastCrew/template.html"
f = open(fn,"w+")
f.write(render_to_string(tpl,{"page":"castcrew","castcrew":castcrew}));
f.close()

## Simpler Pages ##
for p in ("about","bonus"):
    fn = os.path.join(site_dir,content_prefix,p+".html")
    f = open(fn,"w+")
    tpl = "%s/template.html" % p.capitalize() 
    f.write(render_to_string(tpl,{"page":p}));
    f.close()

## Default Page ##
f = open(os.path.join(site_dir,"Double-Click to Begin!.html"),"w+")
tpl = "About/template.html"
f.write(render_to_string(tpl,{"page":"about","prefix":content_prefix}))
f.close()

