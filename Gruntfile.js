'use strict';

module.exports = function(grunt) {

  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({
    mochacli: {
      options: {
         files: 'test/**/*.js',
         harmony: true
      },
      test: {
        options: {

        }
      },
      debug: {
        options: {
          reporter: 'nyan',
          'debug-brk': true
        }
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        'server.js',
        'lib/**/*.js'
      ]
    }
  });

  grunt.registerTask('test', ['mochacli:test']);
  grunt.registerTask('test-debug', ['mochacli:debug']);
};
