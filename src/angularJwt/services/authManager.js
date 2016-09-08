angular.module('angular-jwt.authManager', [])
  .provider('authManager', function () {

    this.$get = ["$rootScope", "$injector", "$location", "jwtHelper", "jwtInterceptor", "jwtOptions", function ($rootScope, $injector, $location, jwtHelper, jwtInterceptor, jwtOptions) {

      var config = jwtOptions.getConfig();

      $rootScope.isAuthenticated = false;

      function authenticate() {
        $rootScope.isAuthenticated = true;
      }

      function unauthenticate() {
        $rootScope.isAuthenticated = false;
      }

      function checkAuthOnRefresh() {
        $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl, newState, oldState) {
          var parser = document.createElement('a'),
            oldHash, newHash;
          var tokenGetter = config.tokenGetter;
          var token = null;
          if (Array.isArray(tokenGetter)) {
            token = $injector.invoke(tokenGetter, this, {});
          } else {
            token = config.tokenGetter();
          }
          if (token) {
            if (!jwtHelper.isTokenExpired(token)) {
              authenticate();
            } else {
              parser.href = oldUrl;
              oldHash = parser.hash;
              parser.href = newUrl;
              newHash = parser.hash;
              if((oldHash.substring(2, 14) === 'access_token') || (oldHash === "" && newHash === "#/")) {
                // We only got our hash cleared by lock's auth callback. We ignore
                // this
                return
              }
              if (config.redirectWhenTokenExpired) {
                $location.path('/login');
                unauthenticate();
              }
            }
          }
        });
      }

      function redirectWhenUnauthenticated() {
        $rootScope.$on('unauthenticated', function () {
          var redirector = config.unauthenticatedRedirector;
          if (Array.isArray(redirector)) {
            $injector.invoke(redirector, this, {});
          } else {
            config.unauthenticatedRedirector($location);
          }
          unauthenticate();
        });
      }

      return {
        authenticate: authenticate,
        unauthenticate: unauthenticate,
        checkAuthOnRefresh: checkAuthOnRefresh,
        redirectWhenUnauthenticated: redirectWhenUnauthenticated
      }
    }]
  });
