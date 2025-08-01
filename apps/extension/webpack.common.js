const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');
dotenv.config();

// Ensure environment variables are properly loaded
const apiKey = process.env.OPEN_WEATHER_API_KEY || '';
const apiKeys = process.env.OPEN_WEATHER_API_KEYS || '';

module.exports = {
  entry: {
    popup: path.resolve('src/v2/popup/PopupApp.tsx'),
    options: path.resolve('src/options/options.tsx'),
    background: path.resolve('src/background/background.ts'),
    contentScript: path.resolve('src/contentScript/contentScript.tsx'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [require('tailwindcss'), require('autoprefixer')],
              },
            },
          },
        ],
      },
      {
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/static'),
          to: path.resolve('dist'),
        },
      ],
    }),

    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.OPEN_WEATHER_API_KEY': JSON.stringify(apiKey),
      'process.env.OPEN_WEATHER_API_KEYS': JSON.stringify(apiKeys),
    }),

    new HtmlPlugin({
      title: 'Weather Extension',
      filename: 'popup.html',
      template: path.resolve('src/v2/popup/popup.html'),
      chunks: ['popup'],
    }),
    new HtmlPlugin({
      title: 'React Extension',
      filename: 'options.html',
      chunks: ['options'],
    }),
  ],
  output: {
    filename: '[name].js',
    path: path.resolve('dist'),
  },
  optimization: {
    splitChunks: {
      chunks(chunk) {
        return chunk.name !== 'contentScript' && chunk.name !== 'background';
      },
    },
  },
  // Exclude v1 files from build
  externals: {
    '../v1/components/WeatherCard': 'commonjs2 ../v1/components/WeatherCard',
    '../v1/popup/popup': 'commonjs2 ../v1/popup/popup',
  },
};
