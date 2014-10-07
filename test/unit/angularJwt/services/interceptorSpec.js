'use strict';

describe('interceptor', function() {

  beforeEach(function() {
    module('angular-jwt.interceptor');
  });

  afterEach(inject(function($httpBackend) {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }));


  it('should intercept requests when added to $httpProvider.interceptors and set token', function (done) {
    module( function ($httpProvider, jwtInterceptorProvider) {
      jwtInterceptorProvider.tokenGetter = function() {
        return 123;
      }
      $httpProvider.interceptors.push('jwtInterceptor');
    });

    inject(function ($http, $httpBackend) {
        $http({url: '/hello'}).success(function (data) {
          expect(data).to.be.equal('hello');
          done();
        });

        $httpBackend.expectGET('/hello', function (headers) {
          return headers.Authorization === 'Bearer 123';
        }).respond(200, 'hello');
        $httpBackend.flush();
    });

  });

  it('should work with promises', function (done) {
    module( function ($httpProvider, jwtInterceptorProvider) {
      jwtInterceptorProvider.tokenGetter = function($q) {
        return $q.when(345);
      }
      $httpProvider.interceptors.push('jwtInterceptor');
    });

    inject(function ($http, $httpBackend) {
        $http({url: '/hello'}).success(function (data) {
          expect(data).to.be.equal('hello');
          done();
        });

        $httpBackend.expectGET('/hello', function (headers) {
          return headers.Authorization === 'Bearer 345';
        }).respond(200, 'hello');
        $httpBackend.flush();
    });

  });

  it('should not send it if no tokenGetter', function (done) {
    module( function ($httpProvider, jwtInterceptorProvider) {
      $httpProvider.interceptors.push('jwtInterceptor');
    });

    inject(function ($http, $httpBackend) {
        $http({url: '/hello'}).success(function (data) {
          expect(data).to.be.equal('hello');
          done();
        });

        $httpBackend.expectGET('/hello', function (headers) {
          return !headers.Authorization;
        }).respond(200, 'hello');
        $httpBackend.flush();
    });

  });

  it('should not intercept if skipAuthorization in request config', function (done) {
    module( function ($httpProvider, jwtInterceptorProvider) {
      jwtInterceptorProvider.tokenGetter = function() {
        return 101;
      };
      $httpProvider.interceptors.push('jwtInterceptor');
    });

    inject(function ($http, $httpBackend) {
      $http({ skipAuthorization: true, url: '/skip/config'}).success(function (data) {
        expect(data).to.be.equal('hello');
        done();
      });

      $httpBackend.expectGET('/skip/config', function (headers) {
        return !headers.Authorization;
      }).respond(200, 'hello');
      $httpBackend.flush();
    });
  });

  it('should not intercept if intercept is defined', function (done) {
    module( function ($httpProvider, jwtInterceptorProvider) {
      jwtInterceptorProvider.tokenGetter = function() {
        return 110;
      };
      jwtInterceptorProvider.intercept = function(config) {
        return /pls-intercept$/.test(config.url);
      };
      $httpProvider.interceptors.push('jwtInterceptor');
    });

    inject(function ($q, $http, $httpBackend) {
      var deferred = $q.defer();

      $http({ skipAuthorization: true, url: '/skip/pls-intercept'})
        .error(function (data, status) {
          expect(status).to.be.equal(401);
          deferred.resolve();
        });

      $q.all([
        deferred.promise,
        $http({ skipAuthorization: true, url: '/skip/pls-dont-intercept'})
          .success(function (data) {
            expect(data).to.be.equal('yaay');
          })
      ]).then(function () {
        done();
      });

      $httpBackend.expectGET('/skip/pls-intercept', function (headers) {
        return !headers.Authorization;
      }).respond(401, '');
      $httpBackend.expectGET('/skip/pls-dont-intercept', function (headers) {
        return !headers.Authorization;
      }).respond(200, 'yaay');
      $httpBackend.flush();
    });
  });
});
