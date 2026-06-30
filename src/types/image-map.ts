export type ImageMapMode = 'select' | 'pan' | 'draw-point' | 'draw-region' | 'edit';

export type ImageMapStatus = 'normal' | 'warning' | 'disabled';

export type ImageMapAnnotation = ImageMapPointAnnotation | ImageMapRegionAnnotation;

export interface ImageMapBaseAnnotation {
  id: string;
  type: 'point' | 'region';
  name: string;
  category?: string;
  status?: ImageMapStatus;
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

export interface OlImageMapOptions extends ImageMapConfig {
  mode?: ImageMapMode;
  readonly?: boolean;
}

export type ImageMapEventName = 'select' | 'create' | 'update' | 'delete' | 'change';

export type ImageMapEventPayloads = {
  select: ImageMapAnnotation | null;
  create: ImageMapAnnotation;
  update: ImageMapAnnotation;
  delete: ImageMapAnnotation;
  change: ImageMapAnnotation[];
};

export type ImageMapEventHandler<T extends ImageMapEventName = ImageMapEventName> = (
  payload: ImageMapEventPayloads[T]
) => void;
