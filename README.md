# Chrome Extensions For Uni Studio

### 项目结构

```
├─extensions-app            # 【Chrome 浏览器扩展】
│ │ background.js
│ │ content.js
│ │ manifest.json
│ └─icons
│
├─native-host               # 【本地 Java 程序】
│ │ manifest.json           # 被注册到注册表的配置文件
│ │ pom.xml                 # Maven pom 配置
│ │ register-app.reg        # 注册表文件
│ │ start.bat               # 启动本机 Java 程序的 BAT 脚本
│ ├─out                     # 编译生成 Java 程序输出目录
│ │ └─artifacts
│ │   └─native_host_jar
│ │     └─native-host.jar   # 编译生成的 Java 程序
│ └─src                     # Java 程序源码
```

### 环境配置

1. **加载 Chrome Extensions** - 进入 Chrome 扩展程序管理页，打开开发者模式，点击 “已解压的扩展程序” ，选择 `extensions-app` 文件夹。
2. **配置注册表脚本并执行** - 文本编辑器打开 `native-host/register-app.reg` 文件，修改路径信息，指向 `native-host/manifest.json` 文件，并双击执行注册表。
3. **配置本地程序 manifest 文件** - 文本编辑器打开 `native-host/manifest.json` 文件；修改 `allowed_origins -> chrome-extension` 字段值为第一步添加的 Chrome 扩展程序 ID；修改 `path` 字段值，指向 `native-host/start.bat` （仅 Windows OS 下支持相对路径）。
4. **配置 start.bat 文件** - 文本编辑器打开 `native-host/start.bat` 文件，修改本地程序启动路径为编译生成的 jar 文件（ Java 程序默认生成的 jar 位于 `native-host/out/artifacts/native_host_jar/native-host.jar` ）。



