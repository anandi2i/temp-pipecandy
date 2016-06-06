/**
 * Webpack configuration for production environment
 */
module.exports = {
  devtool: "#eval-source-map",
  entry: [
    "./client/app.js",
  ],
  output: {
    path: __dirname + "/public/assets/",
    filename: "bundle.js"
  },
  resolve: {
    extensions: ["", ".js", ".react.js"]
  },
  node: {
    dns: "empty",
    net: "empty"
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loaders: ["babel"],
      exclude: /node_modules/
    }]
  }
};
