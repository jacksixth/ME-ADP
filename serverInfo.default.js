/**
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
]