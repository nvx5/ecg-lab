/**
 * ECG-Lab - Pathology definitions and modifiers
 */

import type { PathologyType, ECGConfig, PathologyModifiers } from './types';

const pathologyModifiersCache = new Map<PathologyType, PathologyModifiers>();

/**
 * Get pathology-specific modifiers for waveform generation
 */
export function getPathologyModifiers(pathology: PathologyType): PathologyModifiers {
  if (pathologyModifiersCache.has(pathology)) {
    return pathologyModifiersCache.get(pathology)!;
  }

  let modifiers: PathologyModifiers;

  switch (pathology) {
    case 'normal':
    default:
      modifiers = {};
      break;

    case 'sinus-tachycardia':
    case 'sinus-bradycardia':
      modifiers = {};
      break;

    case 'atrial-fibrillation':
      modifiers = {
        pWavePresent: false,
        baselineNoise: 0.15,
        irregularity: 0.8,
      };
      break;

    case 'atrial-flutter':
      modifiers = {
        pWavePresent: false,
        baselineNoise: 0.05,
      };
      break;

    case 'ventricular-tachycardia':
      modifiers = {
        pWavePresent: false,
        qrsWidth: 1.8,
        qrsAmplitude: 1.2,
        stSegmentPresent: false,
        tWaveAmplitude: 0.3,
      };
      break;

    case 'ventricular-fibrillation':
      modifiers = {
        pWavePresent: false,
        qrsWidth: 0,
        stSegmentPresent: false,
        baselineNoise: 0.5,
        irregularity: 1.0,
      };
      break;

    case 'hyperkalaemia':
      modifiers = {
        pWaveAmplitude: 0.3,
        pWavePresent: true,
        qrsWidth: 1.5,
        stSegmentPresent: false,
        tWaveAmplitude: 1.8,
        tWaveWidth: 1.2,
        tWaveTented: true,
      };
      break;
  }

  pathologyModifiersCache.set(pathology, modifiers);
  return modifiers;
}

export const PATHOLOGY_DEFAULTS: Record<PathologyType, Partial<ECGConfig>> = {
  normal: { heartRate: 72, amplitude: 1.0, noise: 0.02 },
  'atrial-fibrillation': { heartRate: 100, amplitude: 0.8, noise: 0.15 },
  'sinus-tachycardia': { heartRate: 120, amplitude: 1.0, noise: 0.03 },
  'sinus-bradycardia': { heartRate: 50, amplitude: 1.0, noise: 0.02 },
  'atrial-flutter': { heartRate: 75, amplitude: 0.9, noise: 0.05 },
  'ventricular-tachycardia': { heartRate: 180, amplitude: 1.5, noise: 0.1 },
  'ventricular-fibrillation': { heartRate: 300, amplitude: 0.5, noise: 0.3 },
  'hyperkalaemia': { heartRate: 70, amplitude: 1.0, noise: 0.03 },
};

const pathologyConfigCache = new Map<PathologyType, ECGConfig>();

/**
 * Get default configuration for a pathology
 */
export function getPathologyConfig(pathology: PathologyType): ECGConfig {
  if (pathologyConfigCache.has(pathology)) {
    return pathologyConfigCache.get(pathology)!;
  }

  const defaults = PATHOLOGY_DEFAULTS[pathology] || PATHOLOGY_DEFAULTS.normal;
  const config: ECGConfig = {
    pathology,
    heartRate: defaults.heartRate || 72,
    amplitude: defaults.amplitude || 1.0,
    noise: defaults.noise || 0.02,
    sampleRate: 250,
  };

  pathologyConfigCache.set(pathology, config);
  return config;
}

/**
 * Get human-readable display name for a pathology
 */
export function getPathologyDisplayName(pathology: PathologyType): string {
  const names: Record<PathologyType, string> = {
    normal: 'Normal Sinus Rhythm',
    'atrial-fibrillation': 'Atrial Fibrillation',
    'sinus-tachycardia': 'Sinus Tachycardia',
    'sinus-bradycardia': 'Sinus Bradycardia',
    'atrial-flutter': 'Atrial Flutter',
    'ventricular-tachycardia': 'Ventricular Tachycardia',
    'ventricular-fibrillation': 'Ventricular Fibrillation',
    'hyperkalaemia': 'Hyperkalaemia',
  };
  return names[pathology] || pathology;
}

