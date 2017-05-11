'use strict';

var through = require('through2');
var wkhtmltopdf = require('wkhtmltopdf');

var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-wkhtmltopdf';

module.exports = function (opts) {
    // Change behavior if running in bitbucket pipeline
    // This wires up wkhtmltopdf to Xvfb, so it'll render headless.
    if(process.env.BITBUCKET_BRANCH) {
        wkhtmltopdf.command = "/usr/bin/xvfb-run -n 99 /usr/bin/wkhtmltopdf";
    }
    var options = opts || {};

    function transform(file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streaming not supported'));
            cb();
            return;
        }

        file.path = gutil.replaceExtension(file.path, '.pdf');

        var pdfStream = wkhtmltopdf(file.contents.toString(enc), options);
        var outStream = through();
        pdfStream.on('error', this.emit.bind(this, 'error'));
        pdfStream.pipe(outStream);
        file.contents = outStream;

        this.push(file);
        cb();
    }

    return through.obj(transform);
};