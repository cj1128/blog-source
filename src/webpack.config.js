const path = require("path")
const yaml = require("js-yaml")
const fs = require("fs")
const url = require("url")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

const hugoConfig = yaml.safeLoad(fs.readFileSync("../config.yaml", "utf8"))
const basePath = url.parse(hugoConfig.baseURL).path

module.exports = {
  entry: "./main.js",
  output: {
    path: path.join(__dirname, "..", "static", "asset"),
    publicPath: path.join(basePath, "/asset/"),
  },
  module: {
    rules: [
      {
        test: /\.styl$/,
        loader: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "stylus-loader",
        ],
      },
      {
        test: /\.css$/,
        loader: [
          MiniCssExtractPlugin.loader,
          "css-loader",
        ],
      },
      {
        test: /\.(woff|woff2|jpg|png|jpeg)$/,
        loader: "file-loader",
      }
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
  ],
}
