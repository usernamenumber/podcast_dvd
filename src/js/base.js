function get_epnum(e) {
  p = $(e).parents(".ep").first()
  if ( p.length > 0 ) {
      return p.attr("id");
  } else {
      return false;
  }
}

function get_sources(epnum,type) {
  var sources = [];
  var p = $("#audiobar-" + epnum).first();
  if (typeof(p) === "undefined") {
    return sources;
  }
  var mp3url = $(p).data(type + "_mp3");
   if (typeof(mp3url) !== "undefined") {
    var mp3src = $("<source>");
    mp3src.attr("src",mp3url);
    mp3src.attr("type","audio/mpeg")
    sources.push(mp3src);
   } 

   var oggurl = $(p).data(type + "_ogg");
   if (typeof(oggurl) !== "undefined") {
    var oggsrc = $("<source>");
    oggsrc.attr("src",oggurl);
    oggsrc.attr("type","audio/ogg");
    sources.push(oggsrc);
   } 
   return sources;
}

function get_ep_sources(epnum) {
  return get_sources(epnum,"ep");
}

function get_cm_sources(epnum) {
  return get_sources(epnum,"cm");
}

function swap_episode(epnum,force) {
  console.log("swap_episode("+epnum+","+force+  ")");
  a = $('#audio-' + epnum)[0];

  //html5 audio hasn't been created yet. No
  // worries. It'll be taken care of later.
  if ($(a).length == 0) {
    return ;
  }
  var t = a.currentTime;
  if (typeof(a) === "undefined") {
    return;
  }
  cm_sel = $("#cm_sel-"+epnum).first();
  if (force == "commentary" || $(cm_sel).hasClass("inactive")) {
      var sources = get_cm_sources(epnum);
      $(cm_sel).removeClass("inactive");
  } else {
      var sources = get_ep_sources(epnum);
      $(cm_sel).addClass("inactive");
  } 
  $(a).empty();
  $(a).append(sources);

  //console.log(fn);
  if ( a.paused ) {
      $(a).data("playing",false);
  } else {
      $(a).data("playing",true);
  }
  $(a).data("offset",a.currentTime);
  a.load();
}

function get_html5_audio(n) {  
  var p = $("#audiobar-"+n);
   var elements = [];
   if ( typeof(n) === "undefined" ) {
       $(p).children(".fallback_buttons").show();  
        return elements;
   }
   
   if ($(p).children("audio").length > 0) {
      return elements;
   }

   var a = $("<audio>");
   a.attr("id", "audio-" + n);
   a.attr("controls","controls");
  
    $(a).on("loadedmetadata",function() {
          var t = $(this).data("offset");
          if (t) {
              this.currentTime=t; 
          }
          if ($(this).data("playing")) {
               this.play();
           }
     });

   $(a).on("playing", function() {
            var p = $(this).parents(".ep")[0];
            if ( ! $(p).hasClass("active") ) {
                $(".ep").removeClass("active");
                $(p).addClass("active");
            }
            $(this).data("playing",true);
            $(p).find(".main").first().slideDown();
   });
   
    $(a).on("pause", function() {
            var p = $(this).parents(".ep")[0];
            $(p).removeClass("active");
            $(this).data("playing",false);
    }); 

  $(a).on("ended",function () {
        if ($("#continuous_play").hasClass("inactive")) {
            return;
        }
        var ep = $(this).parents(".ep").first();
        var next = $(ep).next()
        if (next.length == 0) {
          return;
        }
        if ( ! $(next).find("main").first().is(":visible")) {
          $.Deferred().done(function() {
            $(next).find(".headerbar").first().click()
          }).done( function() {
            $(next).find("audio")[0].play();
          }).resolve();
        } else {
          $(next).find("audio")[0].play();
        }
    });

    elements.push(a);

    var cmurl = $("#audiobar-"+n).data("cm_mp3");
    if (typeof(cmurl) !== "undefined") {
      console.log("cm " + n + ": " + cmurl);
       var cm_sel = $("<img>");
       if ($("#all_commentaries").hasClass("inactive")) {
           cm_sel.addClass('inactive');
           $(a).append(get_ep_sources(n));
       } else {
           $(a).append(get_cm_sources(n));
       }
       cm_sel.addClass('audiohelp');
       cm_sel.addClass('cm_ep_icon');
       cm_sel.attr("id","cm_sel-"+n);
       cm_sel.attr("src","src/img/commentary-teeny.png");
       cm_sel.attr("alt","Toggle commentary");
       cm_sel.attr("title","Toggle commentary");
       cm_sel.click(function(e) {
           var n = get_epnum(this);
           swap_episode(n);
       });
       elements.push(cm_sel);
   } else {
    console.log("No cm for " + n)
    $(a).append(get_ep_sources(n));
   } 
   
   var mp3link_ext = $("<a><img src='src/img/curve_arrow-right.png'></a>");
   mp3link_ext.attr("id","mp3link-"+n);
   mp3link_ext.attr("href",$(p).data("ep_mp3"));
   mp3link_ext.attr("target","_blank");
   mp3link_ext.attr("title","Open in external player");
   mp3link_ext.addClass("audiohelp");
   elements.push(mp3link_ext);

   return (elements);
}

function add_topbutton(data) {
  var tb = $("#topbuttons ul");
  var container = $("<li>");
  var icon = $("<img>");
  for ( var i in data.classes ) {
       container.addClass(data.classes[i]);
   }
   data.id && container.attr("id",data.id);
   data.title && icon.attr("title",data.title);
   data.icon && icon.attr("src",data.icon);
   data.callback &&  container.click(data.callback);
   data.title && $(container).mouseover(function() {
       $("#topbuttons_label").html(data.title);
   });
   data.title && $(container).mouseout(function() {
       $("#topbuttons_label").html("");
   });
   $(container).append(icon);
   $(tb).append(container);
}

$(document).ready(function() {
  $(".fallback_buttons").hide();

  add_topbutton({
       id: "continuous_play",
       title: "enable continuous play",
       classes: ["commentary"],
       icon: "src/img/continuous.png",
       callback: function() {
          $(this).toggleClass("inactive");
       },
  });
  
  if ( $(".fallback_buttons .commentary").length > 0 ) {
      add_topbutton({
           id: "all_commentaries",
           title: "toggle all commentaries",
           classes: ["cm_main_icon","inactive"],
           icon: "src/img/commentary-teeny.png",
           callback: function() {
              $(this).toggleClass("inactive");
              if ($(this).hasClass("inactive")) {
                  force = "episode";
              } else {
                  force = "commentary";
              }
              $(".cm_ep_icon").each(function() {
                  var n = get_epnum(this);
                  swap_episode(n,force);
              });
           },
      });
  }

  // Tricksy way to get appropriate height for one line of text
  var tmp = $("<div class='audiohelp_text'>A</div>").hide().appendTo("body")
  var deft_height = tmp.height();
  tmp.remove();
  $(".audiohelp_text").height(deft_height);
      
  $(".ep .headerbar").click(function () {
      var epnum = get_epnum(this);
      if ( ! epnum ) { return; }
      var p = $(this).parents(".ep");
      var t = $(p).find(".toggle").first();
      var m = $(p).find(".main").first();
      if ( $(m).css("display") == "none" ) {
        $(t).html("-");
        $(p).find(".audiobar").each(function() {
          if ($(this).find("audio").length == 0) {
            html5_audio = get_html5_audio(epnum);
            if (html5_audio.length > 0) {
              console.log("No audio")
              $(this).prepend(html5_audio);
              $(p).children(".fallback_buttons").hide();
            }
          }
        })
        $(p).find("iframe").each(function() {
            if ( typeof($(this).attr("src")) === "undefined") {
             $(this).attr("src",$(this).data("src"));
            }
          });
      } else {
          $(t).html("+");
      }
      $(p).find(".main").slideToggle();
  });

  $(".headerbar audio").on("playing",function () {
      //console.log("PLAY");
      var p = $(this).parents(".ep");
      $(p).addClass("active");
      $(p).find(".main").slideDown(null,null,function() {
        var t = $(p).find(".toggle");
        $(t).html("-");
      });
  });

  $(".eplist .main").hide();
  $(".epNumber").first().click();

  $(".toggled").hide();
  $(".toggler").click(function() {
    var split_name = $(this).attr("id").split("_");
    var type = split_name[1];
    var epnum = split_name[2];
    var toggle_id = "#toggled_"+type+"_"+epnum;
    var toggled = $(toggle_id);
    $(toggled).slideToggle()
  });


  //$(document).tooltip();
  $(".audiobar").on("mouseover",".audiohelp",function() {
     n = get_epnum(this);
     h = $("#audiohelp-"+n);
     if (h.html() == "&nbsp;") {
         h.empty();
     }
     t = $(this).attr("title");
     s = $("<div class='foo'>").html(t);
     s.hide();
     s.css("position","absolute");
     s.css("left","0");
     s.css("top","0");
     s.css("width","100%");
     h.append(s);
     s.fadeIn();
     //console.log("IN: audiohelp-"+n+" = "+t);
  });

  $(".audiobar").on("mouseout",".audiohelp",function() {
     n = get_epnum(this);
     $("#audiohelp-"+n).children().fadeOut({complete: function() {
         $(this).remove();
     }});

    $(".a")

     //console.log("OUT: audiohelp-"+n);
  });

  $(".note").each(function() {
    if ( $(this).data("display") == "inline" ) {

    }
  })

});

