/**
 * Created by lyschoening on 5/28/15.
 */
var gulp = require('gulp');
var peg = require('gulp-peg');
var gutil = require('gulp-util');
var babel = require('gulp-babel');
var replace = require('gulp-replace');

gulp.task('peg:compile', function () {
    gulp.src('./genotype.pegjs')
        .pipe(peg().on('error', gutil.log))
        .pipe(replace(/^module.exports = /g,
            "import * as types from './types';\n" +
            "\n" +
            "export const {SyntaxError, parse} = "))
        .pipe(gulp.dest('./src/'))
});

gulp.task('babel', function () {
    return gulp.src(['./src/*.js'])
        .pipe(babel({
            modules: 'common',
            optional: ['runtime'],
            stage: 0
        }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('dist', ['babel']);