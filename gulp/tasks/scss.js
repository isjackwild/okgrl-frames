const PATH = require('path');
const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const util = require('gulp-util');
// const cssnano = require('gulp-cssnano');


const SCSS_SRC_FILE = '../app/ui/styles/main.scss';
const SCSS_SRC_FILES = [
	'../app/ui/components/**/*.scss',
	'../app/ui/pages/**/*.scss',
	'../app/ui/styles/**/*.scss',
];
const SCSS_BUILD_FOLDER = '../build/assets/css';

gulp.task('build:scss', function() {
	if (util.env.env === 'production') {
		return gulp.src(SCSS_SRC_FILE)
			.pipe(sass(({ outputStyle: 'compressed' })).on('error', sass.logError))
			.pipe(autoprefixer('last 6 versions', '> 0.5%', 'ie 8', 'ie 7'))
			.pipe(gulp.dest(SCSS_BUILD_FOLDER));
	} else {
		return gulp.src(SCSS_SRC_FILE)
			.pipe(sourcemaps.init())
			.pipe(sass(({ outputStyle: 'expanded' })).on('error', sass.logError))
			.pipe(sourcemaps.write())
			.pipe(gulp.dest(SCSS_BUILD_FOLDER));
	}
});

gulp.task('watch:scss', ['build:scss'], function() {
	gulp.watch(SCSS_SRC_FILES, ['build:scss']);
});
