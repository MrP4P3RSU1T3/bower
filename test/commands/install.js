var expect = require('expect.js');
var object = require('mout').object;

var helpers = require('../helpers');
var commands = helpers.require('lib/index').commands;

describe('bower install', function () {

    var tempDir = new helpers.TempDir();

    var package = new helpers.TempDir({
        'bower.json': {
            name: 'package'
        }
    }).prepare();

    var install = function(packages, options, config) {
        config = object.merge(config || {}, {
            cwd: tempDir.path
        });

        var logger = commands.install(
            packages, options, config
        );

        return helpers.expectEvent(logger, 'end');
    };

    it('writes to bower.json if --save flag is used', function () {
        package.prepare();

        tempDir.prepare({
            'bower.json': {
                name: 'test'
            }
        });

        return install([package.path], { save: true }).then(function() {
            expect(tempDir.read('bower.json')).to.contain('dependencies');
        });
    });

    it('reads .bowerrc from cwd', function () {
        package.prepare({ foo: 'bar' });

        tempDir.prepare({
            '.bowerrc': { directory: 'assets' },
            'bower.json': {
                name: 'test',
                dependencies: {
                    package: package.path
                }
            }
        });

        return install().then(function() {
            expect(tempDir.read('assets/package/foo')).to.be('bar');
        });
    });

    it('runs preinstall hook', function () {
        package.prepare();

        tempDir.prepare({
            'bower.json': {
                name: 'test',
                dependencies: {
                    package: package.path
                }
            },
            '.bowerrc': {
                scripts: {
                    preinstall: 'bash -c "echo -n % > preinstall.txt"'
                }
            }
        });

        return install().then(function() {
            expect(tempDir.read('preinstall.txt')).to.be('package');
        });
    });

    it('runs preinstall hook', function () {
        package.prepare();

        tempDir.prepare({
            'bower.json': {
                name: 'test',
                dependencies: {
                    package: package.path
                }
            },
            '.bowerrc': {
                scripts: {
                    postinstall: 'bash -c "echo -n % > postinstall.txt"'
                }
            }
        });

        return install().then(function() {
            expect(tempDir.read('postinstall.txt')).to.be('package');
        });
    });

    // To be discussed, but that's the implementation now
    it('does not run hooks if nothing is installed', function () {
        tempDir.prepare({
            'bower.json': {
                name: 'test'
            },
            '.bowerrc': {
                scripts: {
                    postinstall: 'bash -c "echo -n % > hooks.txt"',
                    preinstall: 'bash -c "echo -n % > hooks.txt"'
                }
            }
        });

        return install().then(function() {
            expect(tempDir.exists('hooks.txt')).to.be(false);
        });
    });

    it('runs postinstall after bower.json is written', function () {
        package.prepare();

        tempDir.prepare({
            'bower.json': {
                name: 'test'
            },
            '.bowerrc': {
                scripts: {
                    postinstall: 'bash -c "cat bower.json > hook.txt"',
                }
            }
        });

        return install([package.path], { save: true }).then(function() {
            expect(tempDir.read('hook.txt')).to.contain('dependencies');
        });
    });
});
