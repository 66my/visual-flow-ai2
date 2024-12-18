# 使用示例

## 1. 基础用法

### 准备数据
创建一个包含中药信息的Markdown文件 `data.md`：
```markdown
# 药名：肉桂
- 性味：辛甘热
- 归经：肾、脾、心、肝经
- 功效：补火助阳，散寒止痛，温通经脉
- 主治：虚寒证
```

### 生成图表
```bash
node generate_diagram.js
```

### 渲染图表
```bash
node render_diagram.js
```

## 2. 自定义图表

### ER图示例
```javascript
erDiagram
    MEDICINE ||--o{ PRESCRIPTION : contains
    PRESCRIPTION ||--|{ FORMULATION : has
    PRESCRIPTION ||--|{ EFFECT : provides
```

### 思维导图示例
```javascript
graph TB
    M1[肉桂]:::medicineNode
    F1[性味]:::propertyNode
    E1[功效]:::effectNode
```

## 3. 批量处理

### 处理多个药材
```bash
# 准备数据文件
data/
  ├── 肉桂.md
  ├── 当归.md
  └── 人参.md

# 批量生成（开发中）
node generate_diagram.js --batch data/
```

## 4. 导出选项

### PNG格式
```bash
node render_diagram.js --format png
```

### SVG格式（开发中）
```bash
node render_diagram.js --format svg
```

## 5. 样式定制

### 自定义配置
创建 `custom-config.json`：
```json
{
  "theme": "forest",
  "themeVariables": {
    "fontSize": "18px",
    "fontFamily": "Arial"
  }
}
```

### 应用配置
```bash
node render_diagram.js --config custom-config.json
```
