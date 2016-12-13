/**
 * GULPFILE - By @wearearchitect
 */

/*-----------------------------------------*\
	VARIABLES
\*-----------------------------------------*/

// Dependencies
var $ = require('gulp-load-plugins')(),
	gulp = require('gulp'),
	del = require('del'),
	fs = require('fs'),
	lazypipe = require('lazypipe'),
	argv = require('yargs').argv,
	runSequence = require('run-sequence'),
	cleanCSS = require('gulp-clean-css'),
	louis = require('gulp-louis'),
	svgmin = require('gulp-svgmin'),

	// Environments
	production = !!(argv.production), // true if --production flag is used

	// If not production load in pngquant
	pngquant   = ! production ? require('imagemin-pngquant') : null,

	// Base Paths
	basePaths = {
		src: 'assets/',
		dest: ''
	},

	// Assets Folder Paths
	paths = {
		scss: basePaths.src + 'scss/**/*.scss',
		js: {
			src: basePaths.src + 'js/src/**/*.js',
			vendor: basePaths.src + 'js/vendor/*.js'
		},
		img: basePaths.src + 'img/**/*'
	},

	svgPaths = {
		images: {
			src: basePaths.src + 'img/svg',
			dest: 'img'
		},
		sprite: {
			src: basePaths.src + 'img/svg/*.svg',
			svgSymbols: 'img/svg/icons/icons.svg',
		}
};


/*-----------------------------------------*\
	ERROR NOTIFICATION
	- Beep!
\*-----------------------------------------*/

onError = function(err) {
	$.notify.onError({
		title: "Gulp",
		subtitle: "Failure!",
		message: "Error: <%= error.message %>",
		sound: "Beep"
	})(err);
	this.emit('end');
};

/*-----------------------------------------*\
	STATS
	- CSS Stats
	- todo: Add more stats files
\*-----------------------------------------*/
gulp.task('stats', function() {
  gulp.src(basePaths.dest + 'css/*.min.css')
	.pipe($.stylestats())
});

gulp.task('perf', function() {
	louis({
		url: 'http://webperf.dev',
		timeout: 60,
		performanceBudget: {
			requests: 2,
			medianLatency: 10,
			slowestResponse: 1000
		}
	});
});

/*-----------------------------------------*\
	 STYLES TASK
	 - Catch errors via gulp-plumber
	 - Compile Sass
	 - Vendor prefix
	 - Output unminified CSS for debugging
	 - Rename
	 - Minify
	 - Output minified CSS
\*-----------------------------------------*/

gulp.task('styles', function () {
	return gulp.src(paths.scss)
		.pipe( $.plumber({errorHandler: onError}) )
		.pipe( $.sass({ style: 'expanded', }))
		.pipe( $.autoprefixer('last 2 version') )
		.pipe( gulp.dest(basePaths.dest + 'css') )
		.pipe( $.rename({ suffix: '.min' }) ) // Remove to generate style.css for WordPress
		.pipe( cleanCSS({aggressiveMerging: true}) )
		.pipe( gulp.dest(basePaths.dest + 'css') )
		.pipe( $.size({title: 'Styles'}));
});

/*-----------------------------------------*\
	SASS LINTING
	- Keep your code squeaky clean
\*-----------------------------------------*/

gulp.task('lint', function() {
	return gulp.src(paths.scss)
	.pipe( $.plumber({errorHandler: onError}) )
	.pipe( $.scssLint( {
		'bundleExec': true,
		'config': '.scss-lint.yml',
		'reporterOutput': 'scss-lint-report.xml'
	}));
});


/*-----------------------------------------*\
	 SCRIPTS TASK
	 - Catch errors via gulp-plumber
	 - Hint
	 - Concatenate assets/js into core.js
	 - Output unminified JS for debugging
	 - Minify
	 - Rename
	 - Output minified JS
\*-----------------------------------------*/

gulp.task('scripts', function(){
	var gulpTasks = gulp.src([paths.js.vendor, paths.js.src])
		.pipe( $.plumber({errorHandler: onError}) )

	if ( ! production )
	{
		gulpTasks = gulpTasks.pipe( $.jshint() )
			.pipe( $.jshint.reporter('default') );
	}

	return gulpTasks
		.pipe( $.concat('core.js') )
		.pipe( gulp.dest(basePaths.dest + 'js') )
		.pipe( $.uglify() )
		.pipe( $.rename({ suffix: '.min' }) )
		.pipe( gulp.dest(basePaths.dest + 'js') )
		.pipe( $.size({title: 'Scripts'}));
});


/*-----------------------------------------*\
	 VENDOR SCRIPTS TASK
	 - Leave vendor scripts intact
	 - Minify
	 - Output minified scripts
\*-----------------------------------------*/

gulp.task('vendorScripts',function(){
	return gulp.src(paths.js.vendor)
	.pipe($.uglify())
	.pipe(gulp.dest(basePaths.dest + 'js'))
	.pipe($.size({title: 'Vendor Scripts'}));
});


/*-----------------------------------------*\
	 IMAGE OPTIMISATION TASK
	 - Optimise only new images + SVGs
	 - Output
\*-----------------------------------------*/

gulp.task('imgmin', function () {
	return gulp.src(paths.img)
		.pipe( $.cache( $.imagemin({
				progressive: true,
				use: [ pngquant() ]
			})))
		.pipe( gulp.dest(basePaths.dest + 'img'));
});


/*-----------------------------------------*\
	 SVG ICONS TASKS
	 - Config
	 - Create Symbol Sprites
	 - Create and add Symbol ID (id="icon-example")
	 - Create icon library preview page
	 - Output compiled icon library
	 - Inject into page

	 NB: Imgmin optimises all SVGs, then
	 outputs them to the _img folder.
	 So we have the icon library and the
	 individual SVGs at ourt disposal.
\*-----------------------------------------*/

// SVG Symbols Task
// Create SVG Symbols for icons.
gulp.task('svgSymbols', function () {
	return gulp.src(svgPaths.sprite.src)
		.pipe(stripAttrs())
		.pipe(svgmin())
		.pipe($.svgSprite(
			{
				mode        : {
					symbol      : {
						prefix      : ".icon-%s",
						dimensions  : "%s",
						sprite      : "svg/icons/icons.svg",
						dest        : svgPaths.images.dest,
						inline      : false,
						"example": {
							"dest": "svg/icons/icons-preview.html"
						}
					}
			},
				svg                     : {
					dimensionAttributes : false
				}
			}
		))
		.pipe(gulp.dest(basePaths.dest))
		.pipe($.size({title: 'SVG Symbols'}));
	});

// SVG Document Injection
// Inject SVG <symbol> block just after opening <body> tag.
gulp.task('inject', function () {
	var symbols = gulp.src(basePaths.dest + svgPaths.sprite.svgSymbols);

	function fileContents (filePath, file) {
		return file.contents.toString();
	}

	return gulp.src( basePaths.dest + 'header.php')
		.pipe($.inject(symbols, { transform: fileContents }))
		.pipe(gulp.dest( basePaths.dest ));
});

// Run all SVG tasks
gulp.task('svg', function(cb) {
	runSequence('svgSymbols', cb);
});


/*-----------------------------------------*\
	 DEV TASK
	 - Speedy!
\*-----------------------------------------*/

gulp.task('dev', function() {
	gulp.start('scripts', 'styles');
});


/*-----------------------------------------*\
	 CLEAN OUTPUT DIRECTORIES
\*-----------------------------------------*/

gulp.task('clean', function(cb) {
	if ( ! production )
		return del([
			basePaths.dest + '_*'
		], { read: false }, cb)
	else
		return del([
			basePaths.dest + '_*',
			'!' + basePaths.dest + '_img'
		], { read: false }, cb)
});

/*-----------------------------------------*\
	 CLEAR CACHE
\*-----------------------------------------*/

gulp.task('clear', function (done) {
	return $.cache.clearAll(done);
});

/*-----------------------------------------*\
	 MANUAL DEFAULT TASK
	 - Does everything
	 - Tasks in array run in parralel
\*-----------------------------------------*/

gulp.task('default', ['clean'], function(cb) {
	if ( ! production )
		runSequence('imgmin', ['styles', 'scripts'], 'svg', cb);
	else
		runSequence(['styles', 'scripts'], cb);
});

/*-----------------------------------------*\
	 WATCH
	 - Watch assets & public folder
	 - Auto-reload browsers
\*-----------------------------------------*/

gulp.task('watch', function() {
	gulp.watch(paths.scss, ['styles']);
	gulp.watch(paths.js.src, ['scripts']);
	gulp.watch([basePaths.dest + '*.html', basePaths.dest + '*.php']);
});

/*-----------------------------------------*\
	 CUSTOM PIPES
	 - Any pipes used more than once
\*-----------------------------------------*/

// Strips attributes from SVGs
var stripAttrs = lazypipe()
	.pipe( $.cheerio, {
		run: function ($) {
			$('[fill]').removeAttr('fill');
		},
		parserOptions: { xmlMode: true }
	});
