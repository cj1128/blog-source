const path = require("path")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

module.exports = {
  entry: "./main.js",
  output: {
    path: path.join(__dirname, "..", "static", "asset"),
    publicPath: "/asset/",
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
