
var karmaCoveralls = require('../lib/index.js');

describe('Given the KarmaCoveralls Module', function() {

    var CoverallsReporter, logger;

    beforeEach(function() {


        logger = {
            create: function(){}
        };

        CoverallsReporter = karmaCoveralls['reporter:coveralls'][1]


    });

    it('should throw an exception if "coveralls" is not in the list of reporters', function() {

        expect(CoverallsReporter.bind(this, {}, {}, logger)).toThrow(new Error("coverage reporter should precede coveralls"));


    });

});