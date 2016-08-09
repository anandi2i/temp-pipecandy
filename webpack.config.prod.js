/**
 * Webpack configuration for production environment
 */
var webpack = require("webpack");
module.exports = {
  entry: [
    "./client/app.js",
  ],
  output: {
    path: __dirname + "/public/assets/",
    filename: "bundle.js"
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {warnings: false}
    }),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": "'production'"
    })
  ],
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
