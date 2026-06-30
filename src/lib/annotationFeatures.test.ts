import { describe, expect, it } from 'vitest';
import { annotationToFeature, featureToAnnotation } from './annotationFeatures';
import type { ImageMapPointAnnotation, ImageMapRegionAnnotation } from '../types/image-map';

describe('annotationFeatures', () => {
  it('converts point annotations to features and back', () => {
    const annotation: ImageMapPointAnnotation = {
      id: 'point-1',
      type: 'point',
      name: '摄像头',
      coordinate: [10, 20]
    };

    const feature = annotationToFeature(annotation);

    expect(featureToAnnotation(feature)).toEqual(annotation);
  });

  it('converts region annotations to features and back without storing the closing point', () => {
    const annotation: ImageMapRegionAnnotation = {
      id: 'region-1',
      type: 'region',
      name: '客厅',
      coordinates: [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10]
      ]
    };

    const feature = annotationToFeature(annotation);

    expect(featureToAnnotation(feature)).toEqual(annotation);
  });
});
