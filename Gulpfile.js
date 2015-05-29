/**
 * Created by lyschoening on 5/28/15.
 */
var gulp = require('gulp');
var peg = require('gulp-peg');
var gutil = require('gulp-util');
var babel = require('gulp-babel');

gulp.task('peg:compile', function () {
    gulp.src('./genotype.pegjs')
        .pipe(peg().on('error', gutil.log))
        .pipe(gulp.dest('./src/'))
});

gulp.task('babel', function () {
    return gulp.src(['./src/*.js'])
        .pipe(babel({
            modules: 'system',
            optional: ['runtime'],
            stage: 0
        }))
        .pipe(gulp.dest('./dist/'));
});
