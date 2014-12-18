'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-clean');

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
                tasks: ['ts'],
                options: {
                    livereload: true
                }
            }
        },
        clean: [ '<%= config.target %>' ]
    });

    grunt.registerTask('dev', [
        'ts',
        'watch'
    ]);
};
