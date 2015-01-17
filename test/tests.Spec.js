'use strict';

var chai = require('chai');
var expect = chai.expect;
var fs = require('fs-extra');
var sinon = require('sinon');
var proxyquire = require('proxyquire');


describe('Given the KarmaCoveralls Module', function () {

  var karmaCoveralls, dir, file;

  before(function (done) {

    dir = 'tmp/';
    file = 'lcov.info';

    var coverallsMock = {
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

    karmaCoveralls = proxyquire('../lib/index.js', { 'coveralls': coverallsMock });


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
      };
    });
  });

  after(function(done) {

    fs.remove(dir + file, function(err) {
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
      create: function () {}
    };

    CoverallsReporter = karmaCoveralls['reporter:coveralls'][1]


  });

  it('should throw an exception if "coveralls" does not precede "coverage" in the reporters list', function () {

    expect(CoverallsReporter.bind(this, {}, {}, logger)).to.throw(Error, /coverage reporter should precede coveralls/);

  });

  describe('when given the right parameters', function () {

    beforeEach(function () {

      rootConfig = {
        reporters: ['coverage', 'coveralls'],
        coverageReporter: {
          reporters: [
            {type: 'lcov', dir: 'tmp/'}
          ]
        }
      };

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
    });

    it('should execute the code and invoke the callback', function (cb) {

      CoverallsReporter.prototype.fireOnExit = function (cb) {
        this.onExit(cb);
      };
      var result = new CoverallsReporter(rootConfig, helper, logger);
      result.fireOnExit(cb);

    });

  });


});
