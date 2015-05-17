"use strict";

module.exports = function(path, sourceName="js/timeline-editor.min.js") {
  let scripts = document.getElementsByTagName("script");
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src.indexOf(sourceName) !== -1) {
      return scripts[i].src.replace(sourceName, "") + path;
    }
  }
};
