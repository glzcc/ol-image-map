import { describe, expect, it } from 'vitest';
import { parseImageMapConfig, serializeImageMapConfig } from './annotationJson';
import type { ImageMapConfig } from '../types/image-map';

describe('annotationJson', () => {
  it('round trips a valid config', () => {
    const config: ImageMapConfig = {
      imageUrl: '/floor-plan.png',
      imageWidth: 451,
      imageHeight: 451,
      annotations: [
        {
          id: 'point-1',
          type: 'point',
          name: '入口',
          coordinate: [100, 120]
        }
      ]
    };

    expect(parseImageMapConfig(serializeImageMapConfig(config))).toEqual(config);
  });

  it('rejects invalid region coordinates', () => {
    expect(() =>
      parseImageMapConfig(
        JSON.stringify({
          imageUrl: '/floor-plan.png',
          imageWidth: 451,
          imageHeight: 451,
          annotations: [
            {
              id: 'region-1',
              type: 'region',
              name: '区域',
              coordinates: [[0, 0]]
            }
          ]
        })
      )
    ).toThrow('至少需要 3 个坐标点');
  });
});
