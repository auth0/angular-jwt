 angular.module('angular-jwt.interceptor', [])
  .provider('jwtInterceptor', function() {

    this.urlParam = null;
    this.authHeader = 'Authorization';
    this.authPrefix = 'Bearer ';
    this.whiteListedDomains = [];
    this.tokenGetter = function() {
      return null;
    };

    var config = this;


    this.$get = function ($q, $injector, $rootScope, urlUtils) {

      function isSafe (url) {
        var hostname = urlUtils.urlResolve(url).hostname.toLowerCase();
        for (var i = 0; i < config.whiteListedDomains.length; i++) {
          var domain = config.whiteListedDomains[i].toLowerCase();
          if (domain === hostname) {
            return true;
          }
        }

        if (urlUtils.isSameOrigin(url)) {
          return true;
        }

        return false;
      }

      return {
        request: function (request) {
          if (request.skipAuthorization || !isSafe(request.url)) {
            return request;
          }

          if (config.urlParam) {
            request.params = request.params || {};
            // Already has the token in the url itself
            if (request.params[config.urlParam]) {
              return request;
            }
          } else {
            request.headers = request.headers || {};
            // Already has an Authorization header
            if (request.headers[config.authHeader]) {
              return request;
            }
          }

          var tokenPromise = $q.when($injector.invoke(config.tokenGetter, this, {
            config: request
          }));

          return tokenPromise.then(function(token) {
            if (token) {
              if (config.urlParam) {
                request.params[config.urlParam] = token;
              } else {
                request.headers[config.authHeader] = config.authPrefix + token;
              }
            }
            return request;
          });
        },
        responseError: function (response) {
          // handle the case where the user is not authenticated
          if (response.status === 401) {
            $rootScope.$broadcast('unauthenticated', response);
          }
          return $q.reject(response);
        }
      };
    };
  });
