/**
 * ECG-Lab - Canvas renderer for ECG waveforms
 */

import type { ECGConfig, PathologyType } from '../core/types';
import { generateECGComplex } from '../core/generator';

/**
 * Internal renderer class that handles canvas rendering and animation
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private config: ECGConfig;
  private targetPathology: PathologyType;

  // ECG display constants
  private readonly pixelsPerMM = 4;
  private readonly amplitude = 10 * this.pixelsPerMM;
  private readonly pixelsPerSecond = 25 * 4; // 100 pixels/second (25mm/s * 4px/mm)
  private readonly timePerPixel = 1 / this.pixelsPerSecond; // 0.01 seconds per pixel
  private readonly sweepBarWidth = 40;

  // State
  private waveformBuffer: Float32Array;
  private sweepPosition: number = 0;
  private lastUpdateTime: number = 0;
  private sampleTime: number = 0;
  private lastSweepX: number = -1;
  private lastHeartRate: number = 72;
  private phaseOffset: number = 0;

  private resizeObserver: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement, config: ECGConfig) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D rendering context');
    }
    this.ctx = ctx;
    this.config = config;
    this.targetPathology = config.pathology;
    this.lastHeartRate = config.heartRate || 72;
    
    this.waveformBuffer = new Float32Array(2000);
    this.waveformBuffer.fill(NaN);

    this.setupCanvas();
    this.startAnimation();
  }

  private setupCanvas() {
    const resizeCanvas = () => {
      const container = this.canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
      } else {
        const width = this.canvas.clientWidth || 800;
        const height = this.canvas.clientHeight || 200;
        this.canvas.width = width;
        this.canvas.height = height;
      }
      this.ensureBufferSize();
      this.draw();
    };

    resizeCanvas();

    if (typeof ResizeObserver !== 'undefined') {
      const container = this.canvas.parentElement || document.body;
      this.resizeObserver = new ResizeObserver(resizeCanvas);
      this.resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', resizeCanvas);
    }
  }

  private ensureBufferSize() {
    const width = this.canvas.width;
    if (this.waveformBuffer.length !== width) {
      const oldBuffer = this.waveformBuffer;
      this.waveformBuffer = new Float32Array(width);
      this.waveformBuffer.fill(NaN);
      
      const copyLength = Math.min(oldBuffer.length, width);
      for (let i = 0; i < copyLength; i++) {
        if (!isNaN(oldBuffer[i])) {
          this.waveformBuffer[i] = oldBuffer[i];
        }
      }
    }
  }

  /**
   * Calculate time for a given pixel position accounting for wraps
   */
  private getTimeForPixel(xPos: number, width: number): number {
    const totalPixelsTraveled = this.sampleTime * this.pixelsPerSecond;
    const wraps = Math.floor(totalPixelsTraveled / width);
    return (wraps * width + xPos) / this.pixelsPerSecond;
  }

  /**
   * Generate and store ECG sample at a specific pixel position
   */
  private updateBufferAtPosition(xPos: number, width: number, centerY: number): void {
    if (xPos < 0 || xPos >= width) return;
    
    const sampleTime = this.getTimeForPixel(xPos, width);
    const value = this.generateSampleAtTime(sampleTime);
    const yPos = centerY - (value * this.amplitude);
    this.waveformBuffer[xPos] = yPos;
  }

  /**
   * Update buffer for a range of pixel positions
   */
  private updateBufferRange(startX: number, endX: number, width: number, centerY: number): void {
    const start = Math.max(0, Math.floor(startX));
    const end = Math.min(width - 1, Math.floor(endX));
    
    for (let xPos = start; xPos <= end; xPos++) {
      this.updateBufferAtPosition(xPos, width, centerY);
    }
  }

  /**
   * Handle sweep wrap - update buffer for wrapped region
   */
  private handleSweepWrap(startX: number, endX: number, width: number, centerY: number): void {
    // Update end of previous cycle
    this.updateBufferRange(startX, width - 1, width, centerY);
    // Update start of new cycle
    this.updateBufferRange(0, endX, width, centerY);
  }

  /**
   * Update phase offset when heart rate changes to maintain continuity
   */
  private updatePhaseOffset(sweepX: number, width: number): void {
    const currentHeartRate = this.config.heartRate || 72;
    if (currentHeartRate === this.lastHeartRate) return;

    const currentTime = Math.floor(sweepX) * this.timePerPixel;
    const oldSecondsPerBeat = 60 / this.lastHeartRate;
    const newSecondsPerBeat = 60 / currentHeartRate;
    
    const oldPhase = (currentTime % oldSecondsPerBeat) / oldSecondsPerBeat;
    const newPhase = (currentTime % newSecondsPerBeat) / newSecondsPerBeat;
    
    this.phaseOffset = (oldPhase - newPhase + 1) % 1;
    this.lastHeartRate = currentHeartRate;
  }

  /**
   * Generate ECG sample value for a given time
   */
  private generateSampleAtTime(timeInSeconds: number, pathology?: PathologyType): number {
    const samplePathology = pathology || this.targetPathology;
    const heartRate = this.config.heartRate || 72;
    const secondsPerBeat = 60 / heartRate;
    let phase = (timeInSeconds % secondsPerBeat) / secondsPerBeat;
    
    phase = (phase + this.phaseOffset) % 1;
    
    // Calculate beat number for amplitude variation
    const beatNumber = Math.floor(timeInSeconds / secondsPerBeat);
    
    const configForSample: ECGConfig = {
      ...this.config,
      pathology: samplePathology,
      heartRate,
    };
    
    return generateECGComplex(phase, configForSample, beatNumber);
  }

  /**
   * Update sweep position and generate new samples
   */
  private updateSweep(width: number, centerY: number, deltaTimeSeconds: number): void {
    this.sweepPosition += this.pixelsPerSecond * deltaTimeSeconds;
    
    if (this.sweepPosition >= width) {
      this.sweepPosition %= width;
      this.lastSweepX = -1;
    }
    
    this.sampleTime += deltaTimeSeconds;
    
    const sweepX = this.sweepPosition;
    this.updatePhaseOffset(sweepX, width);
    
    // Generate samples for pixels the sweep moved through
    if (this.lastSweepX < 0) {
      this.updateBufferRange(0, sweepX, width, centerY);
    } else {
      const startX = Math.floor(this.lastSweepX);
      const endX = Math.floor(sweepX);
      
      if (endX < startX) {
        this.handleSweepWrap(startX, endX, width, centerY);
      } else {
        this.updateBufferRange(startX, endX, width, centerY);
      }
    }
    
    this.lastSweepX = sweepX;
  }

  /**
   * Draw the baseline (center line)
   */
  private drawBaseline(ctx: CanvasRenderingContext2D, width: number, centerY: number): void {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  }

  /**
   * Draw the ECG waveform from buffer
   */
  private drawWaveform(ctx: CanvasRenderingContext2D, width: number): void {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    let isFirstPoint = true;
    let lastValidX = -1;

    for (let x = 0; x < width; x++) {
      const y = this.waveformBuffer[x];
      
      if (!isNaN(y)) {
        if (isFirstPoint) {
          ctx.moveTo(x, y);
          isFirstPoint = false;
        } else if (x === lastValidX + 1) {
          ctx.lineTo(x, y);
        } else {
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
        lastValidX = x;
      } else if (!isFirstPoint) {
        ctx.stroke();
        ctx.beginPath();
        isFirstPoint = true;
        lastValidX = -1;
      }
    }

    ctx.stroke();
  }

  /**
   * Draw the sweep bar (clear/erase effect)
   */
  private drawSweepBar(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const sweepX = this.sweepPosition;
    const sweepBarLeft = Math.max(0, Math.floor(sweepX - this.sweepBarWidth / 2));
    const sweepBarRight = Math.min(width, Math.ceil(sweepX + this.sweepBarWidth / 2));

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(sweepBarLeft, 0, sweepBarRight - sweepBarLeft, height);
    ctx.globalCompositeOperation = 'source-over';
  }

  private draw() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const centerY = height / 2;

    const currentTime = performance.now();
    if (this.lastUpdateTime === 0) {
      this.lastUpdateTime = currentTime;
      this.sampleTime = 0;
      this.sweepPosition = 0;
      this.lastSweepX = -1;
    }

    this.ensureBufferSize();

    const deltaTime = currentTime - this.lastUpdateTime;
    const deltaTimeSeconds = deltaTime / 1000;
    this.lastUpdateTime = currentTime;

    this.updateSweep(width, centerY, deltaTimeSeconds);

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw components
    this.drawBaseline(ctx, width, centerY);
    this.drawWaveform(ctx, width);
    this.drawSweepBar(ctx, width, height);
  }

  private animate = () => {
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private startAnimation() {
    this.lastUpdateTime = 0;
    this.sampleTime = 0;
    this.sweepPosition = 0;
    this.lastSweepX = -1;
    this.lastHeartRate = this.config.heartRate || 72;
    this.phaseOffset = 0;
    this.waveformBuffer.fill(NaN);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  updateConfig(config: ECGConfig) {
    this.config = config;
  }

  updatePathology(pathology: PathologyType) {
    this.targetPathology = pathology;
  }

  updateHeartRate(heartRate: number) {
    this.config = { ...this.config, heartRate };
  }

  updateAmplitude(amplitude: number) {
    this.config = { ...this.config, amplitude };
  }

  updateNoise(noise: number) {
    this.config = { ...this.config, noise };
  }

  getHeartRate(): number {
    return this.config.heartRate || 72;
  }

  getPathology(): PathologyType {
    return this.targetPathology;
  }

  destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.waveformBuffer.fill(NaN);
  }
}
