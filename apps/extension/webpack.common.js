const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');
dotenv.config();

// Debug environment variables
console.log('🔍 Environment variables check:');
console.log('OPEN_WEATHER_API_KEY:', process.env.OPEN_WEATHER_API_KEY ? '✅ Found' : '❌ Not found');
console.log('OPEN_WEATHER_API_KEYS:', process.env.OPEN_WEATHER_API_KEYS ? '✅ Found' : '❌ Not found');

// Ensure environment variables are properly loaded
const apiKey = process.env.OPEN_WEATHER_API_KEY || '';
const apiKeys = process.env.OPEN_WEATHER_API_KEYS || '';

console.log('🔑 API Key length:', apiKey.length);
console.log('🔑 API Keys length:', apiKeys.length);

module.exports = {
  entry: {
    popup: path.resolve('src/popup/popup.tsx'),
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
        use: ['style-loader', 'css-loader'],
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

    ...getHtmlPlugins(['popup', 'options']),
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
};

function getHtmlPlugins(chunks) {
  return chunks.map(
    (chunk) =>
      new HtmlPlugin({
        title: 'React Extension',
        filename: `${chunk}.html`,
        chunks: [chunk],
      })
  );
}
