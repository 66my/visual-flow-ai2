# API 文档

## Zhipu AI API

### 配置
```javascript
const API_KEY = process.env.ZHIPU_API_KEY;
```

### 主要功能

#### 1. 文本解析
从中医药文本中提取关键信息。

#### 2. 图表生成
支持生成多种类型的图表：
- ER图
- 思维导图
- 序列图（开发中）

## Mermaid.js 配置

### 图表样式
可以通过 `mermaid-config.json` 自定义：
```json
{
  "theme": "default",
  "themeVariables": {
    "fontSize": "16px"
  }
}
```

### 输出设置
- 分辨率：2048x1536
- 格式：PNG
- 背景：透明
