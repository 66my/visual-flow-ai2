# 软件项目结构

## 目录
- src/
  - components/
  - services/
  - utils/
- tests/
- docs/
- config/

## 依赖关系
- components -> services：调用服务
- services -> utils：使用工具函数
- tests -> src：测试源码
- config -> src：配置应用

## 文件类型
- .ts：TypeScript源文件
- .test.ts：测试文件
- .md：文档文件
- .json：配置文件

## 开发流程
1. 编写源码
2. 单元测试
3. 文档更新
4. 代码审查
5. 合并主分支
