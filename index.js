'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var applySourceMap = require('vinyl-sourcemaps-apply');
var objectAssign = require('object-assign');
var autoprefixer = require('autoprefixer-core');
var postcss = require('postcss');

module.exports = function (opts) {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-autoprefixer', 'Streaming not supported'));
			return;
		}

		var fileOpts = objectAssign({}, opts);
		var processor = postcss()
			.use(autoprefixer(fileOpts))
			.process(file.contents.toString(), {
				map: file.sourceMap ? {annotation: false} : false,
				from: file.path,
				to: file.path
			});

		processor.then(function (res) {
			file.contents = new Buffer(res.css);

			if (res.map && file.sourceMap) {
				applySourceMap(file, res.map.toString());
			}

			var warnings = res.warnings();

			if (warnings.length > 0) {
				gutil.log('gulp-autoprefixer:', '\n  ' + warnings.join('\n  '));
			}

			cb(null, file);
		}).catch(function (err) {
			var cssError = err.name === 'CssSyntaxError';

			if (cssError) {
				err.message = err.message + err.showSourceCode();
			}

			cb(new gutil.PluginError('gulp-autoprefixer', err, {
				fileName: file.path,
				showStack: !cssError
			}));
		});
	});
};
