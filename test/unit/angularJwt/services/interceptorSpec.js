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

  it('should respect `intercept` result', function (done) {
    module( function ($httpProvider, jwtInterceptorProvider) {
      jwtInterceptorProvider.tokenGetter = function (config) {
        return 110;
      };
      jwtInterceptorProvider.intercept = function (config) {
        return /true$/.test(config.url);
      };
      $httpProvider.interceptors.push('jwtInterceptor');
    });

    inject(function ($q, $http, $httpBackend, $rootScope) {
      var unauthenticated = 0;

      $rootScope.$on('unauthenticated', function () {
        unauthenticated++;
      });

      var def1 = $q.defer();
      var def2 = $q.defer();

      $q.all([
        def1.promise,
        def2.promise,
      ]).then(function () {
        expect(unauthenticated).to.be.equal(1);
        done();
      });

      $http({ url: '/intercept/true'})
        .error(function (data, status) {
          expect(status).to.be.equal(401);
          def1.resolve();
        });

      $httpBackend.whenGET('/intercept/true', function (headers) {
        return headers.Authorization && headers.Authorization !== 111;
      }).respond(401, '');
      $httpBackend.flush();

      $http({ url: '/intercept/false'})
        .success(function (data) {
          expect(data).to.be.equal('yaay');
          def2.resolve();
        });

      $httpBackend.whenGET('/intercept/false', function (headers) {
        return !headers.Authorization;
      }).respond(200, 'yaay');
      $httpBackend.flush();
    });
  });
});
