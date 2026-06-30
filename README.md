# OL Image Map

基于 OpenLayers 的平面图片地图组件。适合在户型图、楼层图、园区图、工厂平面图等图片底图上做区域标注和位置标注。

[在线 Demo](https://glzcc.github.io/ol-image-map/)

![OL Image Map 示例界面](https://raw.githubusercontent.com/glzcc/ol-image-map/main/docs/assets/ol-image-map-demo.png)

## 特性

- 使用普通图片作为底图。
- 内部统一使用 OpenLayers 坐标，原点在图片左下角。
- 支持点位标注和区域标注。
- 支持选择、绘制、编辑、删除。
- 支持导入、导出 JSON。
- 核心能力与框架无关。
- 提供 Vue、React、原生 JavaScript 三种接入方式。

## 开发

```bash
npm install
npm run dev
```

打开本地开发地址后，可以直接在示例户型图上绘制点位和区域。

## Demo 部署

本仓库已配置 GitHub Pages 自动部署。推送到 `main` 后，GitHub Actions 会构建示例页面并发布到：

```text
https://glzcc.github.io/ol-image-map/
```

如果首次使用，需要在 GitHub 仓库的 `Settings -> Pages` 中把 `Source` 设置为 `GitHub Actions`。

## 构建和测试

```bash
npm run build
npm test
```

## 作为 npm 包使用

安装：

```bash
npm install @gl-zcc/ol-image-map ol
```

Vue 项目需要同时安装 Vue，React 项目需要同时安装 React 和 ReactDOM。样式可以直接导入：

```ts
import '@gl-zcc/ol-image-map/style.css';
```

## 发布到 npm

发布前检查：

```bash
npm run build
npm test
npm pack --dry-run
```

首次发布：

```bash
npm login --registry=https://registry.npmjs.org/
npm publish --access public --registry=https://registry.npmjs.org/
```

后续发布前需要提升版本号：

```bash
npm version patch
npm publish --access public --registry=https://registry.npmjs.org/
```

当前包配置会把 `dist`、`README.md` 和 `LICENSE` 发布出去。`dist` 由 `npm run build` 生成，包含 ESM、CommonJS、类型声明和样式文件。

如果本机 registry 配成了国内镜像，例如 `https://registry.npmmirror.com/`，发布前可以临时切到 npm 官方源：

```bash
npm config set registry https://registry.npmjs.org/
```

## 核心用法

```ts
import { OlImageMapCore } from '@gl-zcc/ol-image-map';

const imageMap = new OlImageMapCore(document.querySelector('#map')!, {
  imageUrl: '/floor-plan.png',
  imageWidth: 451,
  imageHeight: 451,
  annotations: []
});

imageMap.setMode('draw-region');

imageMap.on('change', annotations => {
  // 在这里统一保存到后端或本地文件
  console.log(annotations);
});
```

## Vue 用法

```vue
<OlImageMap
  image-url="/floor-plan.png"
  :image-width="451"
  :image-height="451"
  :annotations="annotations"
  :mode="mode"
  @change="annotations = $event"
/>
```

## React 用法

```tsx
<OlImageMapReact
  imageUrl="/floor-plan.png"
  imageWidth={451}
  imageHeight={451}
  annotations={annotations}
  mode={mode}
  onChange={setAnnotations}
/>
```

## 原生 JavaScript 用法

```ts
import { createOlImageMap } from '@gl-zcc/ol-image-map';

const imageMap = createOlImageMap('#map', {
  imageUrl: '/floor-plan.png',
  imageWidth: 451,
  imageHeight: 451,
  annotations: []
});
```

## 标注数据格式

```ts
type ImageMapAnnotation = ImageMapPointAnnotation | ImageMapRegionAnnotation;

interface ImageMapPointAnnotation {
  id: string;
  type: 'point';
  name: string;
  category?: string;
  status?: 'normal' | 'warning' | 'disabled';
  coordinate: [number, number];
}

interface ImageMapRegionAnnotation {
  id: string;
  type: 'region';
  name: string;
  category?: string;
  status?: 'normal' | 'warning' | 'disabled';
  coordinates: [number, number][];
}
```

## 保存方式

组件不会直接请求后端。业务系统可以监听 `change` 事件，或在保存按钮中调用 `exportConfig()`，再统一保存。

```ts
const payload = imageMap.exportConfig();
await fetch('/api/image-map', {
  method: 'POST',
  body: JSON.stringify(payload)
});
```
