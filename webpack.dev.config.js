const config = require('./webpack.config.js')

// 开发模式配置
const devConfig = config.map((cfg) => ({
  ...cfg,
  mode: 'development',
  devtool: 'inline-source-map',
  watch: true,
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300, // 延迟 300ms 后再构建
    poll: 1000 // 每秒检查一次文件变化
  }
}))

module.exports = devConfig
