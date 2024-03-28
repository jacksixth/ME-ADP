/*
 * @Author: ym + xcy
 * @Date: 2024-01-23 10:10
 * @LastEditors: xcy
 * @LastEditTime: 2024-03-28 14:09
 * @Description: 自动化部署前端文件至服务器
 */

import ssh from "ssh2"
import compress from "compressing"
import ora from "ora"
import * as fs from "fs"
import readLine from 'readline'
import serverInfo from "./serverInfo.js"
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

selectServerInfo()


function selectServerInfo() {
  const serverList = serverInfo.map(server => server.name)
  serverList.forEach((item, index) => {
    console.log(`[${index + 1}] ${item}`);
  })
  console.log(`[0] 退出`);
  rl.question('需要部署到哪一台服务器?（输入0或直接回车退出） ', (index) => {
    if (index && index == 0) {
      rl.close();
    }
    else if (index) {
      server = serverInfo[index - 1].server
      uploadPath = serverInfo[index - 1].uploadPath
      zipSource = serverInfo[index - 1].zipSource
      zipFileName = serverInfo[index - 1].zipFileName
      fileName = serverInfo[index - 1].fileName
      console.log('当前连接的服务器IP是：' + server.host);
      // 连接测试↓
      // testContent()
      main()
    }
    rl.close();
  });
}


async function main() {
  const hasFile = await checkFile()
  const hasZip = await checkZipFile()
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

function checkZipFile() {
  return new Promise((resolve) => {
    checkPath2.start()
    fs.access(zipFileName, fs.constants.F_OK, (err) => {
      if (err) {
        checkPath2.fail(
          "不存在" + zipFileName + "压缩包，请将压缩包放在项目根目录！"
        )
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
    deploySpinner.text = "文件上传成功！正在执行部署命令......"
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
//连接测试
function testContent() {
  const testContentOra = ora("连接开始")
  testContentOra.start()
  sshClient
    .on("ready", () => {
      testContentOra.succeed("服务器连接成功！")
      const testUnzip = ora("测试是否有unzip命令")
      testUnzip.start()
      sshClient.shell((err, stream) => {
        stream// 执行命令
          .end(
            `
            unzip -v
            exit
            `
          )
          .on("data", (data) => {
            console.log(data.toString());
          })
          .on("close", () => {
            sshClient.end()
            testUnzip.succeed(`命令发送完成，请查看是否存在command not found: unzip。若出现则服务器未安装unzip，请自行安装。`)
          })
      })

    })
    .on("error", () => {
      testContentOra.fail("服务器连接失败，请检查服务器配置参数是否正确！")
    })
    .connect(server)
}
