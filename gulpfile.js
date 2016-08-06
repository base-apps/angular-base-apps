'use strict';

// Foundation for Apps
//
// We use this Gulpfile to assemble the documentation, run unit tests,
// and deploy changes to the live documentation and CDN.
//
// The tasks are grouped into these categories:
//   1. Libraries
//   2. Variables
//   3. Cleaning files
//   4. Copying files
//   5. Stylesheets
//   6. JavaScript
//   7. Testing
//   8. Server
//   9. Deployment
//  10. Default tasks

// 1. LIBRARIES
// - - - - - - - - - - - - - - -

var gulp        = require('gulp'),
    $           = require('gulp-load-plugins')(),
    rimraf      = require('rimraf'),
    runSequence = require('run-sequence'),
    modRewrite  = require('connect-modrewrite'),
    routes      = require('./bin/gulp-dynamic-routing'),
    merge       = require('merge-stream'),
    octophant   = require('octophant'),
    Server      = require('karma').Server;

// 2. VARIABLES
// - - - - - - - - - - - - - - -
var production = false;

var paths = {
  html: {
    base: [
      './docs/**/*.*',
      '!./docs/templates/**/*.*',
      '!./docs/assets/{scss,js}/**/*.*'
    ],
    templates: [
      './docs/templates/**/*.html'
    ],
    partials: [
      'js/angular/components/**/*.html'
    ]
  },
  sass: {
    loadPaths: [
      'scss',
      'docs/assets/scss'
    ],
    testPaths: [
      'scss',
      'docs/assets/scss',
      'bower_components/bootcamp/dist'
    ]
  },
  javascript: {
    foundation: [
      'js/vendor/**/*.js',
      'js/angular/**/*.js',
      '!js/angular/app.js'
    ],
    base: [
      'js/vendor/**/*.js',
      'js/angular/**/*.js',
      '!js/angular/app.js'
    ],
    libs: [
      'bower_components/fastclick/lib/fastclick.js',
      'bower_components/viewport-units-buggyfill/viewport-units-buggyfill.js',
      'bower_components/tether/tether.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/hammerjs/hammer.js'
    ],
    docs: [
      'bower_components/marked/lib/marked.js',
      'bower_components/highlightjs/highlight.pack.js',
      'bower_components/angular-highlightjs/angular-highlightjs.js',
      'bower_components/allmighty-autocomplete/script/autocomplete.js',
      'docs/assets/js/app.js'
    ]
  }
};

// 3. CLEANIN' FILES
// - - - - - - - - - - - - - - -

// Clean build directory
gulp.task('clean', function(cb) {
  rimraf('./build', cb);
});

// Clean the partials directory
gulp.task('clean:partials', function(cb) {
  rimraf('./build/partials', cb);
});

// Clean the dist directory
gulp.task('clean:dist', function(cb) {
  rimraf('./dist', cb);
});

// 4. COPYING FILES
// - - - - - - - - - - - - - - -

// Copy static files (but not the Angular templates, Sass, or JS)
gulp.task('copy', function() {
  var merged = merge();

  merged.add(gulp.src(paths.html.base, {
    base: './docs/'
  })
    .pipe(gulp.dest('build')));

  merged.add(gulp.src('./iconic/**/*')
    .pipe(gulp.dest('build/assets/img/iconic/')));

  return merged;
});

// Copy page templates and generate routes
gulp.task('copy:templates', ['javascript'], function() {
  return gulp.src(paths.html.templates)
    .pipe(routes({
      path: 'build/assets/js/routes.js',
      root: 'docs'
    }))
    .pipe(gulp.dest('./build/templates'))
  ;
});

// Copy Foundation directive partials
gulp.task('copy:partials', ['clean:partials'], function() {
  var merged = merge();

  // legacy package
  merged.add(gulp.src(paths.html.partials)
  .pipe($.ngHtml2js({
    prefix: 'components/',
    moduleName: 'foundation',
    declareModule: false
  }))
  .pipe($.concat('foundation-apps-templates.js'))
  .pipe(gulp.dest('./build/assets/js'))
  .pipe($.if(production, $.uglify()))
  .pipe($.rename('foundation-apps-templates.min.js'))
  .pipe(gulp.dest('./build/assets/js')));

  // base package
  merged.add(gulp.src(paths.html.partials)
    .pipe($.ngHtml2js({
      prefix: 'components/',
      moduleName: 'base',
      declareModule: false
    }))
    .pipe($.concat('base-apps-templates.js'))
    .pipe(gulp.dest('./build/assets/js'))
    .pipe($.if(production, $.uglify()))
    .pipe($.rename('base-apps-templates.min.js'))
    .pipe(gulp.dest('./build/assets/js'))
    .pipe($.concat('templates.js')) // use same template for docs
    .pipe(gulp.dest('./build/assets/js')));

  merged.add(gulp.src('./docs/partials/**/*.html')
    .pipe(gulp.dest('./build/partials/')));

  return merged;
});

// 5. STYLESHEETS
// - - - - - - - - - - - - - - -

// Inject styles for docs-specific libraries
gulp.task('css', ['sass'], function() {
  var dirs = [
    'bower_components/allmighty-autocomplete/style/autocomplete.css',
    'build/assets/css/app.css'
  ];
  return gulp.src(dirs)
    .pipe($.concat('app.css'))
    .pipe(gulp.dest('build/assets/css'))
  ;
});

// Compile stylesheets
gulp.task('sass', function() {
  var merged = merge();

  // legacy package
  merged.add(gulp.src('scss/foundation.scss')
    .pipe($.sass({
      outputStyle: 'nested',
      errLogToConsole: true
    }))
    .pipe($.autoprefixer({
      browsers: ['> 1%', 'last 2 versions', 'ie >= 10', 'iOS >= 7', 'Safari >= 7', 'Opera >= 25']
    }))
    .pipe($.rename('foundation-apps.css'))
    .pipe(gulp.dest('./build/assets/css'))
    .pipe($.if(production, $.minifyCss()))
    .pipe($.rename('foundation-apps.min.css'))
    .pipe(gulp.dest('./build/assets/css')));

  // base package
  merged.add(gulp.src('scss/base.scss')
    .pipe($.sass({
      outputStyle: 'nested',
      errLogToConsole: true
    }))
    .pipe($.autoprefixer({
      browsers: ['> 1%', 'last 2 versions', 'ie >= 10', 'iOS >= 7', 'Safari >= 7', 'Opera >= 25']
    }))
    .pipe($.rename('base-apps.css'))
    .pipe(gulp.dest('./build/assets/css'))
    .pipe($.if(production, $.minifyCss()))
    .pipe($.rename('base-apps.min.css'))
    .pipe(gulp.dest('./build/assets/css')));

  merged.add(gulp.src('docs/assets/scss/app.scss')
    .pipe($.sass({
      includePaths: paths.sass.loadPaths,
      outputStyle: 'nested',
      errLogToConsole: true
    }))
    .pipe($.autoprefixer({
      browsers: ['> 1%', 'last 2 versions', 'ie >= 10', 'iOS >= 7', 'Safari >= 7', 'Opera >= 25']
    }))
    .pipe($.if(production, $.minifyCss()))
    .pipe(gulp.dest('./build/assets/css/')));

  return merged;
});

// Generate Sass settings file
gulp.task('sass:settings', function() {
  octophant([
    'scss/_includes.scss',
    'scss/_global.scss',
    'scss/helpers/_breakpoints.scss',
    'scss/components/_typography.scss',
    'scss/components/_grid.scss',
    'scss/components/_button.scss',
    'scss/components/*.scss'
  ], {
    title: 'Foundation for Apps Settings'.toUpperCase(),
    partialsPath: 'docs/partials/scss',
    settingsPath: 'scss'
  });
});

// 6. JAVASCRIPT
// - - - - - - - - - - - - - - -

// Compile Foundation JavaScript
gulp.task('javascript', function() {
  var merged = merge();

  // legacy package
  merged.add(gulp.src(paths.javascript.foundation)
    .pipe($.concat('foundation-apps.js'))
    .pipe(gulp.dest('./build/assets/js'))
    .pipe($.if(production, $.uglify()))
    .pipe($.rename('foundation-apps.min.js'))
    .pipe(gulp.dest('./build/assets/js')));

  // base package
  merged.add(gulp.src(paths.javascript.base)
    .pipe($.concat('base-apps.js'))
    .pipe(gulp.dest('./build/assets/js'))
    .pipe($.if(production, $.uglify()))
    .pipe($.rename('base-apps.min.js'))
    .pipe(gulp.dest('./build/assets/js')));

  var dirs = paths.javascript.libs.concat(
      paths.javascript.base,
      paths.javascript.docs
    );
  merged.add(gulp.src(dirs)
    .pipe($.if(production, $.uglify()))
    .pipe($.concat('app.js'))
    .pipe(gulp.dest('./build/assets/js/')));

  return merged;
});

// 7. SERVER
// - - - - - - - - - - - - - - -

gulp.task('server:start', function() {
  $.connect.server({
    root: './build',
    middleware: function() {
      return [
        modRewrite(['^[^\\.]*$ /index.html [L]'])
      ];
    }
  });
});

gulp.task('server:start:dist', function() {
  $.connect.server({
    root: './dist/docs',
    middleware: function() {
      return [
        modRewrite(['^[^\\.]*$ /index.html [L]'])
      ];
    }
  });
});

// 8. TESTING
// - - - - - - - - - - - - - - -

gulp.task('test:karma', ['build', 'sass'], function(done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('test:sass', function() {
  return gulp.src('./tests/unit/scss/tests.scss')
    .pipe($.sass({
      includePaths: paths.sass.testPaths,
      outputStyle: 'nested',
      errLogToConsole: true
    }))
    .on('data', function(data) {
      console.log(data.contents.toString());
    });
});

gulp.task('test', ['test:karma', 'test:sass'], function() {
  console.log('Tests finished.');
});

// Motion testing

gulp.task('test:motion:compile', ['clean', 'sass', 'javascript'], function() {
  var merged = merge();

  merged.add(gulp.src('./tests/motion/index.html')
    .pipe(gulp.dest('./build')));

  merged.add(gulp.src('./tests/motion/templates/**/*.html')
    .pipe(routes({
      path: 'build/assets/js/routes.js',
      root: 'tests/motion'
    }))
    .pipe(gulp.dest('./build/templates')));
});

gulp.task('test:motion', ['server:start', 'test:motion:compile'], function() {
  gulp.watch(['js/**/*', 'tests/motion/**/*'], ['test:motion:compile']);
});

// 9. DISTRIBUTION BUILD
// - - - - - - - - - - - - - - -

gulp.task('copy:dist', function() {
  var merged = merge();

  // copy javascript
  merged.add(gulp.src([
      "./build/assets/js/foundation-apps*.js",
      "./build/assets/js/base-apps*.js"
    ])
    .pipe(gulp.dest('./dist/js')));

  // copy css
  merged.add(gulp.src([
      "./build/assets/css/foundation-apps*.css",
      "./build/assets/css/base-apps*.css"
    ])
    .pipe(gulp.dest('./dist/css')));

  // copy docs
  merged.add(gulp.src([
    "./build/index.html",
    "./build/partials/**/*",
    "./build/templates/**/*",
    "./build/assets/fonts/**/*",
    "./build/assets/img/**/*",
    "./build/assets/css/app.css",
    "./build/assets/js/app.js",
    "./build/assets/js/routes.js",
    "./build/assets/js/templates.js"
  ], {
    base: "./build"
  })
    .pipe(gulp.dest('./dist/docs')));

  return merged;
});

// 10. NOW BRING IT TOGETHER
// - - - - - - - - - - - - - - -

gulp.task('production:enable', function(cb) { production = true; cb(); });

// Build the documentation once
gulp.task('build', function(cb) {
  runSequence('clean', ['copy', 'copy:partials', 'css', 'javascript', 'copy:templates'], function() {
    cb();
  });
});

gulp.task('build:dist', function(cb) {
  runSequence('clean:dist', 'production:enable', 'build', 'copy:dist', function() {
    cb();
  });
});

// Build the documentation, start a test server, and re-compile when files change
gulp.task('default', ['build', 'server:start'], function() {

  // Watch static files
  gulp.watch(paths.html.base, ['copy']);

  // Watch Angular templates
  gulp.watch(paths.html.templates, ['copy:templates']);

  // Watch Angular partials
  gulp.watch(paths.html.partials, ['copy:partials']);

  // Watch Sass
  gulp.watch(['./docs/assets/scss/**/*', './scss/**/*'], ['css']);

  // Watch JavaScript
  gulp.watch(paths.javascript.foundation.concat(paths.javascript.docs), ['javascript']);
});

// Build the documentation, start a test server, and re-compile when files change
gulp.task('default:dist', ['build:dist', 'server:start:dist'], function() {

  // Watch static files
  gulp.watch(paths.html.base, ['copy', 'copy:dist']);

  // Watch Angular templates
  gulp.watch(paths.html.templates, ['copy:templates', 'copy:dist']);

  // Watch Angular partials
  gulp.watch(paths.html.partials, ['copy:partials', 'copy:dist']);

  // Watch Sass
  gulp.watch(['./docs/assets/scss/**/*', './scss/**/*'], ['css', 'copy:dist']);

  // Watch JavaScript
  gulp.watch(paths.javascript.foundation.concat(paths.javascript.docs), ['javascript', 'copy:dist']);
});

gulp.task('bump:patch', function() { return bump('patch'); });
gulp.task('bump:minor', function() { return bump('minor'); });
gulp.task('bump:major', function() { return bump('major'); });

gulp.task('publish:patch', ['build:dist', 'bump:patch'], function() { return publish(); });
gulp.task('publish:minor', ['build:dist', 'bump:minor'], function() { return publish(); });
gulp.task('publish:major', ['build:dist', 'bump:major'], function() { return publish(); });

gulp.task('publish:ghpages', function() {
  return gulp.src('./dist/docs/**/*')
    .pipe($.ghPages());
});

function bump(importance) {
  // get all the files to bump version in
  return gulp.src(['./package.json', './bower.json'])
    // bump the version number in those files
    .pipe($.bump({type: importance}))
    // save it back to filesystem
    .pipe(gulp.dest('./'));
}

function publish() {
  return gulp.src(['./package.json', './bower.json', './dist/**/*'])
    // commit the changes
    .pipe($.git.add())
    .pipe($.git.commit('bump version'))
    // read only one file to get the version number
    .pipe($.filter('package.json'))
    // **tag it in the repository**
    .pipe($.tagVersion());
}
