/**
 * ECG-Lab - Type definitions
 */

export type PathologyType =
  | 'normal'
  | 'atrial-fibrillation'
  | 'sinus-tachycardia'
  | 'sinus-bradycardia'
  | 'atrial-flutter'
  | 'ventricular-tachycardia'
  | 'ventricular-fibrillation'
  | 'hyperkalaemia';

export interface ECGConfig {
  pathology: PathologyType;
  heartRate?: number;
  amplitude?: number;
  noise?: number;
  sampleRate?: number;
}

export interface PathologyModifiers {
  pWaveAmplitude?: number;
  pWavePresent?: boolean;
  prInterval?: number;
  qrsWidth?: number;
  qrsAmplitude?: number;
  stSegmentPresent?: boolean;
  stSegmentDuration?: number;
  tWaveAmplitude?: number;
  tWaveWidth?: number;
  tWaveTented?: boolean;
  baselineNoise?: number;
  irregularity?: number;
}

export interface ECGOptions {
  canvas: HTMLCanvasElement;
  pathology?: PathologyType;
  heartRate?: number;
  amplitude?: number;
  noise?: number;
}

export interface ECGInstance {
  setPathology(pathology: PathologyType): void;
  setHeartRate(rate: number): void;
  setAmplitude(amplitude: number): void;
  setNoise(noise: number): void;
  getHeartRate(): number;
  getPathology(): PathologyType;
  destroy(): void;
}

