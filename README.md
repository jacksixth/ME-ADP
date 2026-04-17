# 说明

该包可自动化部署前端文件至服务器

打包时不要在根目录创建serverInfo.js会被ncc打包进单文件导致无法动态读取serverInfo.js

### 使用方法

将 `/out/index.js`文件放在项目内在需要部署时运行 `node deploy.js [serverIndex]`参数可选

第一次运行时会在项目根目录生成 `serverInfo.js` 需要在文件内配置服务器信息

运行时带参数可指定使用哪个服务器信息部署
