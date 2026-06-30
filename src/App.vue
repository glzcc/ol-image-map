<template>
  <main class="app-shell">
    <header class="toolbar">
      <div class="toolbar__group">
        <button
          v-for="item in modes"
          :key="item.mode"
          class="tool-button"
          :class="{ 'tool-button--active': mode === item.mode }"
          type="button"
          @click="mode = item.mode"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="toolbar__group">
        <button class="tool-button" type="button" @click="fitToImage">适配</button>
        <button class="tool-button" type="button" :disabled="!selected" @click="deleteSelected">
          删除
        </button>
      </div>

      <div class="toolbar__group">
        <button class="tool-button" type="button" @click="downloadJson">导出</button>
        <label class="tool-button tool-button--file">
          导入
          <input hidden type="file" accept="application/json" @change="importJson" />
        </label>
        <button class="tool-button" type="button" @click="saveAnnotations">保存</button>
      </div>
    </header>

    <section class="workspace">
      <div class="map-stage">
        <OlImageMap
          :image-url="config.imageUrl"
          :image-width="config.imageWidth"
          :image-height="config.imageHeight"
          :annotations="annotations"
          :mode="mode"
          @ready="imageMap = $event"
          @select="selected = $event"
          @change="handleChange"
        />
      </div>

      <aside class="side-panel">
        <section class="panel-section">
          <h2>选中标注</h2>
          <p v-if="!selected" class="empty-state">请选择或绘制一个标注</p>

          <template v-else>
            <div class="field">
              <label for="name">名称</label>
              <input id="name" v-model="selectedDraft.name" @change="updateSelected" />
            </div>
          </template>
        </section>

        <section class="panel-section">
          <h2>全部标注</h2>
          <div class="annotation-list">
            <button
              v-for="annotation in annotations"
              :key="annotation.id"
              class="annotation-item"
              :class="{ 'annotation-item--active': selected?.id === annotation.id }"
              type="button"
              @click="selectAnnotation(annotation.id)"
            >
              <span>{{ annotation.name }}</span>
              <span class="annotation-type">{{ annotation.type === 'point' ? '点位' : '区域' }}</span>
            </button>
          </div>
        </section>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import OlImageMap from './adapters/vue/OlImageMap.vue';
import type { OlImageMapCore } from './core/OlImageMapCore';
import { parseImageMapConfig, serializeImageMapConfig } from './lib/annotationJson';
import type { ImageMapAnnotation, ImageMapConfig, ImageMapMode } from './types/image-map';

const config = reactive<ImageMapConfig>({
  imageUrl: `${import.meta.env.BASE_URL}floor-plan-demo.svg`,
  imageWidth: 451,
  imageHeight: 451,
  annotations: []
});

const annotations = ref<ImageMapAnnotation[]>([
  {
    id: 'region-living',
    type: 'region',
    name: '客厅',
    category: 'room',
    status: 'normal',
    coordinates: [
      [265, 107],
      [359, 107],
      [359, 357],
      [265, 357]
    ]
  },
  {
    id: 'region-kitchen',
    type: 'region',
    name: '厨房',
    category: 'room',
    status: 'warning',
    coordinates: [
      [207, 96],
      [265, 96],
      [265, 211],
      [207, 211]
    ]
  },
  {
    id: 'point-door',
    type: 'point',
    name: '入户门',
    category: 'entrance',
    status: 'normal',
    coordinate: [391, 90]
  }
]);

const modes: { mode: ImageMapMode; label: string }[] = [
  { mode: 'select', label: '选择' },
  { mode: 'pan', label: '拖动' },
  { mode: 'draw-point', label: '点位' },
  { mode: 'draw-region', label: '区域' },
  { mode: 'edit', label: '编辑' }
];

const mode = ref<ImageMapMode>('select');
const selected = ref<ImageMapAnnotation | null>(null);
const imageMap = ref<OlImageMapCore | null>(null);
const selectedDraft = reactive({
  name: ''
});

watch(selected, annotation => {
  selectedDraft.name = annotation?.name ?? '';
});

function handleChange(nextAnnotations: ImageMapAnnotation[]): void {
  annotations.value = nextAnnotations;
  if (selected.value) {
    selected.value = nextAnnotations.find(annotation => annotation.id === selected.value?.id) ?? null;
  }
}

function updateSelected(): void {
  if (!selected.value) {
    return;
  }

  const updated = {
    ...selected.value,
    name: selectedDraft.name
  } as ImageMapAnnotation;

  imageMap.value?.updateAnnotation(updated);
  selected.value = updated;
}

function selectAnnotation(id: string): void {
  imageMap.value?.selectAnnotation(id);
}

function deleteSelected(): void {
  if (!selected.value) {
    return;
  }

  imageMap.value?.removeAnnotation(selected.value.id);
}

function fitToImage(): void {
  imageMap.value?.fitToImage();
}

function saveAnnotations(): void {
  const payload = imageMap.value?.exportConfig();
  if (!payload) {
    return;
  }

  window.localStorage.setItem('ol-image-map-config', serializeImageMapConfig(payload));
}

function downloadJson(): void {
  const payload = imageMap.value?.exportConfig();
  if (!payload) {
    return;
  }

  const blob = new Blob([serializeImageMapConfig(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'image-map-config.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function importJson(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  try {
    const imported = parseImageMapConfig(await file.text());
    config.imageUrl = imported.imageUrl;
    config.imageWidth = imported.imageWidth;
    config.imageHeight = imported.imageHeight;
    annotations.value = imported.annotations;
    imageMap.value?.importConfig(imported);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '导入失败');
  } finally {
    input.value = '';
  }
}
</script>
