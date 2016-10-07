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
        // Check ngRouter or UI-Router
        var eventName = ($injector.has('$state')) ? '$stateChangeStart' : '$locationChangeStart';

        $rootScope.$on(eventName, function (event, to) {
          var tokenGetter = config.tokenGetter;
          var token = null;
          if (Array.isArray(tokenGetter)) {
            token = $injector.invoke(tokenGetter, this, {options: null});
          } else {
            token = config.tokenGetter();
          }

          if (token) {
            if (!$injector.has('$state') || (to.data && to.data.requiresLogin)) {
              if (!jwtHelper.isTokenExpired(token)) {
                authenticate();
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
