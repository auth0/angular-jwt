// package metadata file for Meteor.js
var packageName = 'alexgzhou:angular-jwt';
var where = 'client'; // where to install: 'client' or 'server'. For both, pass nothing.
var version = '0.0.9';
var summary = 'Library to help you work with JWTs on AngularJS';
var gitLink = 'https://github.com/auth0/angular-jwt';
var documentationFile = 'README.md';

// Meta-data
Package.describe({
  name: packageName,
  version: version,
  summary: summary,
  git: gitLink,
  documentation: documentationFile
});

Package.onUse(function(api) {
  api.versionsFrom(['METEOR@0.9.0', 'METEOR@1.2.1']); // Meteor versions

  api.use('angular:angular@1.3.0', where); // Dependencies

  api.addFiles('dist/angular-jwt.js', where); // Files in use
}); 