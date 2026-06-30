import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import type { FeatureLike } from 'ol/Feature';
import type { ImageMapAnnotation, ImageMapStatus } from '../types/image-map';

const statusColors: Record<ImageMapStatus, string> = {
  normal: '#1f8f5f',
  warning: '#d97706',
  disabled: '#64748b'
};

export function createAnnotationStyle(feature: FeatureLike, selectedId: string | null): Style {
  const annotation = feature.get('imageMapAnnotation') as ImageMapAnnotation | undefined;
  const isSelected = annotation?.id === selectedId;
  const color = statusColors[annotation?.status ?? 'normal'];

  if (annotation?.type === 'point') {
    return new Style({
      image: new CircleStyle({
        radius: isSelected ? 8 : 6,
        fill: new Fill({ color }),
        stroke: new Stroke({
          color: '#ffffff',
          width: isSelected ? 3 : 2
        })
      })
    });
  }

  return new Style({
    fill: new Fill({
      color: withAlpha(color, isSelected ? 0.28 : 0.16)
    }),
    stroke: new Stroke({
      color,
      width: isSelected ? 3 : 2
    }),
    text: new Text({
      text: annotation?.name ?? '',
      font: '600 14px "Microsoft YaHei", "Segoe UI", sans-serif',
      fill: new Fill({ color: '#1f2937' }),
      stroke: new Stroke({
        color: 'rgba(255, 255, 255, 0.88)',
        width: 4
      }),
      overflow: true
    })
  });
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
