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
var util_1 = require("util");
// 将回调风格的函数转换为 Promise 风格
var accessAsync = (0, util_1.promisify)(fs.access);
var readdirAsync = (0, util_1.promisify)(fs.readdir);
var statAsync = (0, util_1.promisify)(fs.stat);
var unlinkAsync = (0, util_1.promisify)(fs.unlink);
var rmdirAsync = (0, util_1.promisify)(fs.rmdir);
var DEFAULT_CONFIG_TEMPLATE = "/**\n * \u6700\u7EC8\u4F1A\u5728\u670D\u52A1\u5668\u7AEF\u5F62\u6210\u8FD9\u6837\u7684\u7ED3\u6784\n * uploadPath/                                       \u8FD9\u91CC\u662F\u00B7uploadPath\u00B7\n * |    |-- fileName/                                 \u8FD9\u91CC\u662F\u00B7fileName\u00B7 \u5E95\u4E0B\u662F\u89E3\u538B\u51FA\u6765\u7684\u6587\u4EF6\n * |    |     |--js                             \n * |    |     |--img\n * |    |     |--index.html\n * |    |     |--favicon.ico\n */\nmodule.exports = [\n  {\n    name: '',//\u670D\u52A1\u5668\u540D   \u7528\u4E8E\u533A\u5206\u591A\u4E2A\u670D\u52A1\u5668\n    server: {\n      host: '', // \u670D\u52A1\u5668 host \n      port: 22, // \u670D\u52A1\u5668 port\n      username: '', // \u670D\u52A1\u5668\u7528\u6237\u540D\n      password: '', // \u670D\u52A1\u5668\u5BC6\u7801\n    },\n    uploadPath: '/usr/share/nginx/html',//\u670D\u52A1\u5668\u90E8\u7F72\u8DEF\u5F84\n    zipSource: './dist',//  \u6253\u5305\u6E90\u6587\u4EF6  \u653E\u5728\u6839\u76EE\u5F55\u7684\u6709zipSource\u6587\u4EF6\u5939\u4F1A\u9ED8\u8BA4\u6253\u5305 \u4EC5\u6709\u6587\u4EF6\u5939\u6CA1\u6709\u538B\u7F29\u5305\u624D\u538B\u7F29\u6587\u4EF6\u5939\n    zipFileName: 'dist.zip', //  \u6253\u5305\u540E\u540D\u79F0 \u653E\u5728\u6839\u76EE\u5F55\u7684\u6709zipFileName\u6587\u4EF6\u5939\u76F4\u63A5\u4E0A\u4F20 \u5B58\u5728\u538B\u7F29\u5305\u5C31\u4F1A\u76F4\u63A5\u7528\u538B\u7F29\u5305\n    fileName: '',//\u90E8\u7F72\u4E0A\u53BB\u7684\u6587\u4EF6\u5939\u540D --- nginx\u914D\u7F6E\u91CC\u7684root\u8BFB\u53D6\u7684\u6587\u4EF6\u5939\n    delFile: true, //\u90E8\u7F72\u5B8C\u6210\u540E\u662F\u5426\u5220\u9664\u6587\u4EF6\n  },\n];";
var serverInfo = null;
var rl = null;
var sshClient = null;
var deploymentStartTime = 0;
/**
 * 加载服务器配置信息
 */
function loadServerInfo() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // 清除 require 缓存，确保获取最新配置
                delete require.cache[require.resolve("./serverInfo.js")];
                serverInfo = require("./serverInfo.js");
                if (!Array.isArray(serverInfo) || serverInfo.length === 0) {
                    throw new Error("serverInfo.js 必须导出一个非空数组");
                }
            }
            catch (error) {
                console.error("❌ 加载 serverInfo.js 失败，正在使用默认配置创建 serverInfo.js");
                console.error("请填写配置后重新运行\n");
                fs.writeFileSync("./serverInfo.js", DEFAULT_CONFIG_TEMPLATE, "utf-8");
                process.exit(1);
            }
            return [2 /*return*/];
        });
    });
}
/**
 * 初始化 readline 接口
 */
function initReadline() {
    rl = readLine.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}
/**
 * 关闭 readline 接口
 */
function closeReadline() {
    if (rl) {
        rl.close();
        rl = null;
    }
}
/**
 * 选择服务器配置
 */
function selectServerInfo() {
    return __awaiter(this, void 0, void 0, function () {
        var serverList;
        return __generator(this, function (_a) {
            if (!serverInfo) {
                console.error("❌ 服务器配置未加载");
                return [2 /*return*/, null];
            }
            serverList = serverInfo.map(function (config) { return config.name; });
            console.log("\n📋 可用的服务器列表：");
            serverList.forEach(function (name, index) {
                console.log("  [".concat(index + 1, "] ").concat(name));
            });
            console.log("  [0] \u9000\u51FA\n");
            return [2 /*return*/, new Promise(function (resolve) {
                    if (!rl) {
                        resolve(null);
                        return;
                    }
                    rl.question("请选择要部署的服务器（输入编号，0 退出）：", function (input) {
                        var index = parseInt(input.trim(), 10);
                        if (isNaN(index) || index < 0 || index > serverList.length) {
                            console.log("❌ 输入无效，请重新选择\n");
                            selectServerInfo().then(resolve);
                            return;
                        }
                        if (index === 0) {
                            console.log("👋 已取消部署");
                            closeReadline();
                            process.exit(0);
                        }
                        var config = serverInfo[index - 1];
                        console.log("\u2705 \u5DF2\u9009\u62E9\u670D\u52A1\u5668\uFF1A".concat(config.name, " (").concat(config.server.host, ")\n"));
                        resolve({
                            server: config.server,
                            uploadPath: config.uploadPath,
                            zipSource: config.zipSource,
                            zipFileName: config.zipFileName,
                            fileName: config.fileName,
                            delFile: config.delFile,
                        });
                    });
                })];
        });
    });
}
/**
 * 从命令行参数获取服务器配置
 */
function getServerFromArgs(args) {
    if (!serverInfo) {
        console.error("❌ 服务器配置未加载");
        return null;
    }
    if (args.length !== 1) {
        return null;
    }
    var index = parseInt(args[0], 10) - 1;
    if (isNaN(index) || index < 0 || index >= serverInfo.length) {
        console.error("\u274C \u65E0\u6548\u7684\u670D\u52A1\u5668\u7D22\u5F15\uFF1A".concat(args[0], "\uFF0C\u6709\u6548\u8303\u56F4\uFF1A1-").concat(serverInfo.length));
        process.exit(1);
    }
    var config = serverInfo[index];
    console.log("\u2705 \u5DF2\u9009\u62E9\u670D\u52A1\u5668\uFF1A".concat(config.name, " (").concat(config.server.host, ")\n"));
    return {
        server: config.server,
        uploadPath: config.uploadPath,
        zipSource: config.zipSource,
        zipFileName: config.zipFileName,
        fileName: config.fileName,
        delFile: config.delFile,
    };
}
/**
 * 检查源文件夹是否存在
 */
function checkSourceFolder(zipSource) {
    return __awaiter(this, void 0, void 0, function () {
        var spinner, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    spinner = (0, ora_1.default)("\u68C0\u67E5\u6E90\u6587\u4EF6\u5939\uFF1A".concat(zipSource)).start();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, accessAsync(zipSource, fs.constants.F_OK)];
                case 2:
                    _b.sent();
                    spinner.succeed("✅ 源文件夹存在");
                    return [2 /*return*/, true];
                case 3:
                    _a = _b.sent();
                    spinner.fail("\u274C \u6E90\u6587\u4EF6\u5939\u4E0D\u5B58\u5728\uFF1A".concat(zipSource));
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 检查压缩包是否存在
 */
function checkZipFile(zipFileName) {
    return __awaiter(this, void 0, void 0, function () {
        var spinner, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    spinner = (0, ora_1.default)("\u68C0\u67E5\u538B\u7F29\u5305\uFF1A".concat(zipFileName)).start();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, accessAsync(zipFileName, fs.constants.F_OK)];
                case 2:
                    _b.sent();
                    spinner.succeed("✅ 压缩包存在");
                    return [2 /*return*/, true];
                case 3:
                    _a = _b.sent();
                    spinner.fail("\u274C \u538B\u7F29\u5305\u4E0D\u5B58\u5728\uFF1A".concat(zipFileName));
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 压缩文件夹
 */
function compressFolder(zipSource, zipFileName) {
    return __awaiter(this, void 0, void 0, function () {
        var spinner, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    spinner = (0, ora_1.default)("正在压缩文件...").start();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, compress.zip.compressDir(zipSource, zipFileName, {
                            zipFileNameEncoding: "gbk",
                            ignoreBase: true, // 压缩包内不需要再包一层
                        })];
                case 2:
                    _a.sent();
                    spinner.succeed("✅ 压缩完成");
                    return [2 /*return*/, true];
                case 3:
                    error_1 = _a.sent();
                    spinner.fail("\u274C \u538B\u7F29\u5931\u8D25\uFF1A".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 连接到 SSH 服务器
 */
function connectToServer(server) {
    return new Promise(function (resolve, reject) {
        var client = new ssh.Client();
        client
            .on("ready", function () {
            console.log("✅ SSH 连接成功");
            resolve(client);
        })
            .on("error", function (err) {
            reject(new Error("SSH \u8FDE\u63A5\u5931\u8D25\uFF1A".concat(err.message)));
        })
            .connect(server);
    });
}
/**
 * 上传文件到服务器
 */
function uploadFile(client, localPath, remotePath) {
    return __awaiter(this, void 0, void 0, function () {
        var spinner;
        return __generator(this, function (_a) {
            spinner = (0, ora_1.default)("正在上传文件...").start();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    client.sftp(function (err, sftp) {
                        if (err) {
                            spinner.fail("\u274C SFTP \u8FDE\u63A5\u5931\u8D25\uFF1A".concat(err.message));
                            reject(err);
                            return;
                        }
                        sftp.fastPut(localPath, remotePath, {}, function (putErr) {
                            if (putErr) {
                                spinner.fail("\u274C \u6587\u4EF6\u4E0A\u4F20\u5931\u8D25\uFF1A".concat(putErr.message));
                                reject(putErr);
                            }
                            else {
                                spinner.succeed("✅ 文件上传成功");
                                resolve();
                            }
                        });
                    });
                })];
        });
    });
}
/**
 * 在服务器上执行命令
 */
function executeCommand(client, command, description) {
    return new Promise(function (resolve, reject) {
        client.exec(command, function (err, stream) {
            if (err) {
                reject(err);
                return;
            }
            var stdout = "";
            var stderr = "";
            stream
                .on("close", function (code, signal) {
                if (code !== 0) {
                    reject(new Error("\u547D\u4EE4\u6267\u884C\u5931\u8D25\uFF08\u9000\u51FA\u7801\uFF1A".concat(code, "\uFF09\uFF1A").concat(stderr)));
                }
                else {
                    resolve(stdout);
                }
            })
                .on("data", function (data) {
                stdout += data.toString();
            })
                .stderr.on("data", function (data) {
                stderr += data.toString();
            });
        });
    });
}
/**
 * 在服务器上部署文件
 */
function deployOnServer(client, context) {
    return __awaiter(this, void 0, void 0, function () {
        var uploadPath, zipFileName, fileName, checkSpinner, error_2, deploySpinner, deployCommands, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uploadPath = context.uploadPath, zipFileName = context.zipFileName, fileName = context.fileName;
                    checkSpinner = (0, ora_1.default)("检查服务器环境...").start();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, executeCommand(client, "unzip -v", "检查 unzip 命令")];
                case 2:
                    _a.sent();
                    checkSpinner.succeed("✅ 服务器环境检查通过");
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    checkSpinner.fail("❌ 服务器缺少 unzip 命令，请先安装");
                    throw new Error("服务器未安装 unzip 命令");
                case 4:
                    deploySpinner = (0, ora_1.default)("正在部署文件...").start();
                    deployCommands = "\n    cd ".concat(uploadPath, " &&     rm -rf ").concat(fileName, "_bak &&     mv -f ").concat(fileName, " ").concat(fileName, "_bak &&     unzip -o ").concat(zipFileName, " -d ./").concat(fileName, " &&     rm -f ").concat(zipFileName, "\n  ");
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, executeCommand(client, deployCommands, "部署文件")];
                case 6:
                    _a.sent();
                    deploySpinner.succeed("✅ 文件部署成功");
                    return [3 /*break*/, 8];
                case 7:
                    error_3 = _a.sent();
                    deploySpinner.fail("\u274C \u90E8\u7F72\u5931\u8D25\uFF1A".concat(error_3 instanceof Error ? error_3.message : String(error_3)));
                    throw error_3;
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * 清理本地文件
 */
function cleanupLocalFiles(zipSource, zipFileName, delFile) {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!delFile) {
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!fs.existsSync(zipSource)) return [3 /*break*/, 3];
                    return [4 /*yield*/, deleteDirectory(zipSource)];
                case 2:
                    _a.sent();
                    console.log("\u2705 \u5DF2\u5220\u9664\u6E90\u6587\u4EF6\u5939\uFF1A".concat(zipSource));
                    _a.label = 3;
                case 3:
                    if (!fs.existsSync(zipFileName)) return [3 /*break*/, 5];
                    return [4 /*yield*/, unlinkAsync(zipFileName)];
                case 4:
                    _a.sent();
                    console.log("\u2705 \u5DF2\u5220\u9664\u538B\u7F29\u5305\uFF1A".concat(zipFileName));
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_4 = _a.sent();
                    console.warn("\u26A0\uFE0F  \u6E05\u7406\u6587\u4EF6\u65F6\u51FA\u9519\uFF1A".concat(error_4 instanceof Error ? error_4.message : String(error_4)));
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * 递归删除目录
 */
function deleteDirectory(dirPath) {
    return __awaiter(this, void 0, void 0, function () {
        var files;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readdirAsync(dirPath)];
                case 1:
                    files = _a.sent();
                    return [4 /*yield*/, Promise.all(files.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                            var filePath, stats;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        filePath = "".concat(dirPath, "/").concat(file);
                                        return [4 /*yield*/, statAsync(filePath)];
                                    case 1:
                                        stats = _a.sent();
                                        if (!stats.isDirectory()) return [3 /*break*/, 3];
                                        return [4 /*yield*/, deleteDirectory(filePath)];
                                    case 2:
                                        _a.sent();
                                        return [3 /*break*/, 5];
                                    case 3: return [4 /*yield*/, unlinkAsync(filePath)];
                                    case 4:
                                        _a.sent();
                                        _a.label = 5;
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, rmdirAsync(dirPath)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * 主部署流程
 */
function main(context) {
    return __awaiter(this, void 0, void 0, function () {
        var server, zipSource, zipFileName, delFile, hasSourceFolder, hasZipFile, finalZipFile, compressSuccess, remotePath, elapsed, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    deploymentStartTime = Date.now();
                    server = context.server, zipSource = context.zipSource, zipFileName = context.zipFileName, delFile = context.delFile;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, , 11]);
                    return [4 /*yield*/, checkSourceFolder(zipSource)];
                case 2:
                    hasSourceFolder = _a.sent();
                    return [4 /*yield*/, checkZipFile(zipFileName)];
                case 3:
                    hasZipFile = _a.sent();
                    if (!hasSourceFolder && !hasZipFile) {
                        console.error("❌ 既没有源文件夹也没有压缩包，无法部署");
                        process.exit(1);
                    }
                    finalZipFile = zipFileName;
                    if (!(!hasZipFile && hasSourceFolder)) return [3 /*break*/, 5];
                    return [4 /*yield*/, compressFolder(zipSource, zipFileName)];
                case 4:
                    compressSuccess = _a.sent();
                    if (!compressSuccess) {
                        process.exit(1);
                    }
                    _a.label = 5;
                case 5: return [4 /*yield*/, connectToServer(server)];
                case 6:
                    // 3. 连接服务器并上传
                    sshClient = _a.sent();
                    remotePath = "".concat(context.uploadPath, "/").concat(finalZipFile);
                    return [4 /*yield*/, uploadFile(sshClient, finalZipFile, remotePath)
                        // 4. 在服务器上部署
                    ];
                case 7:
                    _a.sent();
                    // 4. 在服务器上部署
                    return [4 /*yield*/, deployOnServer(sshClient, context)
                        // 5. 关闭 SSH 连接
                    ];
                case 8:
                    // 4. 在服务器上部署
                    _a.sent();
                    // 5. 关闭 SSH 连接
                    if (sshClient) {
                        sshClient.end();
                        sshClient = null;
                    }
                    // 6. 清理本地文件
                    return [4 /*yield*/, cleanupLocalFiles(zipSource, zipFileName, delFile)
                        // 7. 显示耗时
                    ];
                case 9:
                    // 6. 清理本地文件
                    _a.sent();
                    elapsed = Date.now() - deploymentStartTime;
                    console.log("\n\uD83C\uDF89 \u90E8\u7F72\u5B8C\u6210\uFF01\u603B\u8017\u65F6\uFF1A".concat(elapsed, "ms"));
                    return [3 /*break*/, 11];
                case 10:
                    error_5 = _a.sent();
                    console.error("\n\u274C \u90E8\u7F72\u5931\u8D25\uFF1A".concat(error_5 instanceof Error ? error_5.message : String(error_5)));
                    // 确保关闭 SSH 连接
                    if (sshClient) {
                        sshClient.end();
                        sshClient = null;
                    }
                    process.exit(1);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
/**
 * 初始化并启动部署
 */
function init() {
    return __awaiter(this, void 0, void 0, function () {
        var args, context;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, loadServerInfo()];
                case 1:
                    _a.sent();
                    initReadline();
                    args = process.argv.slice(2);
                    context = null;
                    // 优先从命令行参数获取配置
                    if (args.length > 0) {
                        context = getServerFromArgs(args);
                    }
                    if (!!context) return [3 /*break*/, 3];
                    return [4 /*yield*/, selectServerInfo()];
                case 2:
                    context = _a.sent();
                    _a.label = 3;
                case 3:
                    if (!context) {
                        console.error("❌ 未能获取有效的服务器配置");
                        closeReadline();
                        process.exit(1);
                    }
                    // 开始部署
                    return [4 /*yield*/, main(context)];
                case 4:
                    // 开始部署
                    _a.sent();
                    closeReadline();
                    return [2 /*return*/];
            }
        });
    });
}
// 启动程序
init().catch(function (error) {
    console.error("❌ 未捕获的错误：", error);
    closeReadline();
    process.exit(1);
});
