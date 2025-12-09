/**
 * 递归读取目录下所有文件，返回文件名+修改时间数组
 * @param dir 目录对象 (DirectoryEntry)
 * @returns Promise<string[]> 文件名+修改时间组成的数组
 */
const filesInDirectory = (dir: DirectoryEntry): Promise<string[]> =>
  new Promise((resolve) => {
    console.log('📂 正在读取目录内容...')
    dir.createReader().readEntries((entries) => {
      console.log(`🔹 读取到 ${entries.length} 个文件/目录项`)

      Promise.all(
        entries
          .filter((e) => e.name[0] !== '.') // 过滤隐藏文件
          .map((e) =>
            e.isDirectory
              ? filesInDirectory(e as DirectoryEntry) // 如果是目录递归读取
              : new Promise((resolve) =>
                  (e as FileEntry).file((file) => {
                    console.log(`📄 发现文件: ${file.name}, 修改时间: ${file.lastModifiedDate}`)
                    resolve(file.name + file.lastModifiedDate) // 拼接文件名和修改时间作为唯一标识
                  })
                )
          )
      )
        .then((files) => [].concat(...files)) // 展平嵌套数组
        .then((fileList) => {
          console.log(`✅ 目录内容解析完成，共 ${fileList.length} 个文件`)
          resolve(fileList)
        })
    })
  })

/**
 * 为目录生成时间戳字符串
 * 用于判断目录内容是否变化
 * @param dir 目录对象 (DirectoryEntry)
 * @returns Promise<string> 目录文件名+修改时间拼接成的字符串
 */
const timestampForFilesInDirectory = (dir: DirectoryEntry): Promise<string> =>
  filesInDirectory(dir).then((files) => {
    console.log('⏱ 生成目录文件的时间戳...')
    const timestamp = files.join()
    console.log(`📝 生成的时间戳: ${timestamp}`)
    return timestamp
  })

/**
 * 监控目录变更，实现热更新插件
 * @param dir 目录对象 (DirectoryEntry)
 * @param lastTimestamp 上一次生成的时间戳，用于比对变化
 */
const watchChanges = (dir: DirectoryEntry, lastTimestamp?: string) => {
  console.log('🔍 开始监控目录变更...')
  timestampForFilesInDirectory(dir).then((timestamp) => {
    if (!lastTimestamp) {
      console.log('ℹ️ 初次监控，记录当前时间戳:', timestamp)
    } else if (lastTimestamp === timestamp) {
      console.log('ℹ️ 目录未发生变化，继续监控...')
    } else {
      console.log('⚡ 检测到目录内容发生变化，重新加载插件...')
      chrome.runtime.reload() // 重载扩展
      console.log('✅ 插件已自动重载完成')
    }

    // 每秒重新检测一次目录
    setTimeout(() => watchChanges(dir, timestamp), 1000)
  })
}

// 导出 watchChanges 函数
export { watchChanges }
