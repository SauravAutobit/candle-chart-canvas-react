import * as PIXI from 'pixi.js';

interface ZoomPanConfig {
  minZoom: number;
  maxZoom: number;
  zoomSpeed: number;
}

export class ChartInteractions {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private isDragging = false;
  private lastPointerPosition = { x: 0, y: 0 };
  private config: ZoomPanConfig;

  constructor(app: PIXI.Application, container: PIXI.Container, config?: Partial<ZoomPanConfig>) {
    this.app = app;
    this.container = container;
    this.config = {
      minZoom: 0.1,
      maxZoom: 10,
      zoomSpeed: 0.15,
      ...config
    };

    this.setupInteractions();
    console.log('Chart interactions initialized with canvas/camera model');
  }

  private setupInteractions() {
    // Make the stage interactive
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    // Add zoom functionality with mouse wheel
    this.app.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // Add pan functionality with mouse drag
    this.app.stage.on('pointerdown', this.onPointerDown.bind(this));
    this.app.stage.on('pointermove', this.onPointerMove.bind(this));
    this.app.stage.on('pointerup', this.onPointerUp.bind(this));
    this.app.stage.on('pointerupoutside', this.onPointerUp.bind(this));
  }

  private handleWheel(event: WheelEvent) {
    event.preventDefault();
    
    const delta = event.deltaY;
    const zoomFactor = delta > 0 ? (1 - this.config.zoomSpeed) : (1 + this.config.zoomSpeed);
    
    // Get mouse position relative to the canvas
    const rect = this.app.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate new scale
    const newScaleX = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, this.container.scale.x * zoomFactor));
    const newScaleY = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, this.container.scale.y * zoomFactor));
    
    // Only allow zooming if the scale actually changes
    if (newScaleX !== this.container.scale.x) {
      // Calculate the point in container coordinates before scaling
      const localPoint = this.container.toLocal({ x: mouseX, y: mouseY });
      
      // Apply the new scale
      this.container.scale.set(newScaleX, newScaleY);
      
      // Calculate the point in container coordinates after scaling
      const newLocalPoint = this.container.toLocal({ x: mouseX, y: mouseY });
      
      // Adjust position to keep the mouse point stationary (camera movement)
      this.container.x += (newLocalPoint.x - localPoint.x) * this.container.scale.x;
      this.container.y += (newLocalPoint.y - localPoint.y) * this.container.scale.y;

      console.log(`Camera zoom: ${newScaleX.toFixed(2)}x`);
    }
  }

  private onPointerDown(event: PIXI.FederatedPointerEvent) {
    this.isDragging = true;
    this.lastPointerPosition = { x: event.global.x, y: event.global.y };
    this.app.stage.cursor = 'grabbing';
    console.log('Camera pan started');
  }

  private onPointerMove(event: PIXI.FederatedPointerEvent) {
    if (this.isDragging) {
      const deltaX = event.global.x - this.lastPointerPosition.x;
      const deltaY = event.global.y - this.lastPointerPosition.y;
      
      // Move the camera (container) - this is like moving the viewport
      this.container.x += deltaX;
      this.container.y += deltaY;
      
      this.lastPointerPosition = { x: event.global.x, y: event.global.y };
    }
  }

  private onPointerUp() {
    if (this.isDragging) {
      console.log('Camera pan ended');
    }
    this.isDragging = false;
    this.app.stage.cursor = 'default';
  }

  public destroy() {
    // Clean up event listeners
    this.app.canvas.removeEventListener('wheel', this.handleWheel.bind(this));
    this.app.stage.off('pointerdown', this.onPointerDown.bind(this));
    this.app.stage.off('pointermove', this.onPointerMove.bind(this));
    this.app.stage.off('pointerup', this.onPointerUp.bind(this));
    this.app.stage.off('pointerupoutside', this.onPointerUp.bind(this));
  }

  public resetZoom() {
    this.container.scale.set(1, 1);
    // Reset to show the most recent data (right side of chart)
    this.container.position.set(50, 50);
    console.log('Camera reset to default position');
  }
}
