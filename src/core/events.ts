import type {
  ImageMapEventHandler,
  ImageMapEventName,
  ImageMapEventPayloads
} from '../types/image-map';

export class ImageMapEventBus {
  private readonly handlers = new Map<ImageMapEventName, Set<ImageMapEventHandler>>();

  on<T extends ImageMapEventName>(eventName: T, handler: ImageMapEventHandler<T>): void {
    const handlers = this.handlers.get(eventName) ?? new Set();
    handlers.add(handler as ImageMapEventHandler);
    this.handlers.set(eventName, handlers);
  }

  off<T extends ImageMapEventName>(eventName: T, handler: ImageMapEventHandler<T>): void {
    this.handlers.get(eventName)?.delete(handler as ImageMapEventHandler);
  }

  emit<T extends ImageMapEventName>(eventName: T, payload: ImageMapEventPayloads[T]): void {
    this.handlers.get(eventName)?.forEach(handler => {
      (handler as ImageMapEventHandler<T>)(payload);
    });
  }

  clear(): void {
    this.handlers.clear();
  }
}
