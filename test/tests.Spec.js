'use strict';

var chai = require('chai');
var expect = chai.expect;
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var Config = require('karma/lib/config').Config;

var createKarmaConfig = function (mockConfig) {
  var config = new Config();
  config.set(mockConfig);
  return config;
};

var dir = 'test/fixture';

describe('Given the KarmaCoveralls Module', function () {

  var karmaCoveralls, coverallsMock, file;

  before(function () {
    file = 'lcov.info';

    coverallsMock = {
      getBaseOptions: function (fn) {
        fn(false, {filepath: ''})
      },
      convertLcovToCoveralls: function (input, options, cb) {
        cb();
      },
      sendToCoveralls: function (postData, cb) {
        cb()
      }
    };

    sinon.spy(coverallsMock, 'sendToCoveralls');

    karmaCoveralls = proxyquire('../lib/index.js', {'coveralls': coverallsMock});
  });

  var CoverallsReporter, mockConfig, helper, logger;

  beforeEach(function () {
    mockConfig = {
      reporters: ['coveralls', 'coverage']
    };

    logger = {
      create: function () {
      }
    };

    CoverallsReporter = karmaCoveralls['reporter:coveralls'][1];

    // Expose private method
    CoverallsReporter.prototype._onExit = function (cb) {
      this.onExit(cb);
    };
  });


  it('should throw an exception if "coveralls" does not precede "coverage" in the reporters list', function () {
    expect(CoverallsReporter.bind(this, {}, {}, logger))
      .to.throw(Error, /coverage reporter should precede coveralls/);
  });

  describe('when given the coverageReporter type/reporters parameter is not properly defined or undefined', function () {
    beforeEach(function () {

      mockConfig = {
        reporters: ['coverage', 'coveralls']
      };

      helper = {
        isDefined: function () {
          return true;
        }
      };

      logger = {
        create: function () {
          return {
            debug: function () {
            },
            info: function () {
            }
          }
        }
      };
    });


    it('should log an error if it doesn\'t find LCOV configuration', function (done) {
      expect(CoverallsReporter.bind(this, mockConfig, helper, logger))
        .to.throw(Error, /LCOV configuration was not found. Maybe you missed something\?/);

      done();
    });
  });


  describe('when given the right parameters', function () {
    beforeEach(function () {

      helper = {
        isDefined: function () {
          return true;
        }
      };

      logger = {
        create: function () {
          return {
            debug: function () {
            },
            info: function () {
            }
          }
        }
      };

      mockConfig = {
        basePath: __dirname,
        autoWatch: false,
        reporters: ['coverage', 'coveralls']
      };
    });


    it('should allow using coverageReporter.dir', function (done) {
      mockConfig.coverageReporter = {
        dir: dir,
        reporters: [
          {type: 'lcov'}
        ]
      };

      var rootConfig = createKarmaConfig(mockConfig);
      var result = new CoverallsReporter(mockConfig, helper, logger);
      result._onExit(function () {
        expect(coverallsMock.sendToCoveralls.called).to.be.true;
        done();
      });
    });


    it('should execute the code and invoke the callback', function (done) {
      mockConfig.coverageReporter = {
        reporters: [
          {type: 'lcov', dir: dir}
        ]
      };

      var rootConfig = createKarmaConfig(mockConfig);
      var result = new CoverallsReporter(mockConfig, helper, logger);
      result._onExit(function () {
        expect(coverallsMock.sendToCoveralls.called).to.be.true;
        done();
      });
    });
  });
});
