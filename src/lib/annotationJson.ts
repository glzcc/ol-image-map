import type { ImageMapAnnotation, ImageMapConfig } from '../types/image-map';

export function serializeImageMapConfig(config: ImageMapConfig): string {
  return JSON.stringify(config, null, 2);
}

export function parseImageMapConfig(json: string): ImageMapConfig {
  const value = JSON.parse(json) as unknown;
  assertImageMapConfig(value);
  return value;
}

export function assertImageMapConfig(value: unknown): asserts value is ImageMapConfig {
  if (!isObject(value)) {
    throw new Error('配置必须是一个对象');
  }

  if (typeof value.imageUrl !== 'string' || value.imageUrl.length === 0) {
    throw new Error('imageUrl 必须是非空字符串');
  }

  if (!isPositiveNumber(value.imageWidth) || !isPositiveNumber(value.imageHeight)) {
    throw new Error('imageWidth 和 imageHeight 必须是正数');
  }

  if (!Array.isArray(value.annotations)) {
    throw new Error('annotations 必须是数组');
  }

  value.annotations.forEach(assertAnnotation);
}

function assertAnnotation(value: unknown): asserts value is ImageMapAnnotation {
  if (!isObject(value)) {
    throw new Error('标注必须是对象');
  }

  if (typeof value.id !== 'string' || typeof value.name !== 'string') {
    throw new Error('标注 id 和 name 必须是字符串');
  }

  if (value.type === 'point') {
    if (!isCoordinate(value.coordinate)) {
      throw new Error(`点位 ${value.id} 的 coordinate 不合法`);
    }
    return;
  }

  if (value.type === 'region') {
    if (!Array.isArray(value.coordinates) || value.coordinates.length < 3) {
      throw new Error(`区域 ${value.id} 至少需要 3 个坐标点`);
    }

    if (!value.coordinates.every(isCoordinate)) {
      throw new Error(`区域 ${value.id} 的 coordinates 不合法`);
    }
    return;
  }

  throw new Error('标注 type 必须是 point 或 region');
}

function isCoordinate(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
