'use strict';

var chai = require('chai');
var expect = chai.expect;
var fs = require('fs-extra');
var proxyquire = require('proxyquire');
var sinon = require('sinon');


describe('Given the KarmaCoveralls Module', function () {

  var karmaCoveralls, coverallsMock, dir, file;

  before(function (done) {
    dir = 'tmp/';
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

    // Creates a fake code coverage report file
    fs.mkdirs(dir, function (err) {
      if (err) {
        console.error(err);
        process.exit(1);
      } else {
        fs.outputFile(dir + file, "TN:\nend_of_record", function (err) {
          if (err) {
            console.log(err);
            process.exit(1);
          } else {
            console.log('Creating tmp files');
            done()
          }
        });
      }
      ;
    });
  });

  after(function (done) {
    fs.remove(dir + file, function (err) {
      if (err) return console.error(err)
      console.log('Deleting tmp files.');
      done();
    })
  });

  var CoverallsReporter, rootConfig, helper, logger;

  beforeEach(function () {
    rootConfig = {
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

      rootConfig = {
        reporters: ['coverage', 'coveralls']
      };
    });


    it('should allow using coverageReporter.dir', function (done) {
      rootConfig.coverageReporter = {
        dir: 'tmp/',
        reporters: [
          {type: 'lcov'}
        ]
      };

      var result = new CoverallsReporter(rootConfig, helper, logger);
      result._onExit(function () {

        expect(coverallsMock.sendToCoveralls.called).to.be.true;
        done();
      });
    });


    it('should execute the code and invoke the callback', function (done) {
      rootConfig.coverageReporter = {
        reporters: [
          {type: 'lcov', dir: 'tmp/'}
        ]
      };

      var result = new CoverallsReporter(rootConfig, helper, logger);
      result._onExit(function () {
        expect(coverallsMock.sendToCoveralls.called).to.be.true;
        done();
      });
    });
  });
});
