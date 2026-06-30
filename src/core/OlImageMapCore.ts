import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Select from 'ol/interaction/Select';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import Static from 'ol/source/ImageStatic';
import VectorSource from 'ol/source/Vector';
import Projection from 'ol/proj/Projection';
import { click } from 'ol/events/condition';
import type { Coordinate } from 'ol/coordinate';
import type { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import {
  annotationToFeature,
  featureToAnnotation,
  getFeatureAnnotation,
  updateFeatureAnnotation,
  type AnnotationFeature
} from '../lib/annotationFeatures';
import { assertImageMapConfig } from '../lib/annotationJson';
import { createAnnotationId } from '../lib/id';
import type {
  ImageMapAnnotation,
  ImageMapConfig,
  ImageMapEventHandler,
  ImageMapEventName,
  ImageMapMode,
  ImageMapPointAnnotation,
  ImageMapRegionAnnotation,
  OlImageMapOptions
} from '../types/image-map';
import { ImageMapEventBus } from './events';
import { createAnnotationStyle } from './styles';

export class OlImageMapCore {
  private readonly container: HTMLElement;
  private readonly eventBus = new ImageMapEventBus();
  private readonly vectorSource = new VectorSource<AnnotationFeature>();
  private readonly vectorLayer: VectorLayer<VectorSource<AnnotationFeature>>;
  private readonly selectInteraction: Select;
  private readonly extent: [number, number, number, number];
  private projection: Projection;
  private map: Map;
  private drawInteraction: Draw | null = null;
  private modifyInteraction: Modify | null = null;
  private modifyEndKey: EventsKey | null = null;
  private selectedId: string | null = null;
  private mode: ImageMapMode;
  private imageUrl: string;
  private imageWidth: number;
  private imageHeight: number;
  private readonly readonly: boolean;

  constructor(container: HTMLElement, options: OlImageMapOptions) {
    this.container = container;
    this.imageUrl = options.imageUrl;
    this.imageWidth = options.imageWidth;
    this.imageHeight = options.imageHeight;
    this.mode = options.mode ?? 'select';
    this.readonly = options.readonly ?? false;
    this.extent = [0, 0, this.imageWidth, this.imageHeight];
    this.projection = this.createProjection();

    const imageLayer = this.createImageLayer();

    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: feature => createAnnotationStyle(feature, this.selectedId)
    });

    this.selectInteraction = new Select({
      condition: click,
      layers: [this.vectorLayer]
    });

    this.map = new Map({
      target: this.container,
      layers: [imageLayer, this.vectorLayer],
      view: new View({
        projection: this.projection,
        center: [this.imageWidth / 2, this.imageHeight / 2],
        zoom: 2,
        minZoom: -4,
        maxZoom: 8,
        extent: this.extent
      }),
      controls: []
    });

    this.map.addInteraction(this.selectInteraction);
    this.selectInteraction.on('select', event => {
      const feature = event.selected[0] as AnnotationFeature | undefined;
      const annotation = feature ? getFeatureAnnotation(feature) : null;
      this.selectedId = annotation?.id ?? null;
      this.vectorLayer.changed();
      this.eventBus.emit('select', annotation);
    });

    this.setAnnotations(options.annotations);
    this.setMode(this.mode);
    this.fitToImage();
  }

  setMode(mode: ImageMapMode): void {
    this.mode = mode;
    this.clearDrawInteraction();
    this.clearModifyInteraction();
    this.selectInteraction.setActive(mode === 'select' || mode === 'edit');

    if (this.readonly) {
      return;
    }

    if (mode === 'draw-point') {
      this.enablePointDrawing();
    }

    if (mode === 'draw-region') {
      this.enableRegionDrawing();
    }

    if (mode === 'edit') {
      this.enableModify();
    }
  }

  setAnnotations(annotations: ImageMapAnnotation[]): void {
    this.vectorSource.clear();
    this.vectorSource.addFeatures(annotations.map(annotationToFeature));
    this.vectorLayer.changed();
  }

  getAnnotations(): ImageMapAnnotation[] {
    return this.vectorSource
      .getFeatures()
      .map(feature => featureToAnnotation(feature))
      .filter((annotation): annotation is ImageMapAnnotation => annotation !== null);
  }

  addAnnotation(annotation: ImageMapAnnotation): void {
    this.vectorSource.addFeature(annotationToFeature(annotation));
    this.emitChange();
  }

  updateAnnotation(annotation: ImageMapAnnotation): void {
    const feature = this.vectorSource.getFeatureById(annotation.id) as AnnotationFeature | null;
    if (!feature) {
      return;
    }

    const geometry = annotationToFeature(annotation).getGeometry();
    if (geometry) {
      feature.setGeometry(geometry);
    }
    updateFeatureAnnotation(feature, annotation);
    this.eventBus.emit('update', annotation);
    this.emitChange();
    this.vectorLayer.changed();
  }

  removeAnnotation(id: string): void {
    const feature = this.vectorSource.getFeatureById(id) as AnnotationFeature | null;
    if (!feature) {
      return;
    }

    const annotation = getFeatureAnnotation(feature);
    this.vectorSource.removeFeature(feature);
    if (this.selectedId === id) {
      this.selectedId = null;
      this.eventBus.emit('select', null);
    }

    if (annotation) {
      this.eventBus.emit('delete', annotation);
    }
    this.emitChange();
  }

  selectAnnotation(id: string | null): void {
    this.selectedId = id;
    this.selectInteraction.getFeatures().clear();

    if (id) {
      const feature = this.vectorSource.getFeatureById(id) as AnnotationFeature | null;
      if (feature) {
        this.selectInteraction.getFeatures().push(feature);
      }
    }

    const annotation = id
      ? getFeatureAnnotation(this.vectorSource.getFeatureById(id) as AnnotationFeature)
      : null;
    this.vectorLayer.changed();
    this.eventBus.emit('select', annotation);
  }

  fitToImage(): void {
    this.map.getView().fit(this.extent, {
      size: this.map.getSize(),
      padding: [24, 24, 24, 24],
      nearest: true
    });
  }

  exportConfig(): ImageMapConfig {
    return {
      imageUrl: this.imageUrl,
      imageWidth: this.imageWidth,
      imageHeight: this.imageHeight,
      annotations: this.getAnnotations()
    };
  }

  importConfig(config: ImageMapConfig): void {
    assertImageMapConfig(config);
    this.imageUrl = config.imageUrl;
    this.imageWidth = config.imageWidth;
    this.imageHeight = config.imageHeight;
    this.setAnnotations(config.annotations);
    this.emitChange();
  }

  on<T extends ImageMapEventName>(eventName: T, handler: ImageMapEventHandler<T>): void {
    this.eventBus.on(eventName, handler);
  }

  off<T extends ImageMapEventName>(eventName: T, handler: ImageMapEventHandler<T>): void {
    this.eventBus.off(eventName, handler);
  }

  destroy(): void {
    this.clearDrawInteraction();
    this.clearModifyInteraction();
    this.eventBus.clear();
    this.map.setTarget(undefined);
  }

  private createProjection(): Projection {
    return new Projection({
      code: 'ol-image-map',
      units: 'pixels',
      extent: this.extent
    });
  }

  private createImageLayer(): ImageLayer<Static> {
    return new ImageLayer({
      source: new Static({
        url: this.imageUrl,
        projection: this.projection,
        imageExtent: this.extent
      })
    });
  }

  private enablePointDrawing(): void {
    this.map.on('singleclick', this.handlePointClick);
  }

  private readonly handlePointClick = (event: { coordinate: Coordinate }): void => {
    if (this.mode !== 'draw-point') {
      return;
    }

    const annotation: ImageMapPointAnnotation = {
      id: createAnnotationId('point'),
      type: 'point',
      name: '新点位',
      status: 'normal',
      coordinate: [event.coordinate[0], event.coordinate[1]]
    };
    this.vectorSource.addFeature(annotationToFeature(annotation));
    this.eventBus.emit('create', annotation);
    this.emitChange();
  };

  private enableRegionDrawing(): void {
    this.drawInteraction = new Draw({
      source: this.vectorSource,
      type: 'Polygon'
    });

    this.drawInteraction.on('drawend', event => {
      const feature = event.feature as AnnotationFeature;
      const annotation: ImageMapRegionAnnotation = {
        id: createAnnotationId('region'),
        type: 'region',
        name: '新区域',
        status: 'normal',
        coordinates: []
      };
      feature.setId(annotation.id);
      updateFeatureAnnotation(feature, annotation);
      const updated = featureToAnnotation(feature);
      if (!updated || updated.type !== 'region') {
        return;
      }

      updateFeatureAnnotation(feature, updated);
      this.eventBus.emit('create', updated);
      queueMicrotask(() => this.emitChange());
    });

    this.map.addInteraction(this.drawInteraction);
  }

  private enableModify(): void {
    this.modifyInteraction = new Modify({
      features: this.selectInteraction.getFeatures()
    });
    this.modifyEndKey = this.modifyInteraction.on('modifyend', event => {
      event.features.forEach(feature => {
        const annotation = featureToAnnotation(feature as AnnotationFeature);
        if (!annotation) {
          return;
        }

        updateFeatureAnnotation(feature as AnnotationFeature, annotation);
        this.eventBus.emit('update', annotation);
      });
      this.emitChange();
      this.vectorLayer.changed();
    });
    this.map.addInteraction(this.modifyInteraction);
  }

  private clearDrawInteraction(): void {
    this.map.un('singleclick', this.handlePointClick);

    if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
      this.drawInteraction = null;
    }
  }

  private clearModifyInteraction(): void {
    if (this.modifyEndKey) {
      unByKey(this.modifyEndKey);
      this.modifyEndKey = null;
    }

    if (this.modifyInteraction) {
      this.map.removeInteraction(this.modifyInteraction);
      this.modifyInteraction = null;
    }
  }

  private emitChange(): void {
    this.eventBus.emit('change', this.getAnnotations());
  }
}
