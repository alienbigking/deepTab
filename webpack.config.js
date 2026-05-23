const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const fs = require('fs')

class VersionPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('VersionPlugin', () => {
      const outputPath = compiler.options.output.path

      // 获取当前版本号
      let currentVersion = '1.0.0' // 默认版本号
      const manifestPath = path.resolve(outputPath, 'manifest.json')
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        if (manifest.version) {
          currentVersion = manifest.version // 读取现有版本号
          console.log('当前版本号:', currentVersion)
        }
      }

      // 解析版本号并增加 patch 部分
      const versionParts = currentVersion.split('.')
      const patchVersion = parseInt(versionParts[2], 10) + 1 // 增加 patch 部分
      const newVersion = `2.0.${patchVersion}`

      // 更新 manifest.json 中的版本号
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        manifest.version = newVersion // 更新版本字段
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
        console.log('更新 manifest.json 文件为新版本:', newVersion)
      } else {
        console.warn('未找到 manifest.json 文件，跳过更新.')
      }

      // 生成 storage.js 文件，将最新版本号写入 chrome.storage.local
      const storageScript = `
        chrome.storage.local.set({ lastVersion: '${newVersion}' }, () => {
          console.log('版本号已更新到 storage.local: ${newVersion}');
        });
      `
      const storageFilePath = path.resolve(outputPath, 'storage.js')
      fs.writeFileSync(storageFilePath, storageScript, 'utf-8')
      console.log('生成 storage.js 文件:', storageFilePath)
    })
  }
}

module.exports = [
  // **Popup 页面的 Webpack 配置**
  {
    context: __dirname,
    target: 'web',
    devtool: 'source-map',
    entry: {
      popup: path.resolve(__dirname, './index.tsx'),
      newtab: path.resolve(__dirname, './newtab.tsx'),
      background: path.resolve(__dirname, './src/background/index.ts')
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: (pathData) =>
        pathData.chunk && pathData.chunk.name === 'background'
          ? 'extension/background/index.js'
          : '[name].js',
      clean: true
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      mainFields: ['browser', 'module', 'main'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [
      // new VersionPlugin(), // 添加 VersionPlugin
      new NodePolyfillPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'popup.html'),
        filename: 'popup.html',
        chunks: ['popup'],
        inject: 'body'
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'newtab.html'),
        filename: 'newtab.html',
        chunks: ['newtab'],
        inject: 'body'
      }),
      // Live reload can be reintroduced later if the extension development
      // workflow needs it. Production builds should not launch Chrome by default.
      new CopyPlugin({
        patterns: [
          {
            from: 'manifest.json',
            to: '.'
          },
          { from: 'src/assets', to: 'src/assets' }
        ]
      })
    ],
    module: {
      rules: [
        // 处理 TypeScript 和 React 组件
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: 'ts-loader'
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        // 处理 LESS 文件
        {
          test: /\.less$/,
          use: [
            'style-loader', // 将样式插入到页面中
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
                modules: {
                  namedExport: false,
                  localIdentName: '[name]__[local]__[hash:base64:6]'
                } // 启用 CSS Modules
              }
            },
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  strictMath: true // 启用严格数学运算
                }
              }
            }
          ]
        },
        // 处理图片文件
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'src/assets/images/[name][ext]'
          }
        }
      ]
    },
    devServer: {
      static: {
        directory: path.join(__dirname, './dist') // 指定静态文件目录
      },
      watchFiles: ['src/**/*', 'dist/**/*'], // 监听文件变化
      port: 3001, // 启动的端口号
      open: false, // 自动打开浏览器
      hot: false, // 启用热模块替换
      historyApiFallback: true, // 处理单页应用的 404 错误
      liveReload: true // 由 LiveReloadPlugin 负责刷新
    }
  }
]
