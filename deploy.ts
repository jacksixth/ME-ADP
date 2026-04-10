/*
 * @Author: jack
 * @Date: 2024-01-23 10:10
 * @LastEditors: jack
 * @LastEditTime: 2025-06-16 17:25
 * @Description: 自动化部署前端文件至服务器
 */

import * as ssh from "ssh2"
import * as compress from "compressing"
import ora from "ora"
import * as fs from "fs"
import * as readLine from "readline"
import { promisify } from "util"

// 将回调风格的函数转换为 Promise 风格
const accessAsync = promisify(fs.access)
const readdirAsync = promisify(fs.readdir)
const statAsync = promisify(fs.stat)
const unlinkAsync = promisify(fs.unlink)
const rmdirAsync = promisify(fs.rmdir)

const DEFAULT_CONFIG_TEMPLATE = `/**
 * 最终会在服务器端形成这样的结构
 * uploadPath/                                       这里是·uploadPath·
 * |    |-- fileName/                                 这里是·fileName· 底下是解压出来的文件
 * |    |     |--js                             
 * |    |     |--img
 * |    |     |--index.html
 * |    |     |--favicon.ico
 */
module.exports = [
  {
    name: '',//服务器名   用于区分多个服务器
    server: {
      host: '', // 服务器 host 
      port: 22, // 服务器 port
      username: '', // 服务器用户名
      password: '', // 服务器密码
    },
    uploadPath: '/usr/share/nginx/html',//服务器部署路径
    zipSource: './dist',//  打包源文件  放在根目录的有zipSource文件夹会默认打包 仅有文件夹没有压缩包才压缩文件夹
    zipFileName: 'dist.zip', //  打包后名称 放在根目录的有zipFileName文件夹直接上传 存在压缩包就会直接用压缩包
    fileName: '',//部署上去的文件夹名 --- nginx配置里的root读取的文件夹
    delFile: true, //部署完成后是否删除文件
  },
];`

interface ServerConfig {
  name: string
  server: {
    host: string
    port: number
    username: string
    password?: string
    privateKey?: string
  }
  uploadPath: string
  zipSource: string
  zipFileName: string
  fileName: string
  delFile: boolean
}

interface DeploymentContext {
  server: ServerConfig["server"]
  uploadPath: string
  zipSource: string
  zipFileName: string
  fileName: string
  delFile: boolean
}

let serverInfo: ServerConfig[] | null = null
let rl: readLine.Interface | null = null
let sshClient: ssh.Client | null = null
let deploymentStartTime: number = 0

/**
 * 加载服务器配置信息
 */
async function loadServerInfo(): Promise<void> {
  try {
    // 清除 require 缓存，确保获取最新配置
    delete require.cache[require.resolve("./serverInfo.js")]
    serverInfo = require("./serverInfo.js")
    
    if (!Array.isArray(serverInfo) || serverInfo.length === 0) {
      throw new Error("serverInfo.js 必须导出一个非空数组")
    }
  } catch (error) {
    console.error(
      "❌ 加载 serverInfo.js 失败，正在使用默认配置创建 serverInfo.js"
    )
    console.error("请填写配置后重新运行\n")
    fs.writeFileSync("./serverInfo.js", DEFAULT_CONFIG_TEMPLATE, "utf-8")
    process.exit(1)
  }
}

/**
 * 初始化 readline 接口
 */
function initReadline(): void {
  rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

/**
 * 关闭 readline 接口
 */
function closeReadline(): void {
  if (rl) {
    rl.close()
    rl = null
  }
}

/**
 * 选择服务器配置
 */
async function selectServerInfo(): Promise<DeploymentContext | null> {
  if (!serverInfo) {
    console.error("❌ 服务器配置未加载")
    return null
  }

  const serverList = serverInfo.map((config) => config.name)
  
  console.log("\n📋 可用的服务器列表：")
  serverList.forEach((name, index) => {
    console.log(`  [${index + 1}] ${name}`)
  })
  console.log(`  [0] 退出\n`)

  return new Promise((resolve) => {
    if (!rl) {
      resolve(null)
      return
    }

    rl.question("请选择要部署的服务器（输入编号，0 退出）：", (input) => {
      const index = parseInt(input.trim(), 10)

      if (isNaN(index) || index < 0 || index > serverList.length) {
        console.log("❌ 输入无效，请重新选择\n")
        selectServerInfo().then(resolve)
        return
      }

      if (index === 0) {
        console.log("👋 已取消部署")
        closeReadline()
        process.exit(0)
      }

      const config = serverInfo![index - 1]
      console.log(`✅ 已选择服务器：${config.name} (${config.server.host})\n`)
      
      resolve({
        server: config.server,
        uploadPath: config.uploadPath,
        zipSource: config.zipSource,
        zipFileName: config.zipFileName,
        fileName: config.fileName,
        delFile: config.delFile,
      })
    })
  })
}

/**
 * 从命令行参数获取服务器配置
 */
function getServerFromArgs(args: string[]): DeploymentContext | null {
  if (!serverInfo) {
    console.error("❌ 服务器配置未加载")
    return null
  }

  if (args.length !== 1) {
    return null
  }

  const index = parseInt(args[0], 10) - 1

  if (isNaN(index) || index < 0 || index >= serverInfo.length) {
    console.error(`❌ 无效的服务器索引：${args[0]}，有效范围：1-${serverInfo.length}`)
    process.exit(1)
  }

  const config = serverInfo[index]
  console.log(`✅ 已选择服务器：${config.name} (${config.server.host})\n`)

  return {
    server: config.server,
    uploadPath: config.uploadPath,
    zipSource: config.zipSource,
    zipFileName: config.zipFileName,
    fileName: config.fileName,
    delFile: config.delFile,
  }
}

/**
 * 检查源文件夹是否存在
 */
async function checkSourceFolder(zipSource: string): Promise<boolean> {
  const spinner = ora(`检查源文件夹：${zipSource}`).start()
  
  try {
    await accessAsync(zipSource, fs.constants.F_OK)
    spinner.succeed("✅ 源文件夹存在")
    return true
  } catch {
    spinner.fail(`❌ 源文件夹不存在：${zipSource}`)
    return false
  }
}

/**
 * 检查压缩包是否存在
 */
async function checkZipFile(zipFileName: string): Promise<boolean> {
  const spinner = ora(`检查压缩包：${zipFileName}`).start()
  
  try {
    await accessAsync(zipFileName, fs.constants.F_OK)
    spinner.succeed("✅ 压缩包存在")
    return true
  } catch {
    spinner.fail(`❌ 压缩包不存在：${zipFileName}`)
    return false
  }
}

/**
 * 压缩文件夹
 */
async function compressFolder(zipSource: string, zipFileName: string): Promise<boolean> {
  const spinner = ora("正在压缩文件...").start()
  
  try {
    await compress.zip.compressDir(zipSource, zipFileName, {
      zipFileNameEncoding: "gbk",
      ignoreBase: true, // 压缩包内不需要再包一层
    })
    spinner.succeed("✅ 压缩完成")
    return true
  } catch (error) {
    spinner.fail(`❌ 压缩失败：${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

/**
 * 连接到 SSH 服务器
 */
function connectToServer(server: ServerConfig["server"]): Promise<ssh.Client> {
  return new Promise((resolve, reject) => {
    const client = new ssh.Client()
    
    client
      .on("ready", () => {
        console.log("✅ SSH 连接成功")
        resolve(client)
      })
      .on("error", (err) => {
        reject(new Error(`SSH 连接失败：${err.message}`))
      })
      .connect(server)
  })
}

/**
 * 上传文件到服务器
 */
async function uploadFile(
  client: ssh.Client,
  localPath: string,
  remotePath: string
): Promise<void> {
  const spinner = ora("正在上传文件...").start()
  
  return new Promise((resolve, reject) => {
    client.sftp((err, sftp) => {
      if (err) {
        spinner.fail(`❌ SFTP 连接失败：${err.message}`)
        reject(err)
        return
      }

      sftp.fastPut(localPath, remotePath, {}, (putErr) => {
        if (putErr) {
          spinner.fail(`❌ 文件上传失败：${putErr.message}`)
          reject(putErr)
        } else {
          spinner.succeed("✅ 文件上传成功")
          resolve()
        }
      })
    })
  })
}

/**
 * 在服务器上执行命令
 */
function executeCommand(
  client: ssh.Client,
  command: string,
  description: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    client.exec(command, (err, stream) => {
      if (err) {
        reject(err)
        return
      }

      let stdout = ""
      let stderr = ""

      stream
        .on("close", (code: number, signal: string) => {
          if (code !== 0) {
            reject(new Error(`命令执行失败（退出码：${code}）：${stderr}`))
          } else {
            resolve(stdout)
          }
        })
        .on("data", (data: Buffer) => {
          stdout += data.toString()
        })
        .stderr.on("data", (data: Buffer) => {
          stderr += data.toString()
        })
    })
  })
}

/**
 * 在服务器上部署文件
 */
async function deployOnServer(
  client: ssh.Client,
  context: DeploymentContext
): Promise<void> {
  const { uploadPath, zipFileName, fileName } = context
  
  // 检查 unzip 命令是否可用
  const checkSpinner = ora("检查服务器环境...").start()
  try {
    await executeCommand(client, "unzip -v", "检查 unzip 命令")
    checkSpinner.succeed("✅ 服务器环境检查通过")
  } catch (error) {
    checkSpinner.fail("❌ 服务器缺少 unzip 命令，请先安装")
    throw new Error("服务器未安装 unzip 命令")
  }

  // 执行部署命令
  const deploySpinner = ora("正在部署文件...").start()
  const deployCommands = `
    cd ${uploadPath} && \
    rm -rf ${fileName}_bak && \
    mv -f ${fileName} ${fileName}_bak && \
    unzip -o ${zipFileName} -d ./${fileName} && \
    rm -f ${zipFileName}
  `

  try {
    await executeCommand(client, deployCommands, "部署文件")
    deploySpinner.succeed("✅ 文件部署成功")
  } catch (error) {
    deploySpinner.fail(`❌ 部署失败：${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

/**
 * 清理本地文件
 */
async function cleanupLocalFiles(
  zipSource: string,
  zipFileName: string,
  delFile: boolean
): Promise<void> {
  if (!delFile) {
    return
  }

  try {
    // 删除源文件夹
    if (fs.existsSync(zipSource)) {
      await deleteDirectory(zipSource)
      console.log(`✅ 已删除源文件夹：${zipSource}`)
    }

    // 删除压缩包
    if (fs.existsSync(zipFileName)) {
      await unlinkAsync(zipFileName)
      console.log(`✅ 已删除压缩包：${zipFileName}`)
    }
  } catch (error) {
    console.warn(`⚠️  清理文件时出错：${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 递归删除目录
 */
async function deleteDirectory(dirPath: string): Promise<void> {
  const files = await readdirAsync(dirPath)
  
  await Promise.all(
    files.map(async (file) => {
      const filePath = `${dirPath}/${file}`
      const stats = await statAsync(filePath)
      
      if (stats.isDirectory()) {
        await deleteDirectory(filePath)
      } else {
        await unlinkAsync(filePath)
      }
    })
  )
  
  await rmdirAsync(dirPath)
}

/**
 * 主部署流程
 */
async function main(context: DeploymentContext): Promise<void> {
  deploymentStartTime = Date.now()
  const { server, zipSource, zipFileName, delFile } = context

  try {
    // 1. 检查文件
    const hasSourceFolder = await checkSourceFolder(zipSource)
    const hasZipFile = await checkZipFile(zipFileName)

    if (!hasSourceFolder && !hasZipFile) {
      console.error("❌ 既没有源文件夹也没有压缩包，无法部署")
      process.exit(1)
    }

    // 2. 如果没有压缩包但有源文件夹，则压缩
    let finalZipFile = zipFileName
    if (!hasZipFile && hasSourceFolder) {
      const compressSuccess = await compressFolder(zipSource, zipFileName)
      if (!compressSuccess) {
        process.exit(1)
      }
    }

    // 3. 连接服务器并上传
    sshClient = await connectToServer(server)
    
    const remotePath = `${context.uploadPath}/${finalZipFile}`
    await uploadFile(sshClient, finalZipFile, remotePath)

    // 4. 在服务器上部署
    await deployOnServer(sshClient, context)

    // 5. 关闭 SSH 连接
    if (sshClient) {
      sshClient.end()
      sshClient = null
    }

    // 6. 清理本地文件
    await cleanupLocalFiles(zipSource, zipFileName, delFile)

    // 7. 显示耗时
    const elapsed = Date.now() - deploymentStartTime
    console.log(`\n🎉 部署完成！总耗时：${elapsed}ms`)
  } catch (error) {
    console.error(`\n❌ 部署失败：${error instanceof Error ? error.message : String(error)}`)
    
    // 确保关闭 SSH 连接
    if (sshClient) {
      sshClient.end()
      sshClient = null
    }
    
    process.exit(1)
  }
}

/**
 * 初始化并启动部署
 */
async function init(): Promise<void> {
  await loadServerInfo()
  initReadline()

  const args = process.argv.slice(2)
  let context: DeploymentContext | null = null

  // 优先从命令行参数获取配置
  if (args.length > 0) {
    context = getServerFromArgs(args)
  }

  // 如果没有命令行参数，则交互式选择
  if (!context) {
    context = await selectServerInfo()
  }

  if (!context) {
    console.error("❌ 未能获取有效的服务器配置")
    closeReadline()
    process.exit(1)
  }

  // 开始部署
  await main(context)
  closeReadline()
}

// 启动程序
init().catch((error) => {
  console.error("❌ 未捕获的错误：", error)
  closeReadline()
  process.exit(1)
})
