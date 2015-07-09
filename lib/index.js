var fs = require('fs');
var path = require('path');
var glob = require('glob');
var coveralls = require('coveralls');

var CoverallsReporter = function(rootConfig, helper, logger) {
  var log = logger.create('coveralls.io');
  var config = rootConfig.coverallsReporter || {};
  var reporters = (rootConfig.reporters || []);
  var coverage = reporters.indexOf('coverage');
  if (coverage < 0 || coverage > reporters.indexOf('coveralls')) {
    throw new Error("coverage reporter should precede coveralls");
  }

  if (rootConfig.autoWatch) {
    // Disable reporter if it would be meaningless for a particular reason,
    // such as running in autoWatch mode
    log.info('disabled due to --auto-watch');
    return;
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

  function try_read_lcov(basepath, retry, done) {
    var lcov_path = glob.sync(path.resolve(basepath, '**', 'lcov.info'))[0];
    if (!lcov_path) {
      setTimeout(retry, 200);
    } else {
      done(fs.readFileSync(lcov_path, 'utf8').toString());
    }
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
