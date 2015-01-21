'use strict';

var chai = require('chai');
var expect = chai.expect;
var proxyquire = require('proxyquire');
var sinon = require('sinon');

var dir = 'test/fixture';

describe('Given the KarmaCoveralls Module', function () {

  var karmaCoveralls, coverallsMock, file;

  before(function () {
    file = 'lcov.info';

    coverallsMock = {
      getBaseOptions: function(fn) {
        fn(false, {filepath: ''})
      },
      convertLcovToCoveralls: function(input, options, cb) {
        cb();
      },
      sendToCoveralls: function(postData, cb) {
        cb()
      }
    };

    sinon.spy(coverallsMock, 'sendToCoveralls');

    karmaCoveralls = proxyquire('../lib/index.js', {'coveralls': coverallsMock});
  });

  var CoverallsReporter, rootConfig, helper, logger;

  beforeEach(function () {

    rootConfig = {
      reporters: ['coveralls', 'coverage']
    };

    logger = {
      create: function () {}
    };

    CoverallsReporter = karmaCoveralls['reporter:coveralls'][1];

    // Expose private method
    CoverallsReporter.prototype._onExit = function (cb) {
      this.onExit(cb);
    };

  });

  it('should throw an exception if "coveralls" does not precede "coverage" in the reporters list', function () {

    expect(CoverallsReporter.bind(this, {}, {}, logger)).to.throw(Error, /coverage reporter should precede coveralls/);

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
            debug: function () {},
            info: function() {}
          }
        }
      };

      rootConfig = {
        reporters: ['coverage', 'coveralls']
      };
    });

    it('should allow using coverageReporter.dir', function(done) {

      rootConfig.coverageReporter = {
        dir: dir,
        reporters: [
          {type: 'lcov'}
        ]
      };

      var result = new CoverallsReporter(rootConfig, helper, logger);
      result._onExit(function() {

        expect(coverallsMock.sendToCoveralls.called).to.be.true;
        done();

      });

    });

    it('should execute the code and invoke the callback', function (done) {

      rootConfig.coverageReporter = {
        reporters: [
          {type: 'lcov', dir: dir}
        ]
      };

      var result = new CoverallsReporter(rootConfig, helper, logger);
      result._onExit(function() {
        expect(coverallsMock.sendToCoveralls.called).to.be.true;
        done();
      });

    });

  });

});
