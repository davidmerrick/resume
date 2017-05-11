'use strict';

import gulp from "gulp";
import s3 from "gulp-s3-upload";
import rename from "gulp-rename";
import markdownInclude from "markdown-it-include";
import gulpMarkdownIt from "gulp-markdown-it-adapter";
import markdownIt from "markdown-it";
import fs from "fs";

// Requires a custom gulp-html2pdf so that wkhtmltopdf command can be overridden
// This is necessary to wire it up to Xvfb when running in a headless build pipeline
import pdf from './custom-gulp-html2pdf'

const OUTPUT_PDF = process.env.RESUME_FILENAME || "resume_davidmerrick.pdf";
const OUTPUT_HTML = process.env.RESUME_HTML || "resume_davidmerrick.html";

gulp.task('preWriteData', (callback) => {
     fs.writeFile("phoneNumber.md", process.env.PHONE_NUMBER || "", () => {
         fs.writeFile(
             "style.md",
             `<link rel="stylesheet" href="${__dirname}/src/css/style.css" />`,
             callback
         );
     });
});

gulp.task('exportPdf', ['preWriteData'],() => {
    let options = {
        html: true
    };
    let md = new markdownIt('default', options);
    md.use(markdownInclude);

    let wkHtmlOptions = {
        zoom: 5,
        "margin-left": "20mm",
        "margin-right": "20mm",
        "margin-top": "20mm",
        "margin-bottom": "20mm"
    };

    gulp.src("resume.md")
        .pipe(gulpMarkdownIt(md))
        .pipe(pdf(wkHtmlOptions))
        .pipe(rename(OUTPUT_PDF))
        .pipe(gulp.dest("./"));
});

// For debugging
gulp.task('exportHtml', ['preWriteData'], () => {
    let options = {
        html: true
    };
    let md = new markdownIt('default', options);
    md.use(markdownInclude);

    gulp.src("resume.md")
        .pipe(gulpMarkdownIt(md))
        .pipe(rename(OUTPUT_HTML))
        .pipe(gulp.dest("./"));
});

gulp.task('upload', ['exportPdf'], () => {
    const s3Config = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };

    let s3Uploader = s3(s3Config);
    gulp.src(OUTPUT_PDF)
        .pipe(s3Uploader(
            {
                Bucket: process.env.S3_BUCKET,
                ACL: 'public-read'
            }, {
                maxRetries: 5
            })
        );
});

gulp.task('default', ['preWriteData', 'exportPdf']);
