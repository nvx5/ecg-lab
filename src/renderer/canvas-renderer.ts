/**
 * ECG-Lab - Canvas renderer for ECG waveforms
 */

import type { ECGConfig, PathologyType } from '../core/types';
import { generateECGComplex } from '../core/generator';
import { getPathologyConfig } from '../core/pathologies';

interface WaveformSample {
  time: number;
  value: number;
  pathology: PathologyType;
}

/**
 * Internal renderer class that handles canvas rendering and animation
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private config: ECGConfig;
  private targetPathology: PathologyType;

  private readonly paperSpeed = 25; // mm/s
  private readonly pixelsPerMM = 4;
  private readonly pixelsPerSecond = this.paperSpeed * this.pixelsPerMM;
  private readonly sampleRate = 250;

  private startTime = 0;
  private waveformSamples: WaveformSample[] = [];
  private readonly maxBufferSize: number;

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
    this.maxBufferSize = Math.ceil(10 * this.sampleRate);

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
        // If no parent, use canvas's own dimensions
        const width = this.canvas.clientWidth || 800;
        const height = this.canvas.clientHeight || 200;
        this.canvas.width = width;
        this.canvas.height = height;
      }
      this.draw();
    };

    resizeCanvas();

    // Use ResizeObserver if available, fallback to window resize
    if (typeof ResizeObserver !== 'undefined') {
      const container = this.canvas.parentElement || document.body;
      this.resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      this.resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', resizeCanvas);
    }
  }

  private generateSampleAtTime(timeInSeconds: number, pathology?: PathologyType): number {
    const samplePathology = pathology || this.targetPathology;
    // Always use the current config's heart rate (user-specified or current value)
    const heartRate = this.config.heartRate || 72;
    const secondsPerBeat = 60 / heartRate;
    const phase = (timeInSeconds % secondsPerBeat) / secondsPerBeat;
    
    // Use current config but override pathology for this sample
    const configForSample: ECGConfig = {
      ...this.config,
      pathology: samplePathology,
      heartRate: heartRate,
    };
    
    return generateECGComplex(phase, configForSample);
  }

  private ensureBufferFilled(currentTime: number, canvasWidth: number) {
    const currentPixelPosition = currentTime * this.pixelsPerSecond;
    const viewportStartPixel = currentPixelPosition - canvasWidth;
    const viewportEndPixel = currentPixelPosition;

    const viewportStartTime = viewportStartPixel / this.pixelsPerSecond;
    const viewportEndTime = viewportEndPixel / this.pixelsPerSecond;

    const lookAheadSeconds = 5;
    const lookBehindSeconds = 2;
    const neededStartTime = viewportStartTime - lookBehindSeconds;
    const neededEndTime = viewportEndTime + lookAheadSeconds;

    const newSamplePathology = this.targetPathology;

    if (this.waveformSamples.length === 0) {
      const startSampleTime = Math.floor(neededStartTime * this.sampleRate) / this.sampleRate;
      const totalSamples = Math.ceil((neededEndTime - startSampleTime) * this.sampleRate);

      for (let i = 0; i <= totalSamples; i++) {
        const sampleTime = startSampleTime + (i / this.sampleRate);
        if (sampleTime <= neededEndTime) {
          const value = this.generateSampleAtTime(sampleTime, newSamplePathology);
          this.waveformSamples.push({ time: sampleTime, value, pathology: newSamplePathology });
        }
      }
    } else {
      const firstSampleTime = this.waveformSamples[0].time;
      const lastSampleTime = this.waveformSamples[this.waveformSamples.length - 1].time;

      if (firstSampleTime > neededStartTime) {
        const samplesToAdd = Math.ceil((firstSampleTime - neededStartTime) * this.sampleRate);
        const existingPathology = this.waveformSamples[0].pathology;
        for (let i = samplesToAdd; i > 0; i--) {
          const sampleTime = firstSampleTime - (i / this.sampleRate);
          const value = this.generateSampleAtTime(sampleTime, existingPathology);
          this.waveformSamples.unshift({ time: sampleTime, value, pathology: existingPathology });
        }
      }

      if (lastSampleTime < neededEndTime) {
        const samplesToAdd = Math.ceil((neededEndTime - lastSampleTime) * this.sampleRate);
        for (let i = 1; i <= samplesToAdd; i++) {
          const sampleTime = lastSampleTime + (i / this.sampleRate);
          if (sampleTime <= neededEndTime) {
            const value = this.generateSampleAtTime(sampleTime, newSamplePathology);
            this.waveformSamples.push({ time: sampleTime, value, pathology: newSamplePathology });
          }
        }
      }
    }

    const cutoffTime = viewportStartTime - 1;
    while (this.waveformSamples.length > 0 && this.waveformSamples[0].time < cutoffTime) {
      this.waveformSamples.shift();
    }

    if (this.waveformSamples.length > this.maxBufferSize) {
      this.waveformSamples.shift();
    }
  }

  private draw() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    const currentTime = performance.now();
    if (this.startTime === 0) {
      this.startTime = currentTime;
    }

    const elapsedSeconds = (currentTime - this.startTime) / 1000;

    this.ensureBufferFilled(elapsedSeconds, width);

    // Clear canvas with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (this.waveformSamples.length === 0) return;

    const centerY = height / 2;
    const amplitude = 10 * this.pixelsPerMM;

    // Draw center line (baseline)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    const currentPixelPosition = elapsedSeconds * this.pixelsPerSecond;
    const viewportStartPixel = currentPixelPosition - width;
    const viewportEndPixel = currentPixelPosition;

    // Draw waveform
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    let isFirstPoint = true;

    const sampleCount = this.waveformSamples.length;
    if (sampleCount === 0) return;

    // Binary search for start index
    let startIdx = 0;
    let endIdx = sampleCount - 1;
    let low = 0;
    let high = sampleCount - 1;

    while (low < high) {
      const mid = (low + high) >> 1;
      const samplePixel = this.waveformSamples[mid].time * this.pixelsPerSecond;
      if (samplePixel < viewportStartPixel) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    startIdx = Math.max(0, low - 1);

    // Binary search for end index
    low = startIdx;
    high = sampleCount - 1;
    while (low < high) {
      const mid = (low + high) >> 1;
      const samplePixel = this.waveformSamples[mid].time * this.pixelsPerSecond;
      if (samplePixel <= viewportEndPixel) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    endIdx = Math.min(sampleCount - 1, low);

    // Draw waveform line
    for (let i = startIdx; i <= endIdx; i++) {
      const sample = this.waveformSamples[i];
      const samplePixelPosition = sample.time * this.pixelsPerSecond;

      const canvasX = width - (viewportEndPixel - samplePixelPosition);
      const canvasY = centerY - (sample.value * amplitude);

      if (canvasX >= -1 && canvasX <= width + 1) {
        if (isFirstPoint) {
          ctx.moveTo(canvasX, canvasY);
          isFirstPoint = false;
        } else {
          ctx.lineTo(canvasX, canvasY);
        }
      }
    }

    ctx.stroke();
  }

  private animate = () => {
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private startAnimation() {
    this.startTime = 0;
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  updateConfig(config: ECGConfig) {
    this.config = config;
  }

  updatePathology(pathology: PathologyType) {
    this.targetPathology = pathology;
    // Clear buffer to regenerate with new pathology
    this.waveformSamples = [];
    this.startTime = 0;
  }

  updateHeartRate(heartRate: number) {
    this.config = { ...this.config, heartRate };
    // Clear buffer to regenerate with new heart rate
    this.waveformSamples = [];
    this.startTime = 0;
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

    this.waveformSamples = [];
  }
}

