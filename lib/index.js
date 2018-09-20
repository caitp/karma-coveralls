var fs = require('fs');
var path = require('path');
var vfs = require('vinyl-fs');
var through2 = require('through2');
var lcovResultMerger = require('lcov-result-merger');
var coveralls = require('coveralls');

var CoverallsReporter = function(rootConfig, helper, logger) {
  var log = logger.create('coveralls.io');
  var config = rootConfig.coverallsReporter || {};
  var reporters = (rootConfig.reporters || []);
  var coverageReporter = resolve_coverage_reporter();

  if (rootConfig.autoWatch) {
    // Disable reporter if it would be meaningless for a particular reason,
    // such as running in autoWatch mode
    log.info('disabled due to --auto-watch');
    return;
  }

  var coverage = coverageReporter || {};
  reporters = coverage.reporters;
  if (!helper.isDefined(reporters) || !Array.isArray(reporters) || !reporters.length)
    reporters = [coverage];

  var filepath;

  // Find lcov info
  for (var i = 0, ii = reporters.length; i < ii; ++i) {
    var reporter = reporters[i];
    if (/^(html|lcov|lcovonly)$/.test(reporter.type)) {
      if (reporter.dir) {
        filepath = path.resolve(rootConfig.basePath, reporter.dir);
        break;
      }
    }
  }

  if (!filepath) {
    if (coverage.dir) {
      filepath = path.resolve(coverage.dir);
    } else {
      // Default to ./coverage
      filepath = path.resolve(process.cwd(), 'coverage');
    }
  }

  var coverallsReporter = rootConfig.coverallsReporter || {};

  log.debug('use lcov.info in %s', filepath);

  this.onExit = function(done) {
    read_lcov(filepath, finish);

    function finish(input) {
      if (!input) return done();
      coveralls.getBaseOptions(function(err, options) {
        options.filepath = ".";
        if ('repoToken' in coverallsReporter) options.repo_token = coverallsReporter.repoToken;
        coveralls.convertLcovToCoveralls(input, options, function(err, postData) {
          coveralls.sendToCoveralls(postData, function(err, response, body) {
            log.info("uploading...");
            send_to_coveralls(done, err, response, body);
          });
        });
      });
    }
  }

  function resolve_coverage_reporter() {
    var coverallsIndex = reporters.indexOf('coveralls');
    var coverageIndex = reporters.indexOf('coverage');
    if (coverageIndex >= 0 && coverageIndex < coverallsIndex) {
      return rootConfig.coverageReporter;
    }
    
    coverageIndex = reporters.indexOf('coverage-istanbul');
    if (coverageIndex >= 0 && coverageIndex < coverallsIndex) {
      return rootConfig.coverageIstanbulReporter;
    }
    throw new Error("coverage or coverage-istanbul reporter should precede coveralls");
  }

  function try_read_lcov(basepath, retry, done) {
    var has_lcov = false;

    vfs.src(path.resolve(basepath, '**', 'lcov.info'))
      .pipe(through2.obj(
        function process(file, encoding, callback) {
          has_lcov = true;
          callback(null, file);
        },
        function flush(callback) {
          if (!has_lcov) {
            setTimeout(retry, 200);
            this.emit('close');
            return;
          }

          callback();
        }
      ))
      .pipe(lcovResultMerger())
      .pipe(through2.obj(function (file) {
        done(file.contents.toString());
      }));
  }

  function read_lcov(basepath, finish) {
    var tries = 0;
    function retry() {
      try_read_lcov(basepath, tries++ < 5 ? retry : finish, finish);
    }
    try_read_lcov(basepath, retry, finish);
  }

  function send_to_coveralls(done, err, response, body) {
    // check coveralls.io for issues, they send 200 even when down for maintenance :-\
    var isJSON;
    try {
        JSON.parse(body);
        isJSON = true;
    } catch (e) {
        isJSON = false;
    }
    if (!response) {
      // Unknown error, response object mysteriously undefined.
      response = {
        statusCode: 0
      };
    }
    if ((response.statusCode >= 200 && response.statusCode < 300) && isJSON) {
      // TODO: log success sending to coveralls.io
      log.info("%d --- %s", response.statusCode, success(body));
    } else {
      // TODO: log error sending to coveralls.io
      log.info("%d --- %s", response.statusCode, body);
    }
    done();
  }

  function success(body) {
    if (typeof body === "string") body = JSON.parse(body);
    if ('message' in body && 'url' in body) {
      return body.message + " (" + body.url + ")";
    }
    return "OK";
  }
};

CoverallsReporter.$inject = ['config', 'helper', 'logger'];

module.exports = {
  'reporter:coveralls': ['type', CoverallsReporter]
};
