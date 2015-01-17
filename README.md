#karma-coveralls [![Build Status](https://travis-ci.org/yagoferrer/karma-coveralls.svg?branch=master)](https://travis-ci.org/yagoferrer/karma-coveralls) ![dependencies](https://david-dm.org/caitp/karma-coveralls.svg)

A Karma plugin to upload coverage reports to [coveralls.io](https://coveralls.io/)

Based on the work on [grunt-karma-coveralls](https://github.com/mattjmorrison/grunt-karma-coveralls),
with the primary difference being that this plugin does not depend on grunt, and simply exists as a
[Karma](http://karma-runner.github.io/) plugin.

##Usage

In your karma configuration, ensure your list of reporters contains at the very least `coverage` and
`coveralls`, for example:

```js
  reporters: ['coverage', 'coveralls']
```

Following this, ensure you are generating lcov reports from the coverage reporter, like so:

```js
  coverageReporter: {
    type: 'lcov', // lcov or lcovonly are required for generating lcov.info files
    dir: 'coverage/'
  }
```

And finally, the coveralls reporter depends on some additional configuration, which may be set
via environment variables, karma config options (properties of the `coverallsReporter` object),
or presence in the `.coveralls.yml` configuration file:

```
+-------------------------+------------------------+---------------------+
| ENV VARIABLE            | YAML VARIABLE          | KARMA VARIABLE      |
+-------------------------+------------------------+---------------------+
| `COVERALLS_REPO_TOKEN`  | `repo_token`           | `repoToken`         |
+-------------------------+------------------------+---------------------+
```

Please note that is is NOT recommended to save your repo token in plain text for everyone to see.
Treat it like a password. If you need to include it in a public repo you should [encrypt it](http://docs.travis-ci.com/user/build-configuration/#Secure-environment-variables).

Be patiant when sending coverage information to coveralls, it can take upto 4 hours for things to 
start showing up properly.

##Contribution

Please send pull requests improving the usage and fixing bugs, improving documentation and providing
better examples, or providing some testing, because these things are important.

##License

The MIT License (MIT)

Copyright (c) 2013 Caitlin Potter & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
