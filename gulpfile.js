const { src, dest, watch, series, parallel } = require("gulp");
const browserSync = require("browser-sync").create();
const sass = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer");
const cleanCSS = require("gulp-clean-css");
const sourcemaps = require("gulp-sourcemaps");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const svgSprite = require("gulp-svg-sprite");
const del = require("del");
const fileInclude = require("gulp-file-include");
const webpack = require("webpack-stream");
const cheerio = require("gulp-cheerio");
const replace = require("gulp-replace");
const svgmin = require("gulp-svgmin");
const filter = require("gulp-filter").default;
const path = require("path");

const paths = {
  html: "assets/src/*.html",
  scss: "assets/src/scss/main.scss",
  js: "assets/src/js/main.js",
  images: "assets/src/img/**/*.{jpg,jpeg,png}",
  svg: "assets/src/img/svg/**/*.sv",
  json: "assets/src/data/**/*.json",
  build: "dist/",
};

// clean
const clean = () => {
  return del(["dist/**", "!dist"], { force: true });
};

// html
const html = () =>
  src(paths.html)
    .pipe(
      fileInclude({
        prefix: "@@",
        basepath: "assets/src/template/",
      }),
    )
    .pipe(dest(paths.build))
    .pipe(browserSync.stream());

// styles
const styles = () =>
  src(paths.scss)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({ includePaths: ["node_modules"] }))
    .on("error", sass.logError)
    .pipe(autoprefixer())
    .pipe(cleanCSS({ level: 2 }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.build + "css"))
    .pipe(browserSync.stream());

// js
const scripts = () =>
  src(paths.js)
    .pipe(webpack({ mode: "production", output: { filename: "main.min.js" } }))
    .pipe(dest(paths.build + "js"))
    .pipe(browserSync.stream());

// images
const images = () =>
  src(paths.images)
    .pipe(imagemin())
    .pipe(dest(paths.build + "img"))
    .pipe(webp())
    .pipe(dest(paths.build + "img"));

// svg sprite
const svgFilter = filter(
  (file) => {
    return !file.contents.toString().includes('xlink:href="data:image');
  },
  { restore: true },
);

const sprite = () => {
  return src(paths.svg)
    .pipe(
      svgmin({
        plugins: [{ removeViewBox: false }],
        js2svg: { pretty: true },
      }),
    )
    .pipe(
      cheerio({
        run: function ($) {
          $("[fill]").removeAttr("fill");
          $("[stroke]").removeAttr("stroke");
          $("[style]").removeAttr("style");
        },
        parserOptions: { xmlMode: true },
      }),
    )
    .pipe(replace("&gt;", ">"))
    .pipe(
      svgSprite({
        shape: {
          id: {
            generator: (name) => `icon-${path.basename(name, ".svg")}`,
          },
        },
        mode: {
          symbol: {
            dest: ".",
            sprite: "symbol/sprite.svg",
            render: {
              html: {
                // Path to the file we just created
                template: path.resolve(__dirname, "sprite-template.html"),
                dest: "sprite.html",
              },
            },
          },
        },
      }),
    )
    .pipe(dest(paths.build));
};

const jsonCopy = () => {
  return src(paths.json).pipe(dest(paths.build + "data"));
};

const svgCopy = () => {
  return src([
    "assets/src/img/**/*.svg",
    "!assets/src/img/svg/icons/*.svg",
  ]).pipe(dest(paths.build + "img"));
};

// server
const serve = () => {
  browserSync.init({
    server: {
      baseDir: paths.build,
    },
    notify: false,
  });

  watch("assets/src/**/*.html", html);
  watch("assets/src/scss/**/*.scss", styles);
  watch("assets/src/js/**/*.js", scripts);
  watch(paths.images, images);
};

exports.default = series(
  clean,
  parallel(html, styles, scripts, images, svgCopy, jsonCopy),
  serve,
);

exports.build = series(
  clean,
  parallel(html, styles, scripts, images, svgCopy, jsonCopy),
);
