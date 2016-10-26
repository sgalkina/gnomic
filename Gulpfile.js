/**
 * Created by lyschoening on 5/28/15.
 */
var gulp = require('gulp');
var peg = require('gulp-peg');
var gutil = require('gulp-util');
var replace = require('gulp-replace');

gulp.task('peg:compile', function () {
    gulp.src('./grammar.pegjs')
        .pipe(peg().on('error', gutil.log))
        .pipe(replace(/^module.exports = /g,
            "import * as types from './models.js';\n" +
            "\n" +
            "export const {SyntaxError, parse} = "))
        .pipe(gulp.dest('./src/'))
});
