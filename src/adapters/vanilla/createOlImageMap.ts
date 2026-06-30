import { OlImageMapCore } from '../../core/OlImageMapCore';
import type { OlImageMapOptions } from '../../types/image-map';

export function createOlImageMap(
  container: HTMLElement | string,
  options: OlImageMapOptions
): OlImageMapCore {
  const element =
    typeof container === 'string' ? document.querySelector<HTMLElement>(container) : container;

  if (!element) {
    throw new Error('地图容器不存在');
  }

  return new OlImageMapCore(element, options);
}
