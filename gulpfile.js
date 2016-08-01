/**
 * Gulp to run automated tasks and bundling the files for dev/prod to use.
 *
 * @see http://codyburleson.com/2015/09/11/better-error-messages-from-gulp-using-gulp-util/
 * @see http://andrewhathaway.net/environment-based-configuration-for-javascript-applications/
 * @see https://knpuniversity.com/screencast/gulp/minify-only-production
 * @see https://css-tricks.com/gulp-for-beginners/
 */

var gulp = require("gulp");
var sass = require("gulp-sass");
var sassLint = require("gulp-sass-lint");
var livereload = require("gulp-livereload");
var nodemon = require("gulp-nodemon");
var concat = require("gulp-concat");
//var uglify = require("gulp-uglify");
var minifier = require("gulp-uglify/minifier");
var uglifyjs = require("uglify-js"); //ES6 support
var cssnano = require("gulp-cssnano");
var mainBowerFiles = require("main-bower-files");
var util = require("gulp-util");
var del = require("del");
var RunSequence = require("run-sequence");
var WebpackDevServer = require("webpack-dev-server");
var exec = require("gulp-exec");
var webpack = require("webpack");
var config = require("./webpack.config.dev");
var sassLintConfig = require("./.sass-lint.config");
var devPort = 3001;
var isProduction = !!util.env.production;

/**
 * Cleans the build directory
 */
gulp.task("clean", function(cb) {
  del.sync("./public/assets", cb);
});

gulp.task("sassLint", function () {
  return gulp.src("./assets/scss/**/style.s+(a|c)ss")
    .pipe(sassLint({
      rules: sassLintConfig
    }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError());
});

/**
 * Convert scss to css
 * Minfiy if it is production
 */
gulp.task("sass", function() {
  return gulp.src([
      "./assets/scss/importer.scss",
      "./assets/mdi-icons/materialdesignicons.css"
    ])
    .pipe(sass().on("error", util.log))
    .pipe(concat("style.css").on("error", util.log))
    .pipe(isProduction ? cssnano().on("error", util.log) : util.noop())
    .pipe(gulp.dest("./public/assets"));
});

/**
 * Watch for scss file changes and run sass task
 */
gulp.task("sass:watch", function() {
  return gulp.watch("./assets/scss/**/*.scss", ["sass"]);
});

/**
 * Bundle the js files of bower components
 */
gulp.task("bower:js", function() {
  return gulp.src(mainBowerFiles("**/*.js"))
    .pipe(concat("bower.js").on("error", util.log))
    // .pipe(uglify().on("error", util.log))
    .pipe(gulp.dest("./public/assets"));
});

/**
 * Bundle the css files of bower components
 */
gulp.task("bower:css", function() {
  return gulp.src(mainBowerFiles("**/*.css"))
    .pipe(concat("bower.css").on("error", util.log))
    .pipe(cssnano().on("error", util.log))
    .pipe(gulp.dest("./public/assets"));
});

/**
 * Bundle the common js files
 */

gulp.task("js", function() {
  return gulp.src(["./assets/js/**/*"])
    .pipe(concat("main.js").on("error", util.log))
    .pipe(isProduction ?
      minifier({}, uglifyjs).on("error", util.log) : util.noop())
    .pipe(gulp.dest("./public/assets"));
});

/**
 * Copy fonts to build folder
 */
gulp.task("copy:fonts", function() {
  return gulp.src([
      "./assets/fonts/**/*",
      "./assets/mdi-icons/fonts/**/*"
    ])
    .pipe(gulp.dest("./public/assets/fonts"));
});

/**
 * Copy images to build folder
 */
gulp.task("copy:images", function() {
  return gulp.src(["./assets/images/**/*"], {
      base: "assets"
    })
    .pipe(gulp.dest("./public/assets"));
});

/**
 * Copy tinymce bower component to build folder
 * @TODO Needs to use this as node module
 */
gulp.task("copy:tinymce", function() {
  return gulp.src(["./bower_components/tinymce/**/*"], {
      base: "bower_components"
    })
    .pipe(gulp.dest("./public/assets"));
});

/**
 * Copy index.html to public
 * Not for local
 */
gulp.task("copy:html", function() {
 return gulp.src(["./client/index.html"], {
     base: "client"
   })
   .pipe(gulp.dest("./public/assets"));
});

/**
 * Start the server if it is in development environment
 */
gulp.task("server", function() {
  // listen for changes
  livereload.listen();
  // configure nodemon
  nodemon({
    // the script to run the app
    script: "./server/server.js",
    ext: "js"
  }).on("restart", function() {
    // when the app has restarted, run livereload.
    gulp.src("./server/server.js")
      .pipe(livereload());
    util.log("Reloading page, please wait...");
  });
});

/**
 * Start the webpack dev server if it is in development mode
 */
gulp.task("webpack-dev-server", function() {
  var server = new WebpackDevServer(webpack(config), {
    // webpack-dev-server options
    publicPath: config.output.publicPath,
    cache: true,
    colors: true,
    hot: true,
    historyApiFallback: true,
    proxy: {
      "*": "http://localhost:3000"
    }
  });

  server.listen(devPort, "localhost", function(err) {
    if (err) {
      console.log(err);
    }
    console.log("Listening at localhost:3000");
  });
});

/**
 * Build the react components if it is not in development environment
 */
var exec = require("child_process").exec;
gulp.task("buildJsxInProd", function (cb) {
  exec("webpack --config webpack.config.prod.js", function(er, stdout, stderr) {
    console.log("\n Build chunks details... \n", stdout);
    if(stderr) util.log("Error in building JSX components...", stderr);
    cb(er);
  });
});

/**
 * Tasks to run in development environment
 */
gulp.task("default", function(cb) {
  RunSequence([
    "clean",
    "bower:js",
    "bower:css",
    "sass",
    "js",
    "copy:fonts",
    "copy:images",
    "copy:tinymce",
    "sass:watch",
    "server",
    "webpack-dev-server"
  ], cb);
});

/**
 * Tasks to run in production environment
 */
gulp.task("build", function(cb) {
  RunSequence([
    "clean",
    "bower:js",
    "bower:css",
    "sass",
    "js",
    "copy:fonts",
    "copy:images",
    "copy:tinymce",
    "copy:html",
    "buildJsxInProd"
  ], cb);
});
