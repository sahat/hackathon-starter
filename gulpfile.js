var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var pump = require('pump');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var watch = require('gulp-watch');

gulp.task("babel", function(){
    return gulp.src("src/jsx/**/*.jsx").
    pipe(babel({
        plugins: ['transform-react-jsx']
    })).
    pipe(gulp.dest("public/js/components"));
});

gulp.task('public', function (cb) {

    var dest = 'public/js';
    var source = [
        'src/js/lib/jquery-2.2.0.min.js',
        'src/js/main.js',
        'src/js/lib/underscore-min.js',
        'src/js/lib/backbone-min.js',
        'src/js/lib/bootstrap.min.js',
        'src/js/lib/pubSub.js'
    ];

    return gulp.src(source)
        .pipe(concat('scripts.js'))
        .pipe(gulp.dest(dest))
        .pipe(rename('scripts.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(dest));
});

gulp.task('authUser', function (cb) {

    var dest = 'public/js';
    var source = [
        'src/js/models/*.js',
        'src/js/controllers/*.js',
        'public/js/components/**/*.js',
        'src/js/authUser/*.js'
    ];

    return gulp.src(source)
        .pipe(concat('scripts.js'))
        .pipe(gulp.dest(dest))
        .pipe(rename('scripts.auth.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(dest));
});

gulp.task('default', ['babel'],function() {

    gulp.run(['public','authUser'], function(){

    });

});