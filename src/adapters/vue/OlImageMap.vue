<template>
  <div ref="containerRef" class="ol-image-map"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { OlImageMapCore } from '../../core/OlImageMapCore';
import type {
  ImageMapAnnotation,
  ImageMapConfig,
  ImageMapMode
} from '../../types/image-map';

const props = withDefaults(
  defineProps<{
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    annotations: ImageMapAnnotation[];
    mode?: ImageMapMode;
    readonly?: boolean;
  }>(),
  {
    mode: 'select',
    readonly: false
  }
);

const emit = defineEmits<{
  select: [annotation: ImageMapAnnotation | null];
  create: [annotation: ImageMapAnnotation];
  update: [annotation: ImageMapAnnotation];
  delete: [annotation: ImageMapAnnotation];
  change: [annotations: ImageMapAnnotation[]];
  ready: [map: OlImageMapCore];
}>();

const containerRef = ref<HTMLElement | null>(null);
let imageMap: OlImageMapCore | null = null;
let syncingFromCore = false;

onMounted(() => {
  if (!containerRef.value) {
    return;
  }

  imageMap = new OlImageMapCore(containerRef.value, {
    imageUrl: props.imageUrl,
    imageWidth: props.imageWidth,
    imageHeight: props.imageHeight,
    annotations: props.annotations,
    mode: props.mode,
    readonly: props.readonly
  });

  imageMap.on('select', annotation => emit('select', annotation));
  imageMap.on('create', annotation => emit('create', annotation));
  imageMap.on('update', annotation => emit('update', annotation));
  imageMap.on('delete', annotation => emit('delete', annotation));
  imageMap.on('change', annotations => {
    syncingFromCore = true;
    emit('change', annotations);
    queueMicrotask(() => {
      syncingFromCore = false;
    });
  });
  emit('ready', imageMap);
});

watch(
  () => props.mode,
  mode => imageMap?.setMode(mode)
);

watch(
  () => props.annotations,
  annotations => {
    if (!syncingFromCore) {
      imageMap?.setAnnotations(annotations);
    }
  },
  { deep: true }
);

onBeforeUnmount(() => {
  imageMap?.destroy();
  imageMap = null;
});
</script>
