"use strict";

var gulp = require('gulp');
var babelify = require("babelify");
var browserify = require('browserify');
var browserSync = require("browser-sync");
var buffer = require('vinyl-buffer');
var cssimport = require('gulp-cssimport');
var del = require('del');
var eslint = require("gulp-eslint")
var gutil = require('gulp-util');
var less = require('gulp-less');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var NAME = require('./package.json').name;
var VERSION = require('./package.json').version;
var DEST = "./build/"

gulp.task('clean', function(done) {
  del([DEST], done);
});

gulp.task('js', function() {
  return browserify({
      entries: ['./src/js/timeline-editor.js']
    })
    .transform(babelify)
    .bundle()
    .pipe(source(NAME + ".min.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(DEST + "js/"));
});

gulp.task('css', function() {
  return gulp.src(['src/*/timeline-editor.less'])
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

gulp.task('lint', function() {
  return gulp.src(['src/**/*.js', 'src/**/*.jsx'])
    .pipe(eslint())
    .pipe(eslint.format())

});

gulp.task('watch-lint', ['lint'], function() {
  gulp.watch(['src/**/*.js*'], ['lint']);
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

