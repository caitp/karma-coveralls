'use strict';

var fs = require('fs');
var chai = require('chai');
var sinonChai = require('sinon-chai');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var Config = require('karma/lib/config').Config;

chai.use(sinonChai);
var expect = chai.expect;

var dir = 'test/fixture';

describe('Given the KarmaCoveralls Module', function () {

  var karmaCoveralls, coverallsMock, file;

  beforeEach(function () {
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

    sinon.spy(coverallsMock, 'convertLcovToCoveralls');
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


  it('should throw an exception if "coveralls" does not precede "coverage" in the reporters list', function (done) {
    expect(CoverallsReporter.bind(this, {}, {}, logger))
      .to.throw(Error, /coverage or coverage-istanbul reporter should precede coveralls/);
    expect(CoverallsReporter.bind(this, mockConfig, {}, logger))
      .to.throw(Error, /coverage or coverage-istanbul reporter should precede coveralls/);
      done();
  });


  it('should throw an exception if "coveralls" does not precede "coverage-istanbul" in the reporters list', function (done) {
    mockConfig.reporters = ['coveralls','coverage-istanbul']
    expect(CoverallsReporter.bind(this, mockConfig, {}, logger))
      .to.throw(Error, /coverage or coverage-istanbul reporter should precede coveralls/);
    done();
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
        basePath: '',
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

      var result = new CoverallsReporter(mockConfig, helper, logger);
      result._onExit(function () {

        expect(coverallsMock.sendToCoveralls).to.have.been.called;
        done();
      });
    });


    it('should execute the code and invoke the callback', function (done) {
      mockConfig.coverageReporter = {
        reporters: [
          {type: 'lcov', dir: dir}
        ]
      };

      var result = new CoverallsReporter(mockConfig, helper, logger);
      result._onExit(function () {
        expect(coverallsMock.sendToCoveralls).to.have.been.called;
        done();
      });
    });


    it('should correctly merge coverage data', function (done) {
      mockConfig.coverageReporter = {
        type: 'lcov',
        dir: dir
      };

      var result = new CoverallsReporter(mockConfig, helper, logger);
      result._onExit(function () {
        var expected = fs.readFileSync('test/expected/lcov.info');
        expect(coverallsMock.convertLcovToCoveralls)
          .to.have.been.calledWith(expected.toString());
        done();
      });
    });


    it('should not send missing coverage data', function (done) {
      mockConfig.coverageReporter = {
        type: 'lcov',
        dir: 'dummy'
      };

      var result = new CoverallsReporter(mockConfig, helper, logger);
      result._onExit(function () {
        expect(coverallsMock.sendToCoveralls).to.not.have.been.called;
        done();
      });
    });
  });

  describe('when given the right parameters for coverage-istanbul', function () {
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
        basePath: '',
        autoWatch: false,
        reporters: ['coverage-istanbul', 'coveralls']
      };
    });


    it('should allow using coverageIstanbulReporter.dir', function (done) {
      mockConfig.coverageIstanbulReporter = {
        dir: dir,
        reporters: ['lcov']
      };

      var result = new CoverallsReporter(mockConfig, helper, logger);
      result._onExit(function () {

        expect(coverallsMock.sendToCoveralls).to.have.been.called;
        done();
      });
    });


    it('should correctly merge coverage data', function (done) {
      mockConfig.coverageIstanbulReporter = {
        dir: dir,
        reporters: ['lcov']
      };

      var result = new CoverallsReporter(mockConfig, helper, logger);
      result._onExit(function () {
        var expected = fs.readFileSync('test/expected/lcov.info');
        expect(coverallsMock.convertLcovToCoveralls)
          .to.have.been.calledWith(expected.toString());
        done();
      });
    });


    it('should not send missing coverage data', function (done) {
      mockConfig.coverageIstanbulReporter = {
        dir: 'dummy',
        reporters: ['lcov']
      };

      var result = new CoverallsReporter(mockConfig, helper, logger);
      result._onExit(function () {
        expect(coverallsMock.sendToCoveralls).to.not.have.been.called;
        done();
      });
    });
  });
});
