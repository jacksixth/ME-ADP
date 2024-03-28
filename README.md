```
# 说明

该包可自动化部署前端文件至服务器

### 使用方法

npm install

npm run start

打开serverInfo.js，填写服务器相关信息、打包信息等。服务器部署路径在第一次使用时可暂时使用一个测试路径来进行试验。

1、windows双击 `start.bat`即可将前端工程部署到服务器。

2、macos等其他系统在当前目录下运行 `node upload.server.js`命令即可部署。

部署完会自动删除dist文件夹和dist.zip
```
