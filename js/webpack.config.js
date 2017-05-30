/*
* @Author: CJ Ting
* @Date: 2016-11-04 13:38:40
* @Email: cj.ting@fugetech.com
*/

var path = require("path")
var webpack = require("webpack")

var env = process.env.NODE_ENV || "dev"

var devPlugins = []
var productionPlugins = [
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
    },
  })
]

module.exports = {
  entry: {
    desktop: "./desktop.js",
    mobile: "./mobile.js",
  },
  output: {
    path: path.join(__dirname, "..", "static", "js"),
    filename: "[name].bundle.js",
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: "style!css",
      },
    ],
  },
  plugins: env === "dev" ? devPlugins : productionPlugins,
}
