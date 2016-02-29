var source = require("vinyl-source-stream");
var gulp = require("gulp");
var browserify = require("browserify");
var notify = require("gulp-notify");
var sass = require("gulp-sass");
var livereload = require("gulp-livereload");
var nodemon = require("gulp-nodemon");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var gulpFilter = require("gulp-filter");
var mainBowerFiles = require("main-bower-files");

function handleErrors() {
  var args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: "Compile Error",
    message: "<%= error.message %>"
  }).apply(this, args);
  this.emit("end"); // Keep gulp from hanging on this task
}

//convert jsx to js
gulp.task("browserify", function() {
  browserify({
      entries: "./client/app.js",
      debug: true
    })
    .transform("babelify", {
      "plugins": ["transform-decorators-legacy"],
      "presets": ["react", "es2015"]
    })
    .bundle()
    .on("error", handleErrors)
    .pipe(source("bundle.js"))
    .pipe(gulp.dest("./public/assets"));
});

//watch js files
gulp.task("browserify:watch", function() {
  gulp.watch("./client/**/*.js", ["browserify"]);
});

//convert scss to css
gulp.task("sass", function() {
  return gulp.src([
      "./assets/scss/importer.scss",
      "./assets/mdi-icons/materialdesignicons.css"
    ])
    .pipe(sass().on("error", handleErrors))
    .pipe(concat("style.css"))
    .pipe(gulp.dest("./public/assets"));
});

//watch scss files
gulp.task("sass:watch", function() {
  gulp.watch("./assets/scss/**/*.scss", ["sass"]);
});

gulp.task("bower:js", function() {
  gulp.src(mainBowerFiles())
    .pipe(gulpFilter("*.js"))
    .pipe(concat("bower.js"))
    .pipe(uglify())
    .pipe(gulp.dest("public/assets"));
});

gulp.task("bower:css", function() {
  gulp.src(mainBowerFiles())
    .pipe(gulpFilter("*.css"))
    .pipe(concat("bower.css"))
    .pipe(gulp.dest("public/assets"));
});

gulp.task("js", function() {
  gulp.src(["./assets/js/**/*"])
    .pipe(concat("main.js"))
    .pipe(gulp.dest("public/assets"));
});

gulp.task("copy:fonts", function() {
  gulp.src(["assets/fonts/**/*"], {
      base: "assets"
    })
    .pipe(gulp.dest("public/assets"));
  gulp.src(["assets/mdi-icons/fonts/**/*"], {
      base: "assets/mdi-icons"
    })
    .pipe(gulp.dest("public/assets"));
});

gulp.task("copy:images", function() {
  gulp.src(["assets/images/**/*"], {
      base: "assets"
    })
    .pipe(gulp.dest("public/assets"));
});

// Start server
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
      .pipe(livereload())
      .pipe(notify("Reloading page, please wait..."));
  });
});

gulp.task("default", [
  "bower:js",
  "bower:css",
  "browserify",
  "sass",
  "js",
  "copy:fonts",
  "copy:images",
  "browserify:watch",
  "sass:watch",
  "server"
]);
