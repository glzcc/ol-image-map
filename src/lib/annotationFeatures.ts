import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import type {
  ImageMapAnnotation,
  ImageMapPointAnnotation,
  ImageMapRegionAnnotation
} from '../types/image-map';

const ANNOTATION_PROPERTY = 'imageMapAnnotation';

export type AnnotationFeature = Feature<Point | Polygon>;

export function annotationToFeature(annotation: ImageMapAnnotation): AnnotationFeature {
  const geometry =
    annotation.type === 'point'
      ? new Point(annotation.coordinate)
      : new Polygon([closeRing(annotation.coordinates)]);

  const feature = new Feature({ geometry }) as AnnotationFeature;
  feature.setId(annotation.id);
  feature.set(ANNOTATION_PROPERTY, annotation);
  return feature;
}

export function featureToAnnotation(feature: AnnotationFeature): ImageMapAnnotation | null {
  const base = feature.get(ANNOTATION_PROPERTY) as ImageMapAnnotation | undefined;
  const geometry = feature.getGeometry();

  if (!base || !geometry) {
    return null;
  }

  if (geometry instanceof Point && base.type === 'point') {
    return {
      ...base,
      coordinate: tuple(geometry.getCoordinates())
    } satisfies ImageMapPointAnnotation;
  }

  if (geometry instanceof Polygon && base.type === 'region') {
    const ring = geometry.getCoordinates()[0] ?? [];
    return {
      ...base,
      coordinates: stripClosingCoordinate(ring).map(tuple)
    } satisfies ImageMapRegionAnnotation;
  }

  return null;
}

export function updateFeatureAnnotation(feature: AnnotationFeature, annotation: ImageMapAnnotation): void {
  feature.set(ANNOTATION_PROPERTY, annotation);
}

export function getFeatureAnnotation(feature: AnnotationFeature): ImageMapAnnotation | null {
  return (feature.get(ANNOTATION_PROPERTY) as ImageMapAnnotation | undefined) ?? null;
}

function closeRing(coordinates: [number, number][]): [number, number][] {
  if (coordinates.length === 0) {
    return coordinates;
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) {
    return coordinates;
  }

  return [...coordinates, first];
}

function stripClosingCoordinate(coordinates: number[][]): number[][] {
  if (coordinates.length < 2) {
    return coordinates;
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) {
    return coordinates.slice(0, -1);
  }

  return coordinates;
}

function tuple(coordinate: number[]): [number, number] {
  return [coordinate[0], coordinate[1]];
}
