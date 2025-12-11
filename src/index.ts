/**
 * ECG-Lab - A lightweight ECG waveform simulator library
 * 
 * This library simulates Lead II ECG waveforms with various pathologies.
 * It renders real-time ECG waveforms to an HTML5 canvas element.
 */

import type { PathologyType, ECGOptions, ECGInstance, ECGConfig } from './core/types';
import { getPathologyConfig, getPathologyDisplayName } from './core/pathologies';
import { CanvasRenderer } from './renderer/canvas-renderer';

// Re-export types for convenience
export type { PathologyType, ECGOptions, ECGInstance };

// Re-export utility function
export { getPathologyDisplayName };

/**
 * Supported pathology types as constants
 */
export const PATHOLOGIES = {
  NORMAL: 'normal' as const,
  ATRIAL_FIBRILLATION: 'atrial-fibrillation' as const,
  SINUS_TACHYCARDIA: 'sinus-tachycardia' as const,
  SINUS_BRADYCARDIA: 'sinus-bradycardia' as const,
  ATRIAL_FLUTTER: 'atrial-flutter' as const,
  VENTRICULAR_TACHYCARDIA: 'ventricular-tachycardia' as const,
  VENTRICULAR_FIBRILLATION: 'ventricular-fibrillation' as const,
  HYPERKALAEMIA: 'hyperkalaemia' as const,
} as const;

/**
 * Validate and clamp heart rate to reasonable range
 */
function validateHeartRate(rate: number): number {
  if (rate < 30) {
    console.warn(`Heart rate ${rate} is too low, clamping to 30 bpm`);
    return 30;
  }
  if (rate > 300) {
    console.warn(`Heart rate ${rate} is too high, clamping to 300 bpm`);
    return 300;
  }
  return rate;
}

/**
 * Validate pathology type, fallback to 'normal' if invalid
 */
function validatePathology(pathology: string | undefined): PathologyType {
  const validPathologies: PathologyType[] = [
    'normal',
    'atrial-fibrillation',
    'sinus-tachycardia',
    'sinus-bradycardia',
    'atrial-flutter',
    'ventricular-tachycardia',
    'ventricular-fibrillation',
    'hyperkalaemia',
  ];

  if (!pathology || !validPathologies.includes(pathology as PathologyType)) {
    if (pathology) {
      console.warn(`Invalid pathology "${pathology}", using "normal" instead`);
    }
    return 'normal';
  }

  return pathology as PathologyType;
}

/**
 * Create an ECG instance that renders to a canvas element
 * 
 * @param options - Configuration options for the ECG instance
 * @returns An ECGInstance with methods to control the waveform
 * 
 * @example
 * ```typescript
 * const canvas = document.getElementById('ecg-canvas') as HTMLCanvasElement;
 * const ecg = createECG({
 *   canvas,
 *   pathology: 'normal',
 *   heartRate: 72
 * });
 * ```
 */
export function createECG(options: ECGOptions): ECGInstance {
  const { canvas } = options;

  if (!canvas) {
    throw new Error('Canvas element is required');
  }

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Canvas must be an HTMLCanvasElement');
  }

  const pathology = validatePathology(options.pathology);
  const baseConfig = getPathologyConfig(pathology);

  // Merge user options with pathology defaults
  const config: ECGConfig = {
    pathology,
    heartRate: validateHeartRate(options.heartRate ?? baseConfig.heartRate ?? 72),
    amplitude: options.amplitude ?? baseConfig.amplitude ?? 1.0,
    noise: options.noise ?? baseConfig.noise ?? 0.02,
    sampleRate: baseConfig.sampleRate ?? 250,
  };

  const renderer = new CanvasRenderer(canvas, config);

  return {
    /**
     * Change the pathology type
     */
    setPathology(newPathology: PathologyType): void {
      const validatedPathology = validatePathology(newPathology);
      const pathologyConfig = getPathologyConfig(validatedPathology);
      
      // Update config with pathology defaults, but preserve user overrides
      config.pathology = validatedPathology;
      config.heartRate = validateHeartRate(config.heartRate ?? pathologyConfig.heartRate ?? 72);
      config.amplitude = config.amplitude ?? pathologyConfig.amplitude ?? 1.0;
      config.noise = config.noise ?? pathologyConfig.noise ?? 0.02;
      
      renderer.updateConfig(config);
      renderer.updatePathology(validatedPathology);
    },

    /**
     * Change the heart rate (beats per minute)
     */
    setHeartRate(rate: number): void {
      const validatedRate = validateHeartRate(rate);
      config.heartRate = validatedRate;
      renderer.updateHeartRate(validatedRate);
    },

    /**
     * Change the waveform amplitude
     */
    setAmplitude(amplitude: number): void {
      if (amplitude <= 0) {
        console.warn('Amplitude must be greater than 0, using 0.1');
        amplitude = 0.1;
      }
      config.amplitude = amplitude;
      renderer.updateAmplitude(amplitude);
    },

    /**
     * Change the noise level
     */
    setNoise(noise: number): void {
      if (noise < 0) {
        console.warn('Noise cannot be negative, using 0');
        noise = 0;
      }
      config.noise = noise;
      renderer.updateNoise(noise);
    },

    /**
     * Get the current heart rate
     */
    getHeartRate(): number {
      return renderer.getHeartRate();
    },

    /**
     * Get the current pathology type
     */
    getPathology(): PathologyType {
      return renderer.getPathology();
    },

    /**
     * Clean up resources and stop rendering
     */
    destroy(): void {
      renderer.destroy();
    },
  };
}

