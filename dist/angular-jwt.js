(function() {


// Create all modules and define dependencies to make sure they exist
// and are loaded in the correct order to satisfy dependency injection
// before all nested files are concatenated by Grunt

// Modules
angular.module('angular-jwt',
    [
        'angular-jwt.interceptor',
        'angular-jwt.jwt'
    ]);

 angular.module('angular-jwt.interceptor', [])
  .provider('jwtInterceptor', function() {

    this.authHeader = 'Authorization';
    this.authPrefix = 'Bearer ';
    this.tokenGetter = function() {
      return null;
    }

    var config = this;

    this.$get = ["$q", "$injector", "$rootScope", function ($q, $injector, $rootScope) {
      return {
        request: function (request) {
          if (request.skipAuthorization) {
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
          if (response.status === 401) {
            $rootScope.$broadcast('unauthenticated', response);
          }
          return $q.reject(response);
        }
      };
    }];
  });

 angular.module('angular-jwt.jwt', [])
  .service('jwtHelper', function() {

    /*
     * Modification of Vassilis Petroulias's base64.js library
     * Original notice included below
     */

    /*
     Copyright Vassilis Petroulias [DRDigit]
     Licensed under the Apache License, Version 2.0 (the "License");
     you may not use this file except in compliance with the License.
     You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
     Unless required by applicable law or agreed to in writing, software
     distributed under the License is distributed on an "AS IS" BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     See the License for the specific language governing permissions and
     limitations under the License.
     */
    this.fromUtf8 = function (s) {
        /* jshint bitwise:false */
        var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
            lookup = null,
            position = -1,
            len, buffer = [],
            enc = [, , , ];
        if (!lookup) {
            len = alphabet.length;
            lookup = {};
            while (++position < len)
                lookup[alphabet.charAt(position)] = position;
            position = -1;
        }
        len = s.length;
        while (++position < len) {
            enc[0] = lookup[s.charAt(position)];
            enc[1] = lookup[s.charAt(++position)];
            buffer.push((enc[0] << 2) | (enc[1] >> 4));
            enc[2] = lookup[s.charAt(++position)];
            if (enc[2] === 64)
                break;
            buffer.push(((enc[1] & 15) << 4) | (enc[2] >> 2));
            enc[3] = lookup[s.charAt(++position)];
            if (enc[3] === 64)
                break;
            buffer.push(((enc[2] & 3) << 6) | enc[3]);
        }
        return buffer;
    },

    this.urlBase64Decode = function(str) {

      // Replace non-url compatible chars with base64 standard chars
      var str = str.replace(/-/g, '+').replace(/_/g, '/'),
          isIEo = /MSIE [67]/.test(navigator.userAgent);
      // Pad out with standard base64 required padding characters
      var pad = str.length % 4;
      if(pad) {
        if(pad === 1) {
          throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
        }
        str += new Array(5-pad).join('=');
      }

      /* jshint bitwise:false */
      str = str.replace(/\s/g, '');
      if (str.length % 4){
          throw new Error('InvalidLengthError: decode failed: The string to be decoded is not the correct length for a base64 encoded string.');
      }
      if(/[^A-Za-z0-9+\/=\s]/g.test(str)){
          throw new Error('InvalidCharacterError: decode failed: The string contains characters invalid in a base64 encoded string.');        
      }

      var buffer = this.fromUtf8(str),
          position = 0,
          output,
          len = buffer.length;

      if (isIEo) {
          output = [];
          while (position < len) {
              if (buffer[position] < 128)
                  output.push(String.fromCharCode(buffer[position++]));
              else if (buffer[position] > 191 && buffer[position] < 224)
                  output.push(String.fromCharCode(((buffer[position++] & 31) << 6) | (buffer[position++] & 63)));
              else
                  output.push(String.fromCharCode(((buffer[position++] & 15) << 12) | ((buffer[position++] & 63) << 6) | (buffer[position++] & 63)));
          }
          return output.join('');
      } else {
          output = '';
          while (position < len) {
              if (buffer[position] < 128)
                  output += String.fromCharCode(buffer[position++]);
              else if (buffer[position] > 191 && buffer[position] < 224)
                  output += String.fromCharCode(((buffer[position++] & 31) << 6) | (buffer[position++] & 63));
              else
                  output += String.fromCharCode(((buffer[position++] & 15) << 12) | ((buffer[position++] & 63) << 6) | (buffer[position++] & 63));
          }
          return output;
      }
    },

    this.decodeToken = function(token) {
      var parts = token.split('.');

      if (parts.length !== 3) {
        throw new Error('JWT must have 3 parts');
      }
      var decoded = this.urlBase64Decode(parts[1]);
      if (!decoded) {
        throw new Error('Cannot decode the token');
      }

      return JSON.parse(decoded);
    },

    this.getTokenExpirationDate = function(token) {
      var decoded;
      decoded = this.decodeToken(token);

      if(!decoded.exp) {
        return null;
      }

      var d = new Date(0); // The 0 here is the key, which sets the date to the epoch
      d.setUTCSeconds(decoded.exp);

      return d;
    },

    this.isTokenExpired = function(token) {
      var d = this.getTokenExpirationDate(token);

      if (!d) {
        return false;
      }

      // Token expired?
      return !(d.valueOf() > new Date().valueOf());
    }

  });

}());