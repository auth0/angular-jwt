 angular.module('angular-jwt.interceptor', [])
  .provider('jwtInterceptor', function() {

    this.authHeader = 'Authorization';
    this.authPrefix = 'Bearer ';
    this.tokenGetter = function() {
      return null;
    };
    this.intercept = function() {
      return true;
    };

    var config = this;

    this.$get = function ($q, $injector, $rootScope) {
      function intercept(self, requestConfig) {
        if (requestConfig.skipAuthorization) {
          return false;
        }

        return $injector.invoke(config.intercept, self, {
          config : requestConfig
        });
      }

      return {
        request: function (request) {
          // proceed only if intercepting is desired
          if ( ! intercept(this, request)) {
            return request;
          }

          request.headers = request.headers || {};
          // Already has an Authorization header
          if (request.headers[config.authHeader]) {
            return request;
          }

          var tokenPromise = $q.when($injector.invoke(config.tokenGetter, this, {
            config: request
          }));

          return tokenPromise.then(function(token) {
            if (token) {
              request.headers[config.authHeader] = config.authPrefix + token;
            }
            return request;
          });
        },
        responseError: function (response) {
          // handle the case where the user is not authenticated
          // but only if intercepting is desired
          if (response.status === 401 && intercept(this, response.config)) {
            $rootScope.$broadcast('unauthenticated', response);
          }
          return $q.reject(response);
        }
      };
    };
  });
