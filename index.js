/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint forin:true, noarg:false, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:true, curly:false, browser:true,
  unused:true,
  indent:2, maxerr:50, devel:true, node:true, boss:true, white:true,
  globalstrict:true, nomen:false, newcap:true, esnext: true, moz: true  */

/*global */

"use strict";


let tabs = require("sdk/tabs");
// Define keyboard shortcuts for showing and hiding a custom panel.
var { Hotkey } = require("sdk/hotkeys");

let asanatab;

let CappedStack = function(n) {
  this._store = [];
  this.n = n;
  this.add = function (thing) {
    //console.log("push", thing, n, this.n, this._store.length);
    if (this._store.length >= this.n) {
      this._store.pop();
    }
    this._store.unshift(thing);
  };
  this.last = () => this._store[0];
  this.remove = () => this._store.pop(0);
  return this;
};

let asanastack = new CappedStack(10);
let tabstack = new CappedStack(10);

let asana_re = /app\.asana\.com/;

var tabs = require("sdk/tabs");
tabs.on('open', function(tab){
  tab.on('ready', function(tab){
    console.log(tab.url);
  });
});

let urls = (stack) => console.log(stack._store.map((t) => t.url));


let isAsana = (url) => asana_re.test(url);

let stackthis = function (tab) {
  console.log("should stack", tab.url);
  if (asana_re.test(tab.url)) {
    false;  // ignore, belt and suspenders here.
  } else {
    tabstack.add(tab);
  }
  console.log(tabstack._store.map((t) => t.url));
};

// set asanatab, or add to stack
let tabWatchers = [
  tabs.on("ready", function(tab){
    if (isAsana(tab.url)) {
      if (asanatab !== tab) {
        asanastack.add(tab);
        asanatab = tab;
      }
    }
  }),
  tabs.on("activate", function(tab){
    console.log("activate", tab.url);
    if (!isAsana(tab.url)) stackthis(tab);
  }),
  tabs.on("open", function(tab){
    console.log("open", tab.url);
    if (!isAsana(tab.url)) stackthis(tab);

  }),
  // fall back to the next most recent, if any
  tabs.on("close", function(tab){
    if (asanatab === tab) {
      console.log("closing current asanatab");
      asanastack.remove();
      console.log(asanastack._store.length);
      asanatab = asanastack.last();
    }
  })
];

let goToAsanaOrBack = function () {
  // if ON asana tab, go to previous
  if (tabs.activeTab === asanatab) {
    console.log("on asana tab");
    urls(tabstack);
    urls(asanastack);
    let t = tabstack.last();
    if (t) {
      t.activate();
      t.window.activate();
    } 
  } else {
    console.log("on other tab");
    // else go to asana tab if there is one
    if (asanatab) {
      console.log("activating asana tab");
      asanatab.activate();
      asanatab.window.activate();
    } else {
      console.log("no asana tabs");
    }
  }
};

let showHotKey = Hotkey({
  combo: "accel-control-a",
  onPress: function() {
    console.log("pressed");
    goToAsanaOrBack();
  }
});


let debugrun = function () {
  tabs.open("google.com");
  tabs.open("app.asana.com");
  tabs.open("ask.metafilter.com");
};

let main = exports.main = function (options, cb) {
  tabs.open(require('sdk/self').data.url('help.html'));
  if ((options.staticArgs || {}).debug) {
    debugrun();
  }
};



