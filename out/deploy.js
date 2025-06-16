"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// serverInfo.js
var serverInfo_exports = {};
__export(serverInfo_exports, {
  default: () => serverInfo_default
});
var serverInfo_default;
var init_serverInfo = __esm({
  "serverInfo.js"() {
    serverInfo_default = [
      {
        name: "\u4E2D\u6CB9\u53A6\u95E8\u73AF\u5883",
        //服务器名   用于区分多个服务器
        server: {
          host: "183.250.161.180",
          // 服务器 host 
          port: 1422,
          // 服务器 port
          username: "root",
          // 服务器用户名
          password: "14320235@qq.com"
          // 服务器密码
        },
        uploadPath: "/usr/share/nginx/html",
        //服务器部署路径
        zipSource: "./dist",
        //  打包源文件  放在根目录的有zipSource文件夹会默认打包
        zipFileName: "dist.zip",
        //  打包后名称 放在根目录的有zipFileName文件夹直接上传 
        fileName: "zycrm",
        //部署上去的文件夹名 --- nginx配置里的root读取的文件夹
        delFile: true
        //部署完成后是否删除文件
      }
    ];
  }
});

// deploy.ts
import ssh from "ssh2";
import compress from "compressing";
import ora from "ora";
import * as fs from "fs";
import readLine from "readline";
var def = `/**
 * \u6700\u7EC8\u4F1A\u5728\u670D\u52A1\u5668\u7AEF\u5F62\u6210\u8FD9\u6837\u7684\u7ED3\u6784
 * uploadPath/                                       \u8FD9\u91CC\u662F\xB7uploadPath\xB7
 * |    |-- fileName/                                 \u8FD9\u91CC\u662F\xB7fileName\xB7 \u5E95\u4E0B\u662F\u89E3\u538B\u51FA\u6765\u7684\u6587\u4EF6
 * |    |     |--js                             
 * |    |     |--img
 * |    |     |--index.html
 * |    |     |--favicon.ico
 */
export default [
  {
    name: '',//\u670D\u52A1\u5668\u540D   \u7528\u4E8E\u533A\u5206\u591A\u4E2A\u670D\u52A1\u5668
    server: {
      host: '', // \u670D\u52A1\u5668 host 
      port: 22, // \u670D\u52A1\u5668 port
      username: '', // \u670D\u52A1\u5668\u7528\u6237\u540D
      password: '', // \u670D\u52A1\u5668\u5BC6\u7801
    },
    uploadPath: '/usr/share/nginx/html',//\u670D\u52A1\u5668\u90E8\u7F72\u8DEF\u5F84
    zipSource: './dist',//  \u6253\u5305\u6E90\u6587\u4EF6  \u653E\u5728\u6839\u76EE\u5F55\u7684\u6709zipSource\u6587\u4EF6\u5939\u4F1A\u9ED8\u8BA4\u6253\u5305 \u4EC5\u6709\u6587\u4EF6\u5939\u6CA1\u6709\u538B\u7F29\u5305\u624D\u538B\u7F29\u6587\u4EF6\u5939
    zipFileName: 'dist.zip', //  \u6253\u5305\u540E\u540D\u79F0 \u653E\u5728\u6839\u76EE\u5F55\u7684\u6709zipFileName\u6587\u4EF6\u5939\u76F4\u63A5\u4E0A\u4F20 \u5B58\u5728\u538B\u7F29\u5305\u5C31\u4F1A\u76F4\u63A5\u7528\u538B\u7F29\u5305
    fileName: '',//\u90E8\u7F72\u4E0A\u53BB\u7684\u6587\u4EF6\u5939\u540D --- nginx\u914D\u7F6E\u91CC\u7684root\u8BFB\u53D6\u7684\u6587\u4EF6\u5939
    delFile: true, //\u90E8\u7F72\u5B8C\u6210\u540E\u662F\u5426\u5220\u9664\u6587\u4EF6
  },
];`;
var serverInfo = null;
async function loadServerInfo() {
  try {
    const serverInfoModule = await Promise.resolve().then(() => (init_serverInfo(), serverInfo_exports));
    serverInfo = serverInfoModule.default;
  } catch (error) {
    console.error(
      "\u52A0\u8F7D serverInfo.js \u5931\u8D25,\u6B63\u5728\u4F7F\u7528\u9ED8\u8BA4\u914D\u7F6E\u521B\u5EFAserverInfo.js,\u8BF7\u586B\u5199\u914D\u7F6E\u540E\u91CD\u65B0\u8FD0\u884C"
    );
    fs.writeFileSync("./serverInfo.js", def);
    process.exit(1);
  }
}
var rl = readLine.createInterface({
  input: process.stdin,
  output: process.stdout
});
var server;
var uploadPath;
var zipSource;
var zipFileName;
var fileName;
var delFile;
var checkPath1 = ora(`\u6B63\u5728\u68C0\u67E5\u662F\u5426\u5B58\u5728${zipSource}\u6587\u4EF6\u5939`);
var checkPath2 = ora(`\u6B63\u5728\u68C0\u67E5\u662F\u5426\u5B58\u5728${zipFileName}\u538B\u7F29\u5305`);
var pkg = ora("\u6B63\u5728\u5BF9\u6587\u4EF6\u8FDB\u884C\u538B\u7F29");
var deploySpinner = ora("\u90E8\u7F72\u5F00\u59CB");
var sshClient = new ssh.Client();
var start = (/* @__PURE__ */ new Date()).getTime();
var args = process.argv.splice(2);
var init = async () => {
  await loadServerInfo();
  if (args.length == 1) {
    const index = parseInt(args[0]) - 1;
    if (!serverInfo) {
      console.error("\u670D\u52A1\u5668\u914D\u7F6E\u52A0\u8F7D\u5931\u8D25\uFF0C\u65E0\u6CD5\u7EE7\u7EED\u90E8\u7F72\uFF01");
      process.exit(1);
    }
    if (index >= 0 && index < serverInfo.length) {
      server = serverInfo[index].server;
      uploadPath = serverInfo[index].uploadPath;
      zipSource = serverInfo[index].zipSource;
      zipFileName = serverInfo[index].zipFileName;
      fileName = serverInfo[index].fileName;
      delFile = serverInfo[index].delFile;
      console.log("\u5F53\u524D\u8FDE\u63A5\u7684\u670D\u52A1\u5668IP\u662F\uFF1A" + server.host);
      main();
    } else {
      console.error("\u65E0\u6548\u7684\u670D\u52A1\u5668\u7D22\u5F15\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\uFF01");
      process.exit(1);
    }
  } else if (args.length > 1) {
    console.error("\u53C2\u6570\u9519\u8BEF\uFF0C\u8BF7\u53EA\u8F93\u5165\u4E00\u4E2A\u670D\u52A1\u5668\u7D22\u5F15\uFF01");
    process.exit(1);
  } else {
    selectServerInfo();
  }
};
function selectServerInfo() {
  if (!serverInfo) {
    console.error("\u670D\u52A1\u5668\u914D\u7F6E\u52A0\u8F7D\u5931\u8D25\uFF0C\u65E0\u6CD5\u7EE7\u7EED\u90E8\u7F72\uFF01");
    process.exit(1);
  }
  const serverList = serverInfo.map((server2) => server2.name);
  serverList.forEach((item, index) => {
    console.log(`[${index + 1}] ${item}`);
  });
  console.log(`[0] \u9000\u51FA`);
  rl.question(
    "\u9700\u8981\u90E8\u7F72\u5230\u54EA\u4E00\u53F0\u670D\u52A1\u5668?\uFF08\u8F93\u51650\u3001ctrl+c\u6216\u76F4\u63A5\u5173\u95ED\u9000\u51FA\uFF09 ",
    (input) => {
      const index = parseInt(input);
      if (index) {
        if (index > serverList.length || index < 0) {
          console.log("\u8F93\u5165\u9519\u8BEF,\u8BF7\u91CD\u65B0\u8F93\u5165");
          selectServerInfo();
          return;
        }
        if (!serverInfo) {
          console.error("\u670D\u52A1\u5668\u914D\u7F6E\u52A0\u8F7D\u5931\u8D25\uFF0C\u65E0\u6CD5\u7EE7\u7EED\u90E8\u7F72\uFF01");
          process.exit(1);
        }
        server = serverInfo[index - 1].server;
        uploadPath = serverInfo[index - 1].uploadPath;
        zipSource = serverInfo[index - 1].zipSource;
        zipFileName = serverInfo[index - 1].zipFileName;
        fileName = serverInfo[index - 1].fileName;
        console.log("\u5F53\u524D\u8FDE\u63A5\u7684\u670D\u52A1\u5668IP\u662F\uFF1A" + server.host);
        main();
      } else {
        rl.close();
        process.exit(1);
      }
    }
  );
}
async function main() {
  const hasFile = await checkFile();
  const hasZip = await checkZipFile(hasFile);
  if (hasZip) {
    deploySpinner.start();
    await uploadFile();
  } else if (hasFile && !hasZip) {
    const compress2 = await compressFiles();
    if (compress2) {
      deploySpinner.start();
      await uploadFile();
    }
  }
  if (hasFile && delFile) {
    deleteDir(zipSource);
  }
  if ((hasFile || hasZip) && delFile) fs.unlinkSync(zipFileName);
}
function checkFile() {
  return new Promise((resolve) => {
    checkPath1.start();
    fs.access(zipSource, fs.constants.F_OK, (err) => {
      if (err) {
        checkPath1.fail("\u4E0D\u5B58\u5728" + zipSource + "\u6587\u4EF6\u5939");
        resolve(false);
      } else {
        checkPath1.succeed("\u6587\u4EF6\u5939\u5B58\u5728");
        resolve(true);
      }
    });
  });
}
function checkZipFile(hasFile = false) {
  return new Promise((resolve) => {
    checkPath2.start();
    fs.access(zipFileName, fs.constants.F_OK, (err) => {
      if (err) {
        checkPath2.fail("\u4E0D\u5B58\u5728" + zipFileName + "\u538B\u7F29\u5305\uFF0C");
        if (hasFile) {
          checkPath2.succeed("\u5B58\u5728" + zipSource + "\u5373\u5C06\u5F00\u59CB\u538B\u7F29\u5E76\u4E0A\u4F20\uFF01");
        } else {
          checkPath2.fail("\u65E0\u6CD5\u8FDB\u884C\u90E8\u7F72");
        }
        checkPath2.clear();
        resolve(false);
      } else {
        checkPath2.succeed("\u5B58\u5728\u538B\u7F29\u5305");
        resolve(true);
      }
    });
  });
}
function compressFiles() {
  return new Promise((resolve) => {
    pkg.start();
    const zipFile = (zipSource2, zipFileName2) => {
      return compress.zip.compressDir(zipSource2, zipFileName2, {
        zipFileNameEncoding: "gbk",
        ignoreBase: true
        //压缩包内不需要再包一层
      });
    };
    zipFile(zipSource, zipFileName).then(async () => {
      pkg.succeed("\u751F\u6210\u538B\u7F29\u6587\u4EF6\u6210\u529F");
      return resolve(true);
    });
  });
}
function uploadFile() {
  return new Promise((resolve) => {
    sshClient.on("ready", () => {
      deploySpinner.text = "\u670D\u52A1\u5668\u5DF2\u8FDE\u63A5,\u6B63\u5728\u4E0A\u4F20\u6587\u4EF6......";
      sshClient.sftp((err, sftp) => {
        sftp.fastPut(
          zipFileName,
          // 本地文件路径
          `${uploadPath}/${zipFileName}`,
          // 上传到目标服务器的路径
          {},
          (err2, result) => {
            resolve(deploy(sshClient));
          }
        );
      });
    }).on("error", () => {
      deploySpinner.fail("\u670D\u52A1\u5668\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u670D\u52A1\u5668\u914D\u7F6E\u53C2\u6570\u662F\u5426\u6B63\u786E\uFF01");
    }).connect(server);
  });
}
function deploy(sshClient2) {
  return new Promise((resolve) => {
    deploySpinner.text = "\u6587\u4EF6\u4E0A\u4F20\u6210\u529F\uFF01";
    const testUnzip = ora("\u6D4B\u8BD5\u662F\u5426\u6709unzip\u547D\u4EE4");
    testUnzip.start();
    sshClient2.exec("unzip -v", (err, stream) => {
      if (err) throw err;
      stream.on("close", (code, signal) => {
      }).on("data", (data) => {
        testUnzip.succeed("\u670D\u52A1\u5668\u6709unzip\u547D\u4EE4\uFF0C\u5F00\u59CB\u90E8\u7F72!");
        testUnzip.stop();
      }).stderr.on("data", (data) => {
        if (data.indexOf("unzip: command not found")) {
          testUnzip.fail("\u670D\u52A1\u5668\u6CA1\u6709unzip\u547D\u4EE4\uFF0C\u8BF7\u5B89\u88C5unzip\u547D\u4EE4\uFF01");
          process.exit(1);
        }
      });
    });
    sshClient2.shell((err, stream) => {
      stream.end(
        `
          cd ${uploadPath}
          rm -rf ${fileName}_bak
          mv -f ${fileName} ${fileName}_bak
          unzip ${zipFileName} -d ./${fileName}
          rm -f ${zipFileName}
          exit
          `
      ).on("data", (data) => {
      }).on("close", () => {
        sshClient2.end();
        let end = (/* @__PURE__ */ new Date()).getTime();
        deploySpinner.succeed(`\u90E8\u7F72\u5B8C\u6210\uFF0C\u8017\u65F6${end - start}ms`);
        resolve(true);
      });
    });
  });
}
function deleteDir(url) {
  var files = [];
  if (fs.existsSync(url)) {
    files = fs.readdirSync(url);
    files.forEach(function(file, index) {
      const path = `${url}/${file}`;
      if (fs.statSync(path).isDirectory()) {
        deleteDir(path);
      } else {
        fs.unlinkSync(path);
      }
    });
    fs.rmdirSync(url);
  } else {
    console.log("\u7ED9\u5B9A\u7684\u8DEF\u5F84\u4E0D\u5B58\u5728\uFF01");
  }
}
init();
