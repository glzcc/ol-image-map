# OL Image Map 地图组件实现计划

**目标：** 制作一个基于 OpenLayers 的平面图片地图组件，用于在一张底图上进行区域标注和位置标注，并且可以被 Vue、React、原生 JavaScript 项目复用。

**总体架构：** 地图能力拆成两层：底层是与框架无关的 OpenLayers 核心类，负责底图渲染、标注渲染、绘制、选择、编辑、导入导出；上层提供 Vue、React、原生 JavaScript 三种适配方式。业务侧只需要监听绘制/编辑完成事件，统一保存标注数据。

**技术栈：** TypeScript、OpenLayers、Vite、Vue 示例、React 示例、原生 JavaScript 示例、Vitest、Playwright。

---

## 一、产品范围

第一版重点做“可复用图片地图组件”，不是完整后台系统。

核心能力：

- 加载一张平面底图，例如户型图、商场楼层图、工厂平面图、园区地图、停车场地图。
- 使用 OpenLayers 坐标系统，内部坐标原点为左下角。
- 支持平移、缩放、适配视图。
- 支持区域标注，例如房间、楼层分区、管控区域、危险区域。
- 支持位置标注，例如设备、入口、摄像头、传感器、人员、工位。
- 支持点击选择标注，并向外抛出选中对象。
- 支持绘制完成后统一抛出标注数据，由业务方保存。
- 支持编辑已有标注，并在编辑完成后抛出更新数据。
- 支持删除选中标注。
- 支持导入、导出统一 JSON 数据。

第一版暂不做：

- 后端存储。
- 权限系统。
- 多人协同编辑。
- 多楼层切换。
- 真实地理坐标投影。
- CAD 文件解析。

## 二、推荐架构

推荐采用“核心引擎 + 框架适配”的方式。

核心引擎不依赖 Vue 或 React，只接收一个 DOM 容器和配置项：

```ts
const map = new OlImageMapCore(container, {
  imageUrl: '/floor-plan.png',
  imageWidth: 451,
  imageHeight: 451,
  annotations: []
});
```

Vue、React、原生 JavaScript 都只负责：

- 创建容器 DOM。
- 初始化 `OlImageMapCore`。
- 传入底图和标注数据。
- 监听 `select`、`create`、`update`、`delete` 等事件。
- 在组件销毁时调用 `destroy()`。

这样地图能力只写一遍，后续要接入不同项目时，成本最低。

## 三、数据模型

统一使用以下标注数据结构。所有坐标都使用 OpenLayers 内部坐标，也就是左下角为原点。

```ts
export type ImageMapAnnotation =
  | ImageMapPointAnnotation
  | ImageMapRegionAnnotation;

export interface ImageMapBaseAnnotation {
  id: string;
  type: 'point' | 'region';
  name: string;
  category?: string;
  status?: 'normal' | 'warning' | 'disabled';
  properties?: Record<string, unknown>;
}

export interface ImageMapPointAnnotation extends ImageMapBaseAnnotation {
  type: 'point';
  coordinate: [number, number];
}

export interface ImageMapRegionAnnotation extends ImageMapBaseAnnotation {
  type: 'region';
  coordinates: [number, number][];
}

export interface ImageMapConfig {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  annotations: ImageMapAnnotation[];
}
```

坐标约定：

- 内部统一使用 OpenLayers 坐标。
- 原点在图片左下角。
- X 轴向右增加。
- Y 轴向上增加。
- 如果业务系统已有左上角图片坐标，可以额外提供转换工具，但不作为内部存储格式。

## 四、事件接口

核心类需要提供事件监听能力：

```ts
map.on('select', annotation => {});
map.on('create', annotation => {});
map.on('update', annotation => {});
map.on('delete', annotation => {});
map.on('change', annotations => {});
```

事件说明：

- `select`：用户点击选中某个标注。
- `create`：用户绘制完成一个点位或区域。
- `update`：用户编辑某个标注完成。
- `delete`：用户删除某个标注。
- `change`：标注集合发生变化，适合业务方做统一保存。

保存策略：

- 组件内部只维护当前标注状态。
- 业务方监听 `change` 或手动调用 `getAnnotations()`。
- 绘制、编辑、删除完成后，由业务方统一保存到后端或本地文件。
- 组件不直接绑定任何后端 API。

## 五、核心 API 设计

```ts
export class OlImageMapCore {
  constructor(container: HTMLElement, options: OlImageMapOptions);

  setMode(mode: ImageMapMode): void;
  setAnnotations(annotations: ImageMapAnnotation[]): void;
  getAnnotations(): ImageMapAnnotation[];
  addAnnotation(annotation: ImageMapAnnotation): void;
  updateAnnotation(annotation: ImageMapAnnotation): void;
  removeAnnotation(id: string): void;
  selectAnnotation(id: string | null): void;
  fitToImage(): void;
  exportConfig(): ImageMapConfig;
  importConfig(config: ImageMapConfig): void;
  on(eventName: ImageMapEventName, handler: ImageMapEventHandler): void;
  off(eventName: ImageMapEventName, handler: ImageMapEventHandler): void;
  destroy(): void;
}
```

地图模式：

```ts
export type ImageMapMode =
  | 'select'
  | 'pan'
  | 'draw-point'
  | 'draw-region'
  | 'edit';
```

## 六、目录结构建议

```txt
ol-image-map/
  docs/
    plans/
      2026-06-30-ol-image-map-implementation.md
  public/
    floor-plan-demo.png
  src/
    core/
      OlImageMapCore.ts
      createMap.ts
      layers.ts
      styles.ts
      interactions.ts
      events.ts
    adapters/
      vue/
        OlImageMap.vue
      react/
        OlImageMapReact.tsx
      vanilla/
        createOlImageMap.ts
    lib/
      annotationFeatures.ts
      annotationJson.ts
      coordinates.ts
    types/
      image-map.ts
    examples/
      vue/
        App.vue
        main.ts
      react/
        App.tsx
        main.tsx
      vanilla/
        index.html
        main.ts
    styles/
      image-map.css
  tests/
    image-map.spec.ts
```

## 七、分阶段实现计划

### 阶段 1：项目基础

创建 Vite + TypeScript 项目，安装 OpenLayers、Vue、React、测试工具。

需要完成：

- 初始化 `package.json`。
- 配置 TypeScript。
- 配置 Vite。
- 准备示例底图资源。
- 准备基础样式。
- 能启动本地示例页面。

### 阶段 2：OpenLayers 核心底图

先实现框架无关的 `OlImageMapCore`。

需要完成：

- 接收 DOM 容器。
- 创建 OpenLayers Map。
- 使用 `ImageLayer` + `ImageStatic` 渲染平面图片。
- 设置图片范围 `[0, 0, imageWidth, imageHeight]`。
- 初始化 View 并适配到底图范围。
- 提供 `fitToImage()` 和 `destroy()`。

### 阶段 3：标注渲染

实现点位和区域标注的展示。

需要完成：

- 点位标注转 OpenLayers `Point`。
- 区域标注转 OpenLayers `Polygon`。
- 创建 VectorLayer 承载所有标注。
- 为不同类型和状态提供样式。
- 选中状态使用高亮样式。
- 支持 `setAnnotations()` 和 `getAnnotations()`。

### 阶段 4：选择和事件系统

实现统一事件接口。

需要完成：

- 点击地图时判断命中的 Feature。
- 命中后触发 `select`。
- 无命中时取消选中。
- 实现 `on()` 和 `off()`。
- 标注变化时触发 `change`。

### 阶段 5：绘制点位

实现位置标注绘制。

需要完成：

- 增加 `draw-point` 模式。
- 点击地图生成点位草稿。
- 草稿包含 `id`、`type`、`coordinate`。
- 触发 `create`。
- 将新增标注加入内部状态。
- 触发 `change`。

### 阶段 6：绘制区域

实现区域标注绘制。

需要完成：

- 增加 `draw-region` 模式。
- 使用 OpenLayers `Draw` interaction 绘制 Polygon。
- 绘制完成后转换成区域标注。
- 触发 `create`。
- 将新增标注加入内部状态。
- 触发 `change`。
- 切换模式时正确清理绘制交互。

### 阶段 7：编辑和删除

实现对已有标注的更新。

需要完成：

- 增加 `edit` 模式。
- 使用 OpenLayers `Modify` interaction。
- 编辑完成后更新对应 annotation。
- 触发 `update`。
- 触发 `change`。
- 提供 `removeAnnotation(id)`。
- 删除后触发 `delete` 和 `change`。

### 阶段 8：导入导出

实现统一保存格式。

需要完成：

- `exportConfig()` 返回完整 `ImageMapConfig`。
- `importConfig(config)` 加载底图和标注。
- 编写 JSON 校验函数。
- 提供下载 JSON 的示例。
- 提供上传 JSON 的示例。

### 阶段 9：Vue 适配器

实现 Vue 使用方式。

需要完成：

- 创建 `OlImageMap.vue`。
- 使用 `ref` 获取容器。
- 在 `onMounted` 初始化核心类。
- 在 `onBeforeUnmount` 销毁核心类。
- 将核心事件转成 Vue emit。
- 示例中展示工具栏、右侧详情、保存按钮。

### 阶段 10：React 适配器

实现 React 使用方式。

需要完成：

- 创建 `OlImageMapReact.tsx`。
- 使用 `useRef` 获取容器。
- 使用 `useEffect` 初始化和销毁核心类。
- 通过 props 接收事件回调。
- 示例中展示工具栏、右侧详情、保存按钮。

### 阶段 11：原生 JavaScript 适配器

实现无框架使用方式。

需要完成：

- 创建 `createOlImageMap()`。
- 返回核心实例。
- 提供 `vanilla/index.html` 示例。
- 示例中展示基础工具栏和保存按钮。

### 阶段 12：测试和文档

需要完成：

- 测试标注和 Feature 的互相转换。
- 测试 JSON 导入导出。
- 测试坐标转换工具。
- 使用 Playwright 做基础渲染测试。
- 使用 Playwright 测试绘制一个点位。
- 编写中文 `README.md`。

## 八、示例界面建议

示例页面不做宣传页，打开后直接是可操作地图。

布局建议：

- 顶部工具栏：选择、拖动、点位、区域、编辑、删除、适配视图、导入、导出、保存。
- 中间主区域：OpenLayers 地图画布。
- 右侧面板：当前选中标注详情、名称、类型、状态、坐标。
- 底部或右侧列表：全部标注列表。

## 九、样式建议

样式要让底图保持清晰。

- 区域填充使用低透明度。
- 区域边框清晰但不要过粗。
- 选中区域使用更明显的边框。
- 点位用小圆点或图标。
- 不同状态使用不同颜色。
- 禁用状态降低透明度。
- 警告状态使用醒目但克制的颜色。

## 十、待确认事项

当前已确认：

- 需要 Vue、React、原生 JavaScript 都可以用。
- 绘制完成后预留接口，由业务方统一保存。
- 内部统一使用 OpenLayers 坐标。

后续实现前建议再确认：

- 第一版是否需要内置属性编辑表单，还是只抛出标注对象给业务方处理？
- 点位是否需要支持自定义图标？
- 区域是否需要支持颜色、透明度、边框样式由业务方配置？
- 是否需要支持只读模式？
- 保存按钮是示例层提供，还是核心层提供 `save` 事件即可？

