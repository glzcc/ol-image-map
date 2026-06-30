import './styles/image-map.css';

export { OlImageMapCore } from './core/OlImageMapCore';
export { createOlImageMap } from './adapters/vanilla/createOlImageMap';
export { default as OlImageMapVue } from './adapters/vue/OlImageMap.vue';
export { OlImageMapReact } from './adapters/react/OlImageMapReact';
export * from './types/image-map';
export * from './lib/annotationJson';
export * from './lib/coordinates';
