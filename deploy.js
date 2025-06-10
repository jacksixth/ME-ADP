/*
 * @Author: jack
 * @Date: 2024-01-23 10:10
 * @LastEditors: jack
 * @LastEditTime: 2025-06-10 13:49
 * @Description: 自动化部署前端文件至服务器
 */

import ssh from "ssh2"
import compress from "compressing"
import ora from "ora"
import * as fs from "fs"
import readLine from 'readline'
import path from "path"
const def = `/**
 * 最终会在服务器端形成这样的结构
 * uploadPath/                                       这里是·uploadPath·
 * |    |-- fileName/                                 这里是·fileName· 底下是解压出来的文件
 * |    |     |--js                             
 * |    |     |--img
 * |    |     |--index.html
 * |    |     |--favicon.ico
 */
export default [
  {
    name: '',//服务器名   用于区分多个服务器
    server: {
      host: '', // 服务器 host 
      port: 22, // 服务器 port
      username: '', // 服务器用户名
      password: '', // 服务器密码
    },
    uploadPath: '/usr/share/nginx/html',//服务器部署路径
    zipSource: './dist',//  打包源文件  放在根目录的有zipSource文件夹会默认打包
    zipFileName: 'dist.zip', //  打包后名称 放在根目录的有zipFileName文件夹直接上传
    fileName: '',//部署上去的文件夹名 --- nginx配置里的root读取的文件夹
  },
];`;

//serverInfo 动态导入 并在找不到时使用serverInfo.js.default的内容创建
let serverInfo = null
async function loadServerInfo() {
  try {
    const serverInfoModule = await import('./serverInfo.js');
    serverInfo = serverInfoModule.default; // 假设导出的是默认导出
  } catch (error) {
    console.error("加载 serverInfo.js 失败,正在使用默认配置创建serverInfo.js,请填写配置后重新运行");
    fs.writeFileSync('./serverInfo.js', def)
    process.exit(1);
  }
}

let rl = readLine.createInterface({
  input: process.stdin,
  output: process.stdout,
})
let server, uploadPath, zipSource, zipFileName, fileName //服务器信息
const checkPath1 = ora(`正在检查是否存在${zipSource}文件夹`)
const checkPath2 = ora(`正在检查是否存在${zipFileName}压缩包`)
const pkg = ora("正在对文件进行压缩")
const deploySpinner = ora("部署开始")
let sshClient = new ssh.Client()
let start = new Date()
var args = process.argv.splice(2)
const init = async () => {
  await loadServerInfo()
  if (args.length == 1) {
    // 如果命令行参数有传入服务器信息，则直接使用
    const index = parseInt(args[0]) - 1
    if (index >= 0 && index < serverInfo.length) {
      server = serverInfo[index].server
      uploadPath = serverInfo[index].uploadPath
      zipSource = serverInfo[index].zipSource
      zipFileName = serverInfo[index].zipFileName
      fileName = serverInfo[index].fileName
      console.log('当前连接的服务器IP是：' + server.host);
      main()
    } else {
      console.error("无效的服务器索引，请重新选择！");
      process.exit(1);
    }
  } else if (args.length > 1) {
    console.error("参数错误，请只输入一个服务器索引！");
    process.exit(1);
  } else {
    // 如果没有传入参数，则选择服务器
    selectServerInfo()
  }
}
function selectServerInfo() {
  const serverList = serverInfo.map(server => server.name)
  serverList.forEach((item, index) => {
    console.log(`[${index + 1}] ${item}`);
  });
  console.log(`[0] 退出`);
  rl.question('需要部署到哪一台服务器?（输入0或直接ctrl+c退出） ', (index) => {
    if (index && index == 0) {
      rl.close();
    }
    else if (index) {
      if (index > serverList.length || index < 0) {
        console.log('输入错误,请重新输入');
        selectServerInfo()
        return
      }
      server = serverInfo[index - 1].server
      uploadPath = serverInfo[index - 1].uploadPath
      zipSource = serverInfo[index - 1].zipSource
      zipFileName = serverInfo[index - 1].zipFileName
      fileName = serverInfo[index - 1].fileName
      console.log('当前连接的服务器IP是：' + server.host);
      main()
    }
  });
}

async function main() {
  const hasFile = await checkFile()
  const hasZip = await checkZipFile(hasFile)
  //存在压缩包就会直接用压缩包 - 有些项目有加build完自动压缩
  if (hasZip) {
    deploySpinner.start()
    await uploadFile()
  }
  //仅有文件夹没有压缩包才压缩文件夹
  else if (hasFile && !hasZip) {
    const compress = await compressFiles()
    if (compress) {
      deploySpinner.start()
      await uploadFile()
    }
  }

  if (hasFile) {
    deleteDir(zipSource)
  }
  if (hasFile || hasZip) fs.unlinkSync(zipFileName)
}

function checkFile() {
  return new Promise((resolve) => {
    checkPath1.start()
    fs.access(zipSource, fs.constants.F_OK, (err) => {
      if (err) {
        checkPath1.fail("不存在" + zipSource + "文件夹")
        resolve(false)
      } else {
        checkPath1.succeed("文件夹存在")
        resolve(true)
      }
    })
  })
}

function checkZipFile(hasFile = false) {
  return new Promise((resolve) => {
    checkPath2.start()
    fs.access(zipFileName, fs.constants.F_OK, (err) => {
      if (err) {
        checkPath2.fail(
          "不存在" + zipFileName + "压缩包，"
        )
        if (hasFile) {
          checkPath2.succeed("存在" + zipSource + "即将开始压缩并上传！")
        } else {
          checkPath2.fail("无法进行部署")
        }
        checkPath2.clear()
        resolve(false)
      } else {
        checkPath2.succeed("存在压缩包")
        resolve(true)
      }
    })
  })
}

function compressFiles() {
  return new Promise((resolve) => {
    // 对文件进行压缩打包
    pkg.start()
    const zipFile = (zipSource, zipFileName) => {
      return compress.zip.compressDir(zipSource, zipFileName, {
        zipFileNameEncoding: "gbk",
        ignoreBase: true, //压缩包内不需要再包一层
      })
    }
    zipFile(zipSource, zipFileName).then(async () => {
      pkg.succeed("生成压缩文件成功")
      return resolve(true)
    })
  })
}
// 利用 sftp 方法上传文件
function uploadFile() {
  return new Promise((resolve) => {
    sshClient
      .on("ready", () => {
        deploySpinner.text = "服务器已连接,正在上传文件......"
        sshClient.sftp((err, sftp) => {
          sftp.fastPut(
            zipFileName, // 本地文件路径
            `${uploadPath}/${zipFileName}`, // 上传到目标服务器的路径
            {},
            (err, result) => {
              resolve(deploy(sshClient))
            }
          )
        })
      })
      .on("error", () => {
        deploySpinner.fail("服务器连接失败，请检查服务器配置参数是否正确！")
      })
      .connect(server)
  })
}

function deploy(sshClient) {
  return new Promise((resolve) => {
    deploySpinner.text = "文件上传成功！"
    const testUnzip = ora("测试是否有unzip命令")
    testUnzip.start()
    sshClient.exec("unzip -v", (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
      }).on('data', (data) => {
        testUnzip.succeed("服务器有unzip命令，开始部署!")
        testUnzip.stop()
      }).stderr.on('data', (data) => {
        if (data.indexOf('unzip: command not found')) {
          testUnzip.fail("服务器没有unzip命令，请安装unzip命令！")
          process.exit(1)
        }
      });
    })
    sshClient.shell((err, stream) => {
      stream
        // 执行命令，删除上一个备份，对当前的备份，解压最新代码
        .end(
          `
          cd ${uploadPath}
          rm -rf ${fileName}_bak
          mv -f ${fileName} ${fileName}_bak
          unzip ${zipFileName} -d ./${fileName}
          rm -f ${zipFileName}
          exit
          `
        )
        .on("data", (data) => { })
        .on("close", () => {
          sshClient.end()
          let end = new Date()
          deploySpinner.succeed(`部署完成，耗时${end - start}ms`)
          resolve(true)
        })
    })
  })
}

function deleteDir(url) {
  var files = []
  if (fs.existsSync(url)) {
    //判断给定的路径是否存在
    files = fs.readdirSync(url) //返回文件和子目录的数组
    files.forEach(function (file, index) {
      const path = `${url}/${file}`
      if (fs.statSync(path).isDirectory()) {
        //同步读取文件夹文件，如果是文件夹，则函数回调
        deleteDir(path)
      } else {
        fs.unlinkSync(path)
      }
    })
    fs.rmdirSync(url) //清除文件夹
  } else {
    console.log("给定的路径不存在！")
  }
}

init()
