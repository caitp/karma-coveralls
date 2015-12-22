var fs = require('fs'),
    path = require('path');

var coveralls = require('coveralls'),
    lcovResultMerger = require('lcov-result-merger'),
    through2 = require('through2'),
    vfs = require('vinyl-fs');

module.exports = {
  'reporter:coveralls': ['type', CoverallsReporter]
};

function CoverallsReporter(rootConfig, helper, logger) {
  var filepath, i, reporter, reporters,
      log = logger.create('coveralls.io'),
      coverallsReporter = rootConfig.coverallsReporter || {},
      coverageReporter = rootConfig.coverageReporter || {},
      coverageIndex = (rootConfig.reporters || []).indexOf('coverage');

  if (coverageIndex < 0 || coverageIndex > rootConfig.reporters.indexOf('coveralls')) {
    throw new Error("coverage reporter should precede coveralls");
  }

  if (rootConfig.autoWatch) {
    // Disable reporter if it would be meaningless for a particular reason,
    // such as running in autoWatch mode
    log.info('disabled due to --auto-watch');
    return;
  }

  if (helper.isDefined(coverageReporter.reporters) &&
      Array.isArray(coverageReporter.reporters) &&
      coverageReporter.reporters.length) {
    reporters = coverageReporter.reporters;
  } else {
    reporters = [coverageReporter];
  }

  // Find lcov info
  for (i = 0; i < reporters.length; ++i) {
    reporter = reporters[i];

    if (/^(html|lcov|lcovonly)$/.test(reporter.type)) {
      if (reporter.dir) {
        filepath = path.resolve(rootConfig.basePath, reporter.dir);
        break;
      }
    }
  }

  if (!filepath) {
    if (coverageReporter.dir) {
      filepath = path.resolve(coverageReporter.dir);
    } else {
      // Default to ./coverage
      filepath = path.resolve(process.cwd(), 'coverage');
    }
  }

  log.debug('use lcov.info in %s', filepath);

  this.onExit = function onExit(done) {
    readLcov(filepath, function finish(err, input) {
      if (err) return done(err, null);

      coveralls.getBaseOptions(function getBaseOptions(err, options) {
        if (err) return done(err, null);

        options.filepath = ".";
        if (Object.prototype.hasOwnProperty.call(coverallsReporter, 'repoToken')) {
          options.repo_token = coverallsReporter.repoToken;
        }

        coveralls.convertLcovToCoveralls(input, options, function(err, postData) {
          if (err) return done(err, null);

          coveralls.sendToCoveralls(postData, function(err, response, body) {
            var has, result;

            if (err) return done(err, null);

            log.info("uploading...");
            if (!response) {
              // Unknown error, response object mysteriously undefined.
              response = {
                statusCode: 0
              };
            }

            // check coveralls.io for issues, they send 200
            // even when down for maintenance :-\
            if (!safeParse(body)[0] &&
                response.statusCode >= 200 &&
                response.statusCode < 300) {
              // TODO: log success sending to coveralls.io
              log.info("%d --- %s", response.statusCode, success(body, done));

              if (typeof body === "string") {
                result = safeParse(body)
                if (result[0]) return done(result[0])
                body = result[1]
              }

              has = Object.prototype.hasOwnProperty.bind(body)
              if(has('message') && has('url')) {
                log.info("%d --- %s", response.statusCode,
                    body.message + " (" + body.url + ")");
              } else {
                log.info("%d --- OK", response.statusCode);
              }
            } else {
              // TODO: log error sending to coveralls.io
              log.info("%d --- %s", response.statusCode, body);
              done();
            }
          });
        });
      });
    });
  }
};

CoverallsReporter.$inject = ['config', 'helper', 'logger'];

function readLcov(basepath, finish) {
  var tries = 0;

  (function retry() {
    if (tries++ > 5) return finish(new Error("Giving up after 5 tries"))
    tryReadLcov(basepath, retry, finish);
  })()
}

function tryReadLcov(basepath, retry, done) {
  var hasLcov = false;

  vfs.src(path.resolve(basepath, '**', 'lcov.info'))
    .pipe(through2.obj(
      function process(file, encoding, callback) {
        hasLcov = true;
        callback(null, file);
      },
      function flush(callback) {
        if (!hasLcov) {
          setTimeout(retry, 200);
          this.emit('close');
          return;
        }

        callback();
      }
    ))
    .pipe(lcovResultMerger())
    .pipe(through2.obj(function (file) {
      done(null, file.contents.toString());
    }));
}

function safeParse(json) {
  try {
    return [null, JSON.parse(body)];
  } catch (err) {
    return [err, void 0]
  }
}
