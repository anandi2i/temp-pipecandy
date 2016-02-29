var WebpackDevServer = require("webpack-dev-server");
var webpack = require("webpack");
var config = require("./webpack.config.dev");
var defaultPort = 3001;

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

server.listen(defaultPort, "localhost", function (err) {
  if (err) {
    console.log(err);
  }
  console.log("Listening at localhost:3000");
});
