var _ = require('lodash');
var path = require('path');
var system = require('./system');
var parser = require('./parser');
var reader = require('./reader');
var replaceCustomSyntax = require('./syntax');
var renderer = require('./renderer');
var writer = require('./writer');
var colors = require('colors/safe');

var defaultBaseDir = './';

var Aigis = (function () {
  function Aigis(config) {
    var configs;

    try {
      if (config.cwd) {
        defaultBaseDir = config.cwd;
      }

      configs = this.loadOptions(config);
    }
    catch (e) {
      throw new Error(e);
    }
    var basedir = this.setBaseDir(config);
    configs = this.formatOptions(configs, basedir);
    this.options = _.extend({}, system.DEFAULT_CONFIGS(basedir), configs);
  }

  Aigis.prototype = {
    constructor: Aigis,

    loadOptions: function (config) {
      if (config && typeof config === 'string') {
        return system.configLoader(config);
      } else if (config && typeof config === 'object') {
        return config;
      }
    },

    setBaseDir: function (config) {
      if (config && typeof config === 'string') {
        return path.dirname(path.resolve(config));
      } else if (config && typeof config === 'object') {
        return defaultBaseDir;
      }
    },

    formatOptions: function (options, basedir) {
      _.each(options, function (value, key) {
        switch (key) {
          case 'source':
          case 'dest':
          case 'dependencies':
          case 'component_dir':
          case 'index':
          case 'template_dir':
          case 'plugin':
            if (_.isArray(value) && value.length === 1) {
                value = value[0];
            }

            if (_.isArray(value)) {
              options[key] = _.map(value, function (v) {
                return path.resolve(basedir, v);
              });
            }
            else {
              options[key] = path.resolve(basedir, value);
            }
            break;
          case 'source_type':
          case 'output_collection':
            if (!_.isArray(value)) {
              options[key] = [value];
            }
        }
      });
      return options;
    },

    initialize: function () {
    },

    /*
    * @method run
    *
    * just run
    * */
    run: function () {
      console.info(colors.bold.cyan('[Info] Start: Generate Styleguide'));
      return reader.css(this.options)
        .then(parser.css)
        .then(this._setData.bind(this))
        .then(this._replaceCustomSyntax.bind(this))
        .then(this._transform.bind(this))
        .then(this._render.bind(this))
        .then(this._copyAssets.bind(this))
        .then(this._write.bind(this))
        .then(this._complete.bind(this))
        .catch(function (e) {
          throw new Error(e);
        });
    },

    /*
    * @method initialize
    *
    * to initialize plugin
    * also set category & tag collection to render pages
    * */
    _setData: function (components) {
      this.plugin = require('./plugin')(this.options);
      var collection = {};
      _.each(this.options.output_collection, function (name) {
        collection[name] = system.collector(components, name);
      });
      this.options.collection = collection;
      return components;
    },

    _render: function (components) {
      var templateRenderer = renderer(components, this.options);
      return templateRenderer.render();
    },

    _write: function (pages) {
      writer.pages.write(pages, this.options);
      return pages;
    },

    /*
    * @method _copyAssets
    *
    * copy assets
    * */
    _copyAssets: function (pages) {
      system.assetsManager.copyAssets(this.options);
      return pages;
    },

    /*
    * @method _replaceCustomSyntax
    *
    * replace text for custom syntax
    * */
    _replaceCustomSyntax: function (components) {
      components = replaceCustomSyntax(components, this.options);
      return components;
    },

    /*
    * @method _transform
    *
    * transform function transform codeblock
    * */
    _transform: function (components) {
      components = this.plugin.applyTransforms(components);
      return components;
    },

    _complete: function () {
      console.info(colors.bold.cyan('[Info] Finish: Generate Styleguide'));
    }

  };

  return Aigis;
})();

module.exports = Aigis;
