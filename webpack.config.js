const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const { DotenvCmdWebpack } = require('dotenv-cmd-webpack');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const hasJsxRuntime = (() => {
  try {
    require.resolve('react/jsx-runtime');
    return true;
  } catch (e) {
    return false;
  }
})();

module.exports = function (_env, argv) {
  const isProduction = argv.nodeEnv === 'production';
  const isDevelopment = !isProduction;

  return {
    stats: 'errors-warnings',
    devtool: isDevelopment && 'cheap-module-source-map',
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'static/js/[name].[contenthash:8].js',
      publicPath: '/',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: require.resolve('babel-loader'),
            options: {
              customize: require.resolve('babel-preset-react-app/webpack-overrides'),
              presets: [
                [
                  require.resolve('babel-preset-react-app'),
                  {
                    runtime: hasJsxRuntime ? 'automatic' : 'classic',
                  },
                ],
              ],
              cacheDirectory: true,
              cacheCompression: false,
              envName: isProduction ? 'production' : 'development',
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : require.resolve('style-loader'),
            require.resolve('css-loader'),
          ],
        },
        {
          test: /\.(png|jpg|gif)$/i,
          use: {
            loader: require.resolve('url-loader'),
            options: {
              limit: 8192,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: require.resolve('@svgr/webpack'),
              options: {
                prettier: false,
                svgo: false,
                svgoConfig: {
                  plugins: [{ removeViewBox: false }],
                },
                titleProp: true,
                ref: true,
              },
            },
            {
              loader: require.resolve('file-loader'),
              options: {
                name: 'static/media/[name].[hash].[ext]',
              },
            },
          ],
          issuer: {
            and: [/\.(js|jsx)$/],
          },
        },
        {
          test: /\.(eot|otf|ttf|woff|woff2|mp3|wav)$/,
          loader: require.resolve('file-loader'),
          options: {
            name: 'static/media/[name].[hash:8].[ext]',
          },
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      modules: ['node_modules', resolveApp('node_modules')].concat(resolveApp('src') || []),
    },
    plugins: [
      new Dotenv(),
      new DotenvCmdWebpack({
        filePath: '.env-cmdrc.json',
        env: argv.env.platform,
      }),
      isProduction &&
        new MiniCssExtractPlugin({
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
        inject: true,
        favicon: path.resolve(__dirname, 'public/favicon.ico'),
      }),
    ].filter(Boolean),
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserWebpackPlugin({
          terserOptions: {
            compress: {
              comparisons: false,
            },
            mangle: {
              safari10: true,
            },
            output: {
              comments: false,
              ascii_only: true,
            },
            warnings: false,
          },
        }),
        new CssMinimizerPlugin(),
      ],
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        minSize: 0,
        maxInitialRequests: 20,
        maxAsyncRequests: 20,
        cacheGroups: {
          default: false,
        },
      },
    },
    devServer: {
      historyApiFallback: true,
      open: true,
      compress: true,
      hot: true,
      port: 3000,
      allowedHosts: 'all',
    },
  };
};
