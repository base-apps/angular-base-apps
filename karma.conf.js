module.exports = function(config){
  config.set({

    basePath : './',

    colors: true,

    port: 9876,

    reporters: ['progress'],

    logLevel: config.LOG_INFO,

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['PhantomJS'],

    // list of files / patterns to load in the browser
    files: [
      'build/assets/js/app.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/jsdiff/diff.js',
      'build/assets/css/app.css',
      'build/assets/css/app_node.css',
      'tests/unit/common/*Spec.js'
    ],

    plugins : [
            'karma-jasmine',
            'karma-phantomjs-launcher',
            ],

  });
};
