const gulp = require('gulp');
const browserSync = require('browser-sync');

const PUBLIC_FOLDER = '../build/assets/';

gulp.task('server', function() {
	browserSync.init({
		browser: [],
		notify: false,
		online: false,
		logConnections: true,
		files: [ PUBLIC_FOLDER ],
		proxy: '127.0.0.1:4000',
	});

	browserSync.reload();
});
