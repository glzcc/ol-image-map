import { useEffect, useRef } from 'react';
import { OlImageMapCore } from '../../core/OlImageMapCore';
import type { ImageMapAnnotation, ImageMapMode } from '../../types/image-map';

export interface OlImageMapReactProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  annotations: ImageMapAnnotation[];
  mode?: ImageMapMode;
  readonly?: boolean;
  onReady?: (map: OlImageMapCore) => void;
  onSelect?: (annotation: ImageMapAnnotation | null) => void;
  onCreate?: (annotation: ImageMapAnnotation) => void;
  onUpdate?: (annotation: ImageMapAnnotation) => void;
  onDelete?: (annotation: ImageMapAnnotation) => void;
  onChange?: (annotations: ImageMapAnnotation[]) => void;
}

export function OlImageMapReact({
  imageUrl,
  imageWidth,
  imageHeight,
  annotations,
  mode = 'select',
  readonly = false,
  onReady,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  onChange
}: OlImageMapReactProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<OlImageMapCore | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const imageMap = new OlImageMapCore(containerRef.current, {
      imageUrl,
      imageWidth,
      imageHeight,
      annotations,
      mode,
      readonly
    });
    mapRef.current = imageMap;

    imageMap.on('select', annotation => onSelect?.(annotation));
    imageMap.on('create', annotation => onCreate?.(annotation));
    imageMap.on('update', annotation => onUpdate?.(annotation));
    imageMap.on('delete', annotation => onDelete?.(annotation));
    imageMap.on('change', changedAnnotations => onChange?.(changedAnnotations));
    onReady?.(imageMap);

    return () => {
      imageMap.destroy();
      mapRef.current = null;
    };
  }, [imageUrl, imageWidth, imageHeight, readonly]);

  useEffect(() => {
    mapRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    mapRef.current?.setAnnotations(annotations);
  }, [annotations]);

  return <div ref={containerRef} className="ol-image-map" />;
}
