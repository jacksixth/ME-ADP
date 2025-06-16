"use strict";
/*
 * @Author: jack
 * @Date: 2024-01-23 10:10
 * @LastEditors: jack
 * @LastEditTime: 2025-06-16 17:25
 * @Description: 自动化部署前端文件至服务器
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ssh = require("ssh2");
var compress = require("compressing");
var ora_1 = require("ora");
var fs = require("fs");
var readLine = require("readline");
var def = "/**\n * \u6700\u7EC8\u4F1A\u5728\u670D\u52A1\u5668\u7AEF\u5F62\u6210\u8FD9\u6837\u7684\u7ED3\u6784\n * uploadPath/                                       \u8FD9\u91CC\u662F\u00B7uploadPath\u00B7\n * |    |-- fileName/                                 \u8FD9\u91CC\u662F\u00B7fileName\u00B7 \u5E95\u4E0B\u662F\u89E3\u538B\u51FA\u6765\u7684\u6587\u4EF6\n * |    |     |--js                             \n * |    |     |--img\n * |    |     |--index.html\n * |    |     |--favicon.ico\n */\nmodule.exports = [\n  {\n    name: '',//\u670D\u52A1\u5668\u540D   \u7528\u4E8E\u533A\u5206\u591A\u4E2A\u670D\u52A1\u5668\n    server: {\n      host: '', // \u670D\u52A1\u5668 host \n      port: 22, // \u670D\u52A1\u5668 port\n      username: '', // \u670D\u52A1\u5668\u7528\u6237\u540D\n      password: '', // \u670D\u52A1\u5668\u5BC6\u7801\n    },\n    uploadPath: '/usr/share/nginx/html',//\u670D\u52A1\u5668\u90E8\u7F72\u8DEF\u5F84\n    zipSource: './dist',//  \u6253\u5305\u6E90\u6587\u4EF6  \u653E\u5728\u6839\u76EE\u5F55\u7684\u6709zipSource\u6587\u4EF6\u5939\u4F1A\u9ED8\u8BA4\u6253\u5305 \u4EC5\u6709\u6587\u4EF6\u5939\u6CA1\u6709\u538B\u7F29\u5305\u624D\u538B\u7F29\u6587\u4EF6\u5939\n    zipFileName: 'dist.zip', //  \u6253\u5305\u540E\u540D\u79F0 \u653E\u5728\u6839\u76EE\u5F55\u7684\u6709zipFileName\u6587\u4EF6\u5939\u76F4\u63A5\u4E0A\u4F20 \u5B58\u5728\u538B\u7F29\u5305\u5C31\u4F1A\u76F4\u63A5\u7528\u538B\u7F29\u5305\n    fileName: '',//\u90E8\u7F72\u4E0A\u53BB\u7684\u6587\u4EF6\u5939\u540D --- nginx\u914D\u7F6E\u91CC\u7684root\u8BFB\u53D6\u7684\u6587\u4EF6\u5939\n    delFile: true, //\u90E8\u7F72\u5B8C\u6210\u540E\u662F\u5426\u5220\u9664\u6587\u4EF6\n  },\n];";
var serverInfo = null;
function loadServerInfo() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                serverInfo = require("./serverInfo.js");
            }
            catch (error) {
                console.error("加载 serverInfo.js 失败,正在使用默认配置创建serverInfo.js,请填写配置后重新运行");
                fs.writeFileSync("./serverInfo.js", def);
                process.exit(1);
            }
            return [2 /*return*/];
        });
    });
}
var rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
});
var server, uploadPath, zipSource, zipFileName, fileName, delFile; //服务器信息
var checkPath1 = (0, ora_1.default)("\u6B63\u5728\u68C0\u67E5\u662F\u5426\u5B58\u5728".concat(zipSource, "\u6587\u4EF6\u5939"));
var checkPath2 = (0, ora_1.default)("\u6B63\u5728\u68C0\u67E5\u662F\u5426\u5B58\u5728".concat(zipFileName, "\u538B\u7F29\u5305"));
var pkg = (0, ora_1.default)("正在对文件进行压缩");
var deploySpinner = (0, ora_1.default)("部署开始");
var sshClient = new ssh.Client();
var start = new Date().getTime();
var args = process.argv.splice(2);
var init = function () { return __awaiter(void 0, void 0, void 0, function () {
    var index;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, loadServerInfo()];
            case 1:
                _a.sent();
                if (args.length == 1) {
                    index = parseInt(args[0]) - 1;
                    if (!serverInfo) {
                        console.error("服务器配置加载失败，无法继续部署！");
                        process.exit(1);
                    }
                    if (index >= 0 && index < serverInfo.length) {
                        server = serverInfo[index].server;
                        uploadPath = serverInfo[index].uploadPath;
                        zipSource = serverInfo[index].zipSource;
                        zipFileName = serverInfo[index].zipFileName;
                        fileName = serverInfo[index].fileName;
                        delFile = serverInfo[index].delFile;
                        console.log("当前连接的服务器IP是：" + server.host);
                        main();
                    }
                    else {
                        console.error("无效的服务器索引，请重新选择！");
                        process.exit(1);
                    }
                }
                else if (args.length > 1) {
                    console.error("参数错误，请只输入一个服务器索引！");
                    process.exit(1);
                }
                else {
                    // 如果没有传入参数，则选择服务器
                    selectServerInfo();
                }
                return [2 /*return*/];
        }
    });
}); };
function selectServerInfo() {
    if (!serverInfo) {
        console.error("服务器配置加载失败，无法继续部署！");
        process.exit(1);
    }
    var serverList = serverInfo.map(function (server) { return server.name; });
    serverList.forEach(function (item, index) {
        console.log("[".concat(index + 1, "] ").concat(item));
    });
    console.log("[0] \u9000\u51FA");
    rl.question("需要部署到哪一台服务器?（输入0、ctrl+c或直接关闭退出） ", function (input) {
        var index = parseInt(input);
        if (index) {
            if (index > serverList.length || index < 0) {
                console.log("输入错误,请重新输入");
                selectServerInfo();
                return;
            }
            if (!serverInfo) {
                console.error("服务器配置加载失败，无法继续部署！");
                process.exit(1);
            }
            server = serverInfo[index - 1].server;
            uploadPath = serverInfo[index - 1].uploadPath;
            zipSource = serverInfo[index - 1].zipSource;
            zipFileName = serverInfo[index - 1].zipFileName;
            fileName = serverInfo[index - 1].fileName;
            console.log("当前连接的服务器IP是：" + server.host);
            main();
        }
        else {
            rl.close();
            process.exit(1);
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var hasFile, hasZip, compress_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, checkFile()];
                case 1:
                    hasFile = _a.sent();
                    return [4 /*yield*/, checkZipFile(hasFile)
                        //存在压缩包就会直接用压缩包 - 有些项目有加build完自动压缩
                    ];
                case 2:
                    hasZip = _a.sent();
                    if (!hasZip) return [3 /*break*/, 4];
                    deploySpinner.start();
                    return [4 /*yield*/, uploadFile()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 4:
                    if (!(hasFile && !hasZip)) return [3 /*break*/, 7];
                    return [4 /*yield*/, compressFiles()];
                case 5:
                    compress_1 = _a.sent();
                    if (!compress_1) return [3 /*break*/, 7];
                    deploySpinner.start();
                    return [4 /*yield*/, uploadFile()];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    if (hasFile && delFile) {
                        deleteDir(zipSource);
                    }
                    if ((hasFile || hasZip) && delFile)
                        fs.unlinkSync(zipFileName);
                    return [2 /*return*/];
            }
        });
    });
}
function checkFile() {
    return new Promise(function (resolve) {
        checkPath1.start();
        fs.access(zipSource, fs.constants.F_OK, function (err) {
            if (err) {
                checkPath1.fail("不存在" + zipSource + "文件夹");
                resolve(false);
            }
            else {
                checkPath1.succeed("文件夹存在");
                resolve(true);
            }
        });
    });
}
function checkZipFile(hasFile) {
    if (hasFile === void 0) { hasFile = false; }
    return new Promise(function (resolve) {
        checkPath2.start();
        fs.access(zipFileName, fs.constants.F_OK, function (err) {
            if (err) {
                checkPath2.fail("不存在" + zipFileName + "压缩包，");
                if (hasFile) {
                    checkPath2.succeed("存在" + zipSource + "即将开始压缩并上传！");
                }
                else {
                    checkPath2.fail("无法进行部署");
                }
                checkPath2.clear();
                resolve(false);
            }
            else {
                checkPath2.succeed("存在压缩包");
                resolve(true);
            }
        });
    });
}
function compressFiles() {
    var _this = this;
    return new Promise(function (resolve) {
        // 对文件进行压缩打包
        pkg.start();
        var zipFile = function (zipSource, zipFileName) {
            return compress.zip.compressDir(zipSource, zipFileName, {
                zipFileNameEncoding: "gbk",
                ignoreBase: true, //压缩包内不需要再包一层
            });
        };
        zipFile(zipSource, zipFileName).then(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                pkg.succeed("生成压缩文件成功");
                return [2 /*return*/, resolve(true)];
            });
        }); });
    });
}
// 利用 sftp 方法上传文件
function uploadFile() {
    return new Promise(function (resolve) {
        sshClient
            .on("ready", function () {
            deploySpinner.text = "服务器已连接,正在上传文件......";
            sshClient.sftp(function (err, sftp) {
                sftp.fastPut(zipFileName, // 本地文件路径
                "".concat(uploadPath, "/").concat(zipFileName), // 上传到目标服务器的路径
                {}, function (_err) {
                    resolve(deploy(sshClient));
                });
            });
        })
            .on("error", function () {
            deploySpinner.fail("服务器连接失败，请检查服务器配置参数是否正确！");
        })
            .connect(server);
    });
}
function deploy(sshClient) {
    return new Promise(function (resolve) {
        deploySpinner.text = "文件上传成功！";
        var testUnzip = (0, ora_1.default)("测试是否有unzip命令");
        testUnzip.start();
        sshClient.exec("unzip -v", function (err, stream) {
            if (err)
                throw err;
            stream
                .on("close", function (code, signal) { })
                .on("data", function (data) {
                testUnzip.succeed("服务器有unzip命令，开始部署!");
                testUnzip.stop();
            })
                .stderr.on("data", function (data) {
                if (data.indexOf("unzip: command not found")) {
                    testUnzip.fail("服务器没有unzip命令，请安装unzip命令！");
                    process.exit(1);
                }
            });
        });
        sshClient.shell(function (err, stream) {
            stream
                // 执行命令，删除上一个备份，对当前的备份，解压最新代码
                .end("\n          cd ".concat(uploadPath, "\n          rm -rf ").concat(fileName, "_bak\n          mv -f ").concat(fileName, " ").concat(fileName, "_bak\n          unzip ").concat(zipFileName, " -d ./").concat(fileName, "\n          rm -f ").concat(zipFileName, "\n          exit\n          "))
                .on("data", function (data) { })
                .on("close", function () {
                sshClient.end();
                var end = new Date().getTime();
                deploySpinner.succeed("\u90E8\u7F72\u5B8C\u6210\uFF0C\u8017\u65F6".concat(end - start, "ms"));
                resolve(true);
            });
        });
    });
}
function deleteDir(url) {
    var files = [];
    if (fs.existsSync(url)) {
        //判断给定的路径是否存在
        files = fs.readdirSync(url); //返回文件和子目录的数组
        files.forEach(function (file, index) {
            var path = "".concat(url, "/").concat(file);
            if (fs.statSync(path).isDirectory()) {
                //同步读取文件夹文件，如果是文件夹，则函数回调
                deleteDir(path);
            }
            else {
                fs.unlinkSync(path);
            }
        });
        fs.rmdirSync(url); //清除文件夹
    }
    else {
        console.log("给定的路径不存在！");
    }
}
init();
