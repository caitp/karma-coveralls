var fs = require('fs');
var path = require('path');
var glob = require('glob');
var coveralls = require('coveralls');

var CoverallsReporter = function(rootConfig, helper) {
  var config = rootConfig.coverallsReporter || {};
  var reporters = (rootConfig.reporters || []);
  var coverage = reporters.indexOf('coverage');
  if (coverage < 0 || coverage > reporters.indexOf('coveralls')) {
    throw new Error("coverage reporter should precede coveralls");
  }

  coverage = rootConfig.coverageReporter || {};
  reporters = coverage.reporters;
  if (!helper.isDefined(reporters) || !Array.isArray(reporters) || !reporters.length)
    reporters = [coverage];

  var filepath;

  // Find lcov info
  for (var i = 0, ii = reporters.length; i < ii; ++i) {
    var reporter = reporters[i];
    if (/^(html|lcov|lcovonly)$/.test(reporter.type)) {
      if (reporter.dir) {
        filepath = path.resolve(reporter.dir);
        break;
      }
    }
  }

  var coverallsReporter = rootConfig.coverallsReporter || {};

  // Default to ./coverage
  if (!filepath) filepath = path.resolve(process.cwd(), 'coverage');

  this.onExit = function(done) {
    // Disable reporter if it would be meaningless for a particular reason,
    // such as running in autoWatch mode
    if (rootConfig.autoWatch) return done();

    var input = read_lcov(filepath);
    if (!input) return done();

    coveralls.getBaseOptions(function(err, options) {
      options.filepath = ".";
      if ('repoToken' in coverallsReporter) options.repo_token = coverallsReporter.repoToken;
      coveralls.convertLcovToCoveralls(input, options, function(err, postData) {
        coveralls.sendToCoveralls(postData, function(err, response, body) {
          send_to_coveralls(done, err, response, body);
        });
      });
    });
  }

  function read_lcov(basepath) {
    var lcov_path = glob.sync(path.resolve(basepath, '**', 'lcov.info'))[0];
    if (!lcov_path) {
      // TODO: warning
      return;
    }
    return fs.readFileSync(lcov_path, 'utf8').toString();
  }

  function send_to_coveralls(done, err, response, body) {
    if (response.statusCode >= 200 || response.statusCode < 300) {
      // TODO: log success sending to coveralls.io
    } else {
      // TODO: log error sending to coveralls.io
    }
    done();
  }
};

CoverallsReporter.$inject = ['config', 'helper'];

module.exports = {
  'reporter:coveralls': ['type', CoverallsReporter]  
};
