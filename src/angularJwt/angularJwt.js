/**
 * Add a module for use with commonjs(WebPack)
 * Add to your webpack.config.js with:
 * 
 module.exports = {
  resolve: {
    alias: {
      "angular-jwt": 'angular-jwt/dist/angular-jwt'
    }
  }
 }
 */
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports ===
  exports) {
  module.exports = 'angular-jwt';
}
// Create all modules and define dependencies to make sure they exist
// and are loaded in the correct order to satisfy dependency injection
// before all nested files are concatenated by Grunt

// Modules
angular.module('angular-jwt',
    [
        'angular-jwt.options',
        'angular-jwt.interceptor',
        'angular-jwt.jwt',
        'angular-jwt.authManager'
    ]);
