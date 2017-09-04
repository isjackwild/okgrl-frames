const gulp = require('gulp');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const util = require('gulp-util');
const envify = require('envify');

const JS_SRC_FILE = '../app/client.js';
const JS_SRC_FILES = [
	'../app/*.js',
];
const JS_BUILD_FOLDER = '../build/assets/js';

gulp.task('build:js', function() {
	if (util.env.env === 'production') {
		return browserify(JS_SRC_FILE)
			.transform('babelify')
			.transform('envify', {
				global: true,
				_: 'purge',
				NODE_ENV: 'production'
			})
			.bundle()
			.on('error', function (err) {
				console.log(err.toString());
				this.emit("end");
			})
			.pipe(source('main.js'))
			.pipe(buffer())
			.pipe(uglify())
			.pipe(gulp.dest(JS_BUILD_FOLDER));	
	} else {
		return browserify({
				entries: [ JS_SRC_FILE ],
				debug: true,
			})
			.transform('babelify')
			.bundle()
			.on('error', function (err) {
				console.log(err.toString());
				this.emit("end");
			})
			.pipe(source('main.js'))
			.pipe(gulp.dest(JS_BUILD_FOLDER));
	}
});

gulp.task('watch:js', ['build:js'], function() {
	gulp.watch(JS_SRC_FILES, ['build:js']);
});
