'use strict';

const del = require('del');
const gulp = require('gulp');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const posthtml = require("gulp-posthtml");
const include = require("posthtml-include");
const autoprefixer = require('autoprefixer');
const server = require('browser-sync').create();
const mqpacker = require('css-mqpacker');
const minify = require('gulp-csso');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const imageminWebp = require('imagemin-webp');
const rollup = require('gulp-better-rollup');
const sourcemaps = require('gulp-sourcemaps');
const spritesmith = require('gulp.spritesmith');
const merge = require('merge-stream');
const svgstore = require('gulp-svgstore');
const sortCSSmq = require('sort-css-media-queries');
const svgmin = require('gulp-svgmin');
const uglify = require('gulp-uglify');
const webpcss = require("gulp-webpcss");
const path = require("path");

gulp.task('style', function () {
  gulp.src('sass/style.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer({
        browsers: [
          'last 1 version',
          'last 2 Chrome versions',
          'last 2 Firefox versions',
          'last 2 Opera versions',
          'last 2 Edge versions'
        ]
      }),
      mqpacker({
        sort: sortCSSmq.desktopFirst
      })
    ]))
    .pipe(webpcss({
      noWebpClass: ".no-webp",
      }))
    .pipe(gulp.dest('build/css'))
    .pipe(minify())
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream());
});

gulp.task('sprite', ['svgSprite'], function () {
    // Generate PNG sprite
    var spriteData = gulp.src('img/icons/*.png').pipe(spritesmith({
        imgName: 'sprite.png',
        imgPath: '../img/sprite.png',
        padding: 10,
        cssName: 'sprite.scss',

    }));
    var imgStream = spriteData.img
    .pipe(gulp.dest('img/'));

    var cssStream = spriteData.css
        .pipe(gulp.dest('sass/'));

    return merge(imgStream, cssStream);
});

gulp.task('svgSprite', function () {
  return gulp.src('img/icons/*.svg')
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(svgmin(function getOptions (file) {
      var prefix = path.basename(file.relative, path.extname(file.relative));
      return {
        plugins: [{
          cleanupIDs: {
            prefix: prefix + '-',
            minify: true
          }
        }]
      }
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('img/'))
});

gulp.task('scripts', function () {
  return gulp.src('js/main.js')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(rollup({}, 'iife'))
    .pipe(sourcemaps.write(''))
    .pipe(gulp.dest('build/js'))
    .pipe(uglify())
    .pipe(rename('main.min.js'))
    .pipe(gulp.dest('build/js'))
});
gulp.task('convertWebp', function () {
  return gulp.src('img/**/*.{jpg,png}')
    .pipe(imagemin([
      imageminWebp({quality: 70}),
    ]))
    .pipe(rename({ extname: '.webp' }))
    .pipe(gulp.dest('img/'));
  })

gulp.task('imagemin', function () {
  return gulp.src('img/**/*.{jpg,png,gif,webp}')
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
    ]))
    .pipe(gulp.dest('img/'));
});


gulp.task('copy-html', function () {
  return gulp.src('*.html')
    .pipe(posthtml([
      include()
    ]))
    .pipe(gulp.dest("build"))
    .pipe(server.stream());
});

gulp.task('webp', () =>
  gulp.src('img/*.{jpg,png}')
    .pipe(webp())
    .pipe(gulp.dest('build/img'))
);

gulp.task('copy', ['copy-html', 'scripts', 'style'], function () {
  return gulp.src([
    'fonts/**/*.{woff,woff2}',
    'img/*.*',
    'js/jquery/**',
    './*.png',
    './*.svg',
    './*.webmanifest',
    './browserconfig.xml',
  ], {base: '.'})
    .pipe(gulp.dest('build'));
});

gulp.task('clean', function () {
  return del('build');
});

gulp.task('js-watch', ['scripts'], function (done) {
  done();
});

gulp.task('serve', ['assemble'], function () {
  server.init({
    server: './build',
    notify: true,
    open: true,
    port: 3502,
    ui: false
  });

  gulp.watch('sass/**/*.scss', ['style']);
  gulp.watch('**/*.html', ['copy-html']);
  gulp.watch('js/**/*.js', ['js-watch']);
});

gulp.task('assemble', ['sprite'], /*['clean'],*/ function () {
  gulp.start('copy');
});

