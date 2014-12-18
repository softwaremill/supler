'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mocha');

    // Configurable paths
    var config = {
        src: 'src',
        target: 'target'
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        config: config,
        ts: {
            default: {
                src: ['<%= config.src %>/**/*.ts'],         
                out: '<%= config.target %>/supler.js'
            }
        },
        watch: {
            ts: {
                files: ['<%= config.src %>/**/*.ts'],
                tasks: ['tsAndTest'],
                options: {
                    livereload: true
                }
            }
        },
        clean: [ '<%= config.target %>' ],
        mocha: {
            test: {
                src: [ 'tests/runner.html'],
                options: {
                    run: true,
                }
            }
        }
    });

    grunt.registerTask('test', [ 'mocha' ]);

    grunt.registerTask('tsAndTest', [
        'ts',
        'test'
    ]);

    grunt.registerTask('dev', [
        'tsAndTest',
        'watch'
    ]);
};
