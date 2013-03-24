(function() {

/******************* begin configuration options ***************************/

// Change `read` to true to invoke the promptless, self-closing 
// version of the bookmarklet.
var readlater = false;
var customUrl = null;
// when set to true selected text is quoted using markdown quote syntax
var quoteSelectionAsMarkdown = true;
// when this text appears in title or description they are added as tags
var tagKeywords = {
  javascript:'javascript',
  js:'javascript',
  python:'python',
  ios:'ios',
  youtube:'video',
  vimeo:'video',
  video:'video',
  books:'book',
  book:'book'
};

/********************* begin code ********************************************/

// reduce a string to some canonical representation
// right now this just picks a case but could get really complicated if need be
// see: http://stackoverflow.com/questions/227950/programatic-accent-reduction-in-javascript-aka-text-normalization-or-unaccentin
// some people like stack overflow straighten their curly quotes
var normalize = function(string) {
  return string.toLowerCase();
}

var normalizedDocumentTitle = normalize(document.title);

// used as tes
var isSubtitle = function(string) {
  if(string) {
    return normalizedDocumentTitle.indexOf(normalize(string)) != -1;
  }
  else {
    return false;
  }
};

// loops over a node list and applies a function
// returning the first value that is non-null
var selectFromNodeList = function(nodeList,func,thisObj) {
  thisObj = thisObj || window;
  var l = nodeList.length;
  var result;
  for(var i=0;i<l;++i) {
    result = func.call(thisObj,nodeList.item(i));
    if(result !== null) {
      return result;
    }
  }
  return null;
};

var getTitle = function() {
  var url = location.href;
  var documentTitle = document.title;
  var e = document.querySelector("meta[property='og:title']");
  if(e) {
    documentTitle = e.content.trim();
  }
  var i,a;

  // hEntry microformat
  if(selectFromNodeList(document.getElementsByClassName('hentry'), function(x) {return true;})) {
    var htitle = document.querySelector(
        '.hentry .entry-title'
      );
    if(htitle) {
      return htitle.textContent.trim();
    }
  }

  // method 1 - look for link to self with text that is contained in title
  
  var a_text = selectFromNodeList(document.getElementsByTagName('A'), function(a) {
    if(a.href == url) {
      a_text = a.textContent.trim();
      if(isSubtitle(a_text)) {
        return a_text;
      }
    }
    return null;
  });
  if(a_text) {
    return a_text;
  }
  
  // method 2 - look at header tags and see if it matches part of title
  var headerTags = ['h1','h2','h3','h4','h5','h6'];
  var h;
  var headerTitle;
  for(var j=0;j<headerTags.length;++j) {
    selectFromNodeList(document.getElementsByTagName(headerTags[j]), function(h) {
      h_text = h.textContent.trim();
      if(isSubtitle(h_text) && (!headerTitle || h_text.length > headerTitle.length)) {
        headerTitle = h_text;
      }
      return null;
    });
  }
  if(headerTitle) {
    return headerTitle;
  }

  // method 3 - just return the title
  return documentTitle;
};

var getTags = function(text) {
  text = normalize(text);
  var tags = [];
  var re;
  for(keyword in tagKeywords) {
    re = keyword instanceof RegExp ? keyword : new RegExp("\\b"+keyword+"\\b","i");
    if(re.test(text)) {
      tags.push(tagKeywords[keyword]);
    }
  }
  return tags;
};

var getMetaDescription = function() {
  var e;
  e = document.querySelector("meta[name='description']");
  if(e) {
    return e.content.trim();
  }
  e = document.querySelector("meta[property='og:description']");
  if(e) {
    return e.content.trim();
  }
  return "";
};

var getDescription = function() {
  var text;
  // Grab the text selection (if any) and quote it
  if('' !== (text = String(document.getSelection()))) {
    if(quoteSelectionAsMarkdown) {
      text = text.trim().split("\n").map(function(s) {return "> "+s;}).join("\n");
    }
  }
  
  if(!text) {
    text = getMetaDescription();
  }
  return text;
};

// Assembles default form pre-fill arguments.
var url = location.href;
var title = getTitle();
var description = getDescription();
// remove if title is trailing or leading
var ix = description.indexOf(title);
if(ix == 0) {
  description = description.substring(title.length).trim();
}
else if(ix == description.length-title.length) {
  description = description.substring(0,ix).trim();
}

var args = [
  'url=', encodeURIComponent(location.href),
  '&title=', encodeURIComponent(title),
  '&description=', encodeURIComponent(description),
  // this could based on a general function "getText()"
  '&tags=', encodeURIComponent(getTags(document.title+" "+description+" "+getMetaDescription()).join(" "))
];

// If readlater mode, add the auto-close parameter and read-later flag:
if(readlater) {
  args = args.concat([
    '&later=', 'yes',
    '&jump=', 'close'
  ]);
}
if(customUrl) {
  open(customUrl+args.join(''), '', '');
}
else {
  var pin = open('http://pinboard.in/add?'+args.join(''), 'Pinboard', 'toolbar=no,width=610,height=350');

  // Send the window to the background if readlater mode.
  if(readlater) {
    pin.blur();
  }  
}

})()