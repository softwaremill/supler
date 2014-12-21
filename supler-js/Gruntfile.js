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
        },
        copy: {
            suplerjs: {
                expand: true, 
                src: 'target/supler.js', 
                dest: '../',
                flatten: true
            },
        }
    });

    grunt.registerTask('test', [ 'mocha' ]);

    grunt.registerTask('tsAndTest', [
        'ts',
        'test'
    ]);

    // main tasks
    grunt.registerTask('dev', [
        'tsAndTest',
        'watch'
    ]);

    grunt.registerTask('dist', [
        'tsAndTest',
        'copy'
    ]);
};
