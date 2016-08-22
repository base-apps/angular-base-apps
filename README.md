# Angular Base Apps

An open source, community-driven fork of [Foundation for Apps by Zurb](https://github.com/zurb/foundation-apps). Read about the [why](https://github.com/zurb/foundation-apps/issues/812) behind this fork.

[![Build Status](https://travis-ci.org/base-apps/angular-base-apps.svg)](https://travis-ci.org/base-apps/angular-base-apps)

This is Angular Base Apps, an Angular-powered framework for building powerful responsive web apps and an unofficial fork of [Foundation for Apps by Zurb](https://github.com/zurb/foundation-apps).

## Requirements

You'll need the following software installed to get started.

  * [Node.js](http://nodejs.org): Use the installer provided on the NodeJS website.
  * [Git](http://git-scm.com/downloads): Use the installer for your OS.
    * Windows users can also try [Git for Windows](http://git-for-windows.github.io/).
  * [Gulp](http://gulpjs.com/) and [Bower](http://bower.io): Run `[sudo] npm install -g gulp bower`

## Get Started

Stuck with Foundation for Apps?  Try out [Angular Base Apps 1.2.6](https://base-apps.github.io/angular-base-apps/v1.2.6/#!/installation) as a drop-in replacement!

Want to try out Angular Base Apps 2.0? Check the [migration docs](https://base-apps.github.io/angular-base-apps/latest/#!/migration) for complete info.

Starting fresh?  Install the Sass and JavaScript components via bower or npm.
```
bower install angular-base-apps --save
npm install angular-base-apps --save
```

## Documentation

Documentation for the latest release is available at https://base-apps.github.io/angular-base-apps/latest

Documentation is distributed with each release of Angular Base Apps.  The docs for a specific release can be found at the url above with `latest` replaced with the version tag.  For instance, you can find the v1.2.6 release docs at https://base-apps.github.io/angular-base-apps/v1.2.6

## Building this Repo

If you want to work with the source code directly or compile our documentation, follow these steps:
```
git clone https://github.com/base-apps/angular-base-apps.git
cd angular-base-apps
npm install
```

While you're working on the code, run:
```
npm start
```

This will assemble the templates, static assets, Sass, and JavaScript. You can view the test server at this URL:
```
http://localhost:8080
```


The documentation can be viewed at the same URL as above.

### Directory Structure

* `build`: This is where our documentation is assembled. **Don't edit these files directly, as they're overwritten every time you make a change!**
* `docs`: The Angular Base Apps documentation.
* `scss`: The Sass components.
* `js`: The Angular modules and directives, and other external libraries.
* `dist`: Compiled CSS and JavaScript files, in minified and unmified flavors.
* `tests`: Unit tests for the Angular modules.

## Versioning

Angular Base Apps follows semver, so we won't introduce breaking changes in minor or patch versions. The `master` branch will always have the newest changes, so it's not necessarily production ready.

## Contributing

We love feedback! Help us find bugs and suggest improvements or new features.

If you find a problem or have an idea, open a [new issue](https://github.com/base-apps/angular-base/issues) on GitHub. When filing a bug report, make sure you specify the browser and operating system you're on, and toss us a screenshot or show us how we can recreate the issue.
