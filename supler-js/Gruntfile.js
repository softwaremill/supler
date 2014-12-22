'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // Configurable paths
    var config = {
        src: 'src',
        tests: 'tests',
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
                files: [ '<%= config.src %>/**/*.ts', '<%= config.tests %>/**/*.js' ],
                tasks: [ 'tsAndTest' ],
                options: {
                    atBegin: true,
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
                    log: true,
                    logErrors: true
                }
            }
        },
        copy: {
            testforms: {
                expand: true,
                src: '../supler/target/scala-2.11/test-classes/*.js',
                dest: 'tests/generated/',
                flatten: true
            },
            suplerjs: {
                expand: true,
                src: 'target/supler.js',
                dest: '../',
                flatten: true
            },
        }
    });

    grunt.registerTask('test', [ 'copy:testforms', 'mocha' ]);

    grunt.registerTask('tsAndTest', [
        'ts',
        'test'
    ]);

    // main tasks
    grunt.registerTask('dev', [ 'watch' ]);

    grunt.registerTask('dist', [
        'tsAndTest',
        'copy:suplerjs'
    ]);
};
