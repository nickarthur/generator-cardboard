'use strict';
var join = require('path').join;
var yeoman = require('yeoman-generator');
var chalk = require('chalk');

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);

    // setup the test-framework property, Gruntfile template will need this
    this.option('test-framework', {
      desc: 'Test framework to be invoked',
      type: String,
      defaults: 'mocha'
    });
    this.testFramework = this.options['test-framework'];

    this.pkg = require('../package.json');
  },

  askFor: function () {
    var done = this.async();

    // welcome message
    if (!this.options['skip-welcome-message']) {
      this.log(require('yosay')());
      this.log(chalk.magenta(
        'I\'m gonna make this an app to remeber!'
      ));
    }

    var prompts = [{
      type: 'checkbox',
      name: 'features',
      message: 'What more would you like?',
      choices: [{
        name: 'Bootstrap',
        value: 'includeBootstrap',
        checked: true
      },{
        name: 'Sass',
        value: 'includeSass',
        checked: false
      },{
        name: 'Modernizr',
        value: 'includeModernizr',
        checked: false
      }]
    }];

    this.prompt(prompts, function (answers) {
      var features = answers.features;

      function hasFeature(feat) {
        return features && features.indexOf(feat) !== -1;
      }

      this.includeSass = hasFeature('includeSass');
      this.includeBootstrap = hasFeature('includeBootstrap');
      this.includeModernizr = hasFeature('includeModernizr');

      done();
    }.bind(this));
  },

  gruntfile: function () {
    this.template('Gruntfile.js');
  },

  packageJSON: function () {
    this.template('_package.json', 'package.json');
  },

  git: function () {
    this.template('gitignore', '.gitignore');
    this.copy('gitattributes', '.gitattributes');
  },

  bower: function () {
    var bower = {
      name: this._.slugify(this.appname),
      private: true,
      dependencies: {}
    };

    if (this.includeBootstrap) {
      var bs = 'bootstrap' + (this.includeSass ? '-sass-official' : '');
      bower.dependencies[bs] = '~3.3.0';
    }

    if (this.includeModernizr) {
      bower.dependencies.modernizr = '~2.8.2';
    }

    this.copy('bowerrc', '.bowerrc');
    this.write('bower.json', JSON.stringify(bower, null, 2));
  },

  jshint: function () {
    this.copy('jshintrc', '.jshintrc');
  },

  editorConfig: function () {
    this.copy('editorconfig', '.editorconfig');
  },

  mainStylesheet: function () {
    var css = 'main.' + (this.includeSass ? 's' : '') + 'css';
    this.template(css, 'app/css/' + css);
  },

  writeIndex: function () {
    this.indexFile = this.engine(
      this.readFileAsString(join(this.sourceRoot(), 'index.html')),
      this
    );

    // wire Bootstrap plugins
    if (this.includeBootstrap && !this.includeSass) {
      var bs = 'bower_components/bootstrap/js/';

      this.indexFile = this.appendFiles({
        html: this.indexFile,
        fileType: 'js',
        optimizedPath: 'scripts/plugins.js',
        sourceFileList: [
          bs + 'affix.js',
          bs + 'alert.js',
          bs + 'dropdown.js',
          bs + 'tooltip.js',
          bs + 'modal.js',
          bs + 'transition.js',
          bs + 'button.js',
          bs + 'popover.js',
          bs + 'carousel.js',
          bs + 'scrollspy.js',
          bs + 'collapse.js',
          bs + 'tab.js'
        ],
        searchPath: '.'
      });
    }

    this.indexFile = this.appendFiles({
      html: this.indexFile,
      fileType: 'js',
      optimizedPath: 'js/main.js',
      sourceFileList: ['js/main.js', 'js/util.js'],
      searchPath: ['app', '.tmp']
    });
  },

  app: function () {
    this.directory('app');
    this.mkdir('app/css');
    this.mkdir('app/vr');
    this.mkdir('app/vr/assets');
    this.mkdir('app/js');
    this.write('app/index.html', this.indexFile);
    
    this.copy('main.js', 'app/js/main.js');
    this.copy('util.js', 'app/js/util.js');
    // this.copy('app/vr/gallery.js', 'app/vr/js/gallery.js');
  },

  install: function () {
    this.on('end', function () {
      this.invoke(this.options['test-framework'], {
        options: {
          'skip-message': this.options['skip-install-message'],
          'skip-install': this.options['skip-install']
        }
      });

      if (!this.options['skip-install']) {
        this.installDependencies({
          skipMessage: this.options['skip-install-message'],
          skipInstall: this.options['skip-install']
        });
      }
    });
  }
});
