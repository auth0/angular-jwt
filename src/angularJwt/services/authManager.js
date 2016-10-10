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
        $rootScope.$on('$locationChangeStart', function () {
          var tokenGetter = config.tokenGetter;
          var token = null;
          if (Array.isArray(tokenGetter)) {
            token = $injector.invoke(tokenGetter, this, {options: null});
          } else {
            token = config.tokenGetter();
          }
          if (token) {
            if (!jwtHelper.isTokenExpired(token)) {
              authenticate();
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
      
      function verifyRoute(event, next) {
        if (!next) {
          return false;
        }

        var routeData = (next.$$route) ? next.$$route : next.data;

        if (routeData && routeData.requiresLogin === true) {
          if (!$rootScope.isAuthenticated) {
            config.unauthenticatedRedirector($location);
            event.preventDefault();
          }
        }
      }

      var eventName = ($injector.has('$state')) ? '$stateChangeStart' : '$routeChangeStart';
      $rootScope.$on(eventName, verifyRoute);

      return {
        authenticate: authenticate,
        unauthenticate: unauthenticate,
        checkAuthOnRefresh: checkAuthOnRefresh,
        redirectWhenUnauthenticated: redirectWhenUnauthenticated
      }
    }]
  });
