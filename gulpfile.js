"use strict";

var gulp = require('gulp');
var browserify = require('browserify');
var browserSync = require("browser-sync");
var to5ify = require("6to5ify");
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var cssimport = require('gulp-cssimport');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var jshint = require('gulp-jshint');
var del = require('del');

var NAME = require('./package.json').name;
var VERSION = require('./package.json').version;
var DEST = "./build/"

gulp.task('clean', function(done) {
  del([DEST], done);
});

gulp.task('js', function() {
  var bundler = browserify({
    entries: ['./src/js/timeline-editor.js'],
    debug: true
  }).transform(to5ify);
  return bundler.bundle()
    .pipe(source(NAME + ".min.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    //.pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(DEST + "js/"));
});

gulp.task('css', function() {
  return gulp.src(['src/**/*.less'])
    .pipe(less())
    .pipe(cssimport())
    .pipe(gulp.dest(DEST))
    .pipe(browserSync.reload({stream: true}))
});

gulp.task('fonts', function() {
  return gulp.src([
      'bower_components/font-awesome/fonts/*'
    ]).pipe(gulp.dest(DEST + "fonts/"));
});

gulp.task('html', function() {
  return gulp.src('./src/index.html')
    .pipe(gulp.dest(DEST));
});

gulp.task('jshint', function() {
  return gulp.src('src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));

});

gulp.task('watch-jshint', ['jshint'], function() {
  gulp.watch(['src/**/*.js'], ['jshint']);
});

gulp.task('watch', ['build'], function() {
  browserSync({
    server: {baseDir: DEST, https: true},
    https: true,
    ghostMode: false, 
    port: 8000,
    open: false
  });
  gulp.watch(['src/*.html'], ['html', browserSync.reload]);
  gulp.watch(['src/**/*.js', 'src/**/*.jsx'], ['js', browserSync.reload]);
  gulp.watch(['src/**/*.less'], ['css']);
});

gulp.task('build', ['css', 'html', 'js', 'fonts']);
gulp.task('default', ['build']);

