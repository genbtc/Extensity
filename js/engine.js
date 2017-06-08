ko.extenders.pluckable = function(target, option) {
  // Pluck an iterable by an observable field
  target.pluck = ko.computed(function() {
    return _(target()).map(function(i) { return i[option](); });
  });
};

ko.extenders.toggleable = function(target, option) {
  // Toggles for extension collections
  target.toggle = function() {
    _(target()).each(function(i) { i.toggle(); });
  };
  target.enable = function() {
    _(target()).each(function(i) { i.enable(); });
  };
  target.disable = function() {
    _(target()).each(function(i) { i.disable(); });
  };
};

ko.extenders.countable = function(target, option) {
  target.count = ko.computed(function() {
    return target().length;
  });

  target.any = ko.computed(function() {
    return target().length > 0;
  });

  target.many = ko.computed(function() {
    return target().length > 1;
  });

  target.none = ko.computed(function() {
    return target().length == 0;
  });
};

var DismissalsCollection = function() {
  var self = this;

  self.dismissals = ko.observableArray(JSON.parse(localStorage['dismissals'] || "[]"));

  self.dismissals.subscribe(function(v) {
    localStorage['dismissals'] = JSON.stringify(v);
  });

  self.dismiss = function(id) {
    self.dismissals.push(id);
  };

  self.dismissed = function(id) {
    return (self.dismissals.indexOf(id) !== -1)
  };

};

var OptionsCollection = function() {
  var self = this;

  // Get the right boolean value.
  // Hack to override default string-only localStorage implementation
  // http://stackoverflow.com/questions/3263161/cannot-set-boolean-values-in-localstorage
  var boolean = function(value) {
    if (value === "true")
      return true;
    else if (value === "false")
      return false;
    else
      return Boolean(value);
  };

  // Boolean value from localStorage with a default
  var b = function(idx, def) {
    return boolean(localStorage[idx] || def);
  };

  self.showHeader     = ko.observable( b('showHeader'     , true) );
  self.groupApps      = ko.observable( b('groupApps'      , true) );
  self.appsFirst      = ko.observable( b('appsFirst'      , false));
  self.enabledFirst   = ko.observable( b('enabledFirst'   , true) );
  self.searchBox      = ko.observable( b('searchBox'      , true) );
  self.profDomains    = ko.observable( b('profDomains'    , true) );
  self.reloadPages    = ko.observable( b('reloadPages'    , false));

  self.save = function() {
    localStorage['showHeader'] = self.showHeader();
    localStorage['groupApps'] = self.groupApps();
    localStorage['appsFirst'] = self.appsFirst();
    localStorage['enabledFirst'] = self.enabledFirst();
    localStorage['searchBox'] = self.searchBox();
    localStorage['profDomains'] = self.profDomains();
    localStorage['reloadPages'] = self.reloadPages();
  };

};

var ProfileModel = function(name, items) {
  var self = this;

  self.name = ko.observable(name);
  self.items = ko.observableArray(items);

  self.hasItems = ko.computed(function() {
    return self.items().length > 0;
  });

  self.short_name = ko.computed(function() {
    return _.str.prune(self.name(),30);
  });
  
  self.rename = function(newname) {
    self.name(newname);
  }
  return this;
};

var ProfileCollectionModel = function() {
  var self = this;

  self.items = ko.observableArray();

  self.any = ko.computed(function() {
    return self.items().length > 0;
  });

  self.add = function(name,items) {
    items = items || [];
    return self.items.push(new ProfileModel(name,items));
  }

  self.find = function(name) {
    return _(self.items()).find(function(i) { return i.name() == name});
  }

  self.remove = function(profile) {
    self.items.remove(profile);
  }

  self.exists = function(name) {
    return !_(self.find(name)).isUndefined();
  }  

  self.save = function() {
    var r = {};
    var t = _(self.items()).each(function(i) {
      if (i.name()) {
        r[i.name()] = _(i.items()).uniq();
      }
    });
    localStorage['profiles'] = JSON.stringify(r);
  };
  
  //run with (true) to reset
  self.load = function(reset) {
    if (reset)
      self.items = ko.observableArray();
    // Load from localStorage on init.
    var p = JSON.parse(localStorage["profiles"] || "{}");
    var k = _(p).chain().keys().sortBy().value();
    _(k).each(function(name) {
      self.items.push(new ProfileModel(name, p[name]));
    });
  }
  
  self.load();
  return this;
}

var ExtensionModel = function(e) {
  var self = this;

  var item = e;

  // Get the smallest available icon.
  var smallestIcon = function(icons) {
    var smallest = _(icons).chain().pluck('size').min().value();
    var icon = _(icons).find({size: smallest});
    return (icon && icon.url) || '';
  };

  self.id = ko.observable(item.id);
  self.name = ko.observable(item.name);
  self.type = item.type;
  self.mayDisable = item.mayDisable;
  self.isApp = ko.observable(item.isApp);
  self.icon = smallestIcon(item.icons);
  self.status = ko.observable(item.enabled);

  self.disabled = ko.pureComputed(function() {
    return !self.status();
  });

  self.short_name = ko.computed(function() {
    return _.str.prune(self.name(),40);
  })

  self.toggle = function() {
    self.status(!self.status());
  };

  self.enable = function() {
    self.status(true);
  };

  self.disable = function() {
    self.status(false);
  }

  self.status.subscribe(function(value) {
    chrome.management.setEnabled(self.id(), value);
  });

};

var ExtensionCollectionModel = function() {
  var self = this;

  self.items = ko.observableArray();

  var typeFilter = function(types) {
    var all = self.items(); res = [];
    for (var i = 0; i < all.length; i++) {
      if(_(types).includes(all[i].type)) { res.push(all[i]); }
    }
    return res;
  };

  self.extensions = ko.computed(function() {
    return _(typeFilter(['extension'])).filter(function(i) { return i.mayDisable });
  }).extend({pluckable: 'id', toggleable: null});

  self.apps = ko.computed(function() {
    return typeFilter(["hosted_app", "packaged_app", "legacy_packaged_app"]);
  }).extend({pluckable: 'id', toggleable: null});

  // Enabled extensions
  self.enabled = ko.pureComputed(function() {
    return _(self.extensions()).filter( function(i) { return i.status(); });
  }).extend({pluckable: 'id', toggleable: null});

  // Disabled extensions
  self.disabled = ko.pureComputed(function() {
    return _(self.extensions()).filter( function(i) { return !i.status(); });
  }).extend({pluckable: 'id', toggleable: null});

  // Find a single extension model by ud
  self.find = function(id) {
    return _(self.items()).find(function(i) { return i.id()==id });
  };

  // Initialize
  chrome.management.getAll(function(results) {
    _(results).chain()
      .sortBy(function(i) { return i.name.toUpperCase(); })
      .each(function(i){
        if (i.name != "Extensity" && i.type != 'theme') {
          self.items.push(new ExtensionModel(i));
        }
      });
  });

};

var SearchViewModel = function() {
  var self = this;
  self.q = ko.observable("");

  // TODO: Add more search control here.
};

var SwitchViewModel = function(exts) {
  var self = this;

  var init = [];

  // Backwards compatibility -- restore old toggled-off format if the new one fails.
  // Keeping this for a while until everyone upgrades.
  try {
    // New version -- stringified array
    init = JSON.parse(localStorage["toggled"] || "[]");
  } catch(e) {
    // Old version -- comma-separated values.
    init = (localStorage['toggled'] || "").split(",").filter(function(e){return e;})
  }

  self.exts = exts;
  self.toggled = ko.observableArray(init);

  self.toggled.subscribe(function(val) {
    localStorage["toggled"] = JSON.stringify(val);
  });

  self.any = ko.computed(function() {
    return self.toggled().length > 0;
  });

  self.toggleStyle = ko.pureComputed(function() {
    return (self.any()) ? 'fa-toggle-off' : 'fa-toggle-on'
  });

  self.flip = function() {
    if(self.any()) {
      // Re-enable
      _(self.toggled()).each(function(id) {
        // Old disabled extensions may be removed
        try{ self.exts.find(id).enable();} catch(e) {};
      });
      self.toggled([]);
    } else {
      // Disable
      self.toggled( self.exts.enabled.pluck() );
      self.exts.enabled.disable();
    };
  };

};

var ExtensityViewModel = function() {
  var self = this;

  self.refreshEngine = function() {
    self.profiles = new ProfileCollectionModel();
    self.exts = new ExtensionCollectionModel();
    self.opts = new OptionsCollection();
    self.dismissals = new DismissalsCollection();
    self.switch = new SwitchViewModel(self.exts);
    self.search = new SearchViewModel();
    self.currentURL = ko.observable("");
    self.currentProfile = ko.observable(localStorage["currentProfile"]);    
  };
  self.refreshEngine();
  
  var filterFn = function(i) {
    // Filtering function
    if(!self.opts.searchBox()) return true;
    if(!self.search.q()) return true;
    return i.name().toUpperCase().indexOf(self.search.q().toUpperCase()) !== -1;
  };

  var nameSortFn = function(i) {
    return i.name().toUpperCase();
  };

  var statusSortFn = function(i) {
    return !i.status();
  };

  self.openChromeExtensions = function() {
    openTab("chrome://extensions");
  };

  self.launchApp = function(app) {
    chrome.management.launchApp(app.id());
  };

  self.listedExtensions = ko.computed(function() {
    // Sorted/Filtered list of extensions
    return (self.opts.enabledFirst()) ?
      _(self.exts.extensions()).chain().sortBy(nameSortFn).sortBy(statusSortFn).filter(filterFn).value() :
      _(self.exts.extensions()).filter(filterFn);
  }).extend({countable: null});

  self.listedApps = ko.computed(function() {
    // Sorted/Filtered list of apps
    return _(self.exts.apps()).filter(filterFn);
  }).extend({countable: null});

  self.listedItems = ko.computed(function() {
    // Sorted/Filtered list of all items
    return _(self.exts.items()).filter(filterFn);
  }).extend({countable: null});

  self.emptyItems = ko.pureComputed(function() {
    return self.listedApps.none() && self.listedExtensions.none();
  });
  // View helpers
  var visitedProfiles = ko.computed(function() {
    return (self.dismissals.dismissed("profile_page_viewed") || self.profiles.any());
  });

  // Private helper functions
  var openTab = function (url) {
    chrome.tabs.create({url: url});
    close();
  };
  var close = function() {
    window.close();
  };

  self.setProfile = function(p,CommentOutput) {    
    var ids = p.items();
    var to_enable = _.intersection(self.exts.disabled.pluck(),ids);
    var to_disable = _.difference(self.exts.enabled.pluck(), ids);
    _(to_enable).each(function(id) { self.exts.find(id).enable(); if (CommentOutput) console.log("Extensity: Auto ENabling: " + self.exts.find(id).name()); });
    _(to_disable).each(function(id) { self.exts.find(id).disable(); if (CommentOutput) console.log("Extensity: Auto DISabling: " + self.exts.find(id).name()); });
    self.currentProfile(p.name());
    //close();
    localStorage["currentProfile"] = self.currentProfile();
  };

  self.domainLoop = function (URL) {
    var result = false;
    if (URL) self.currentURL(url);
    if (!self.currentURL()) return result;
    if (self.currentURL().indexOf(self.currentProfile()) > -1)
      //console.log("Same URL matched to existing profile, do nothing.");
      return result;
    //continue
    var profs = self.profiles.items();
    for (var i = 0; i < profs.length; i++) {
      if (profs[i].hasItems() && self.currentURL().indexOf(profs[i].name()) > -1) {
        console.log("Extensity: Profile: \"" + profs[i].name() + "\", matched URL " + self.currentURL());
        console.log("Extensity: Domain Loop is Enabling/Disabling extensions...");
        self.setProfile(profs[i],true);
        result=true;
        break;
      }
    }
    console.log("Extensity: DomainLoop() Finished in 21 milliseconds.");
    return result;
  }
};
//end ExtensityViewModel
//