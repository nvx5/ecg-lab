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
      modifiers = {};
      break;

    case 'sinus-bradycardia':
      modifiers = {};
      break;

    case 'sinus-arrhythmia':
      modifiers = {
        irregularity: 0.15, // Variation in RR intervals >10%
      };
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
        pWavePresent: false, // Replaced by flutter waves
        baselineNoise: 0.05,
      };
      break;

    case 'atrial-premature-beat':
      // APBs are intermittent by nature - appear occasionally
      modifiers = {
        pWaveAmplitude: 0.7,
        pWaveWidth: 0.8,
        irregularity: 0.3,
        abnormalityFrequency: 0.15, // ~15% of beats are premature
        abnormalityPattern: 'random', // Random occurrence
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

    case 'ventricular-premature-beat':
      // VPBs are intermittent by nature - appear occasionally
      modifiers = {
        pWavePresent: false,
        qrsWidth: 1.5,
        qrsAmplitude: 1.3,
        stSegmentPresent: true,
        tWaveInverted: true,
        abnormalityFrequency: 0.12, // ~12% of beats are premature
        abnormalityPattern: 'random', // Random occurrence, sometimes clustered
      };
      break;

    case 'first-degree-av-block':
      modifiers = {
        prInterval: 1.5, // Prolonged PR >0.20s (normal 0.12-0.20s)
      };
      break;

    case 'second-degree-av-block-type1':
      // Wenckebach: Progressive PR lengthening then dropped QRS
      modifiers = {
        prInterval: 1.2, // Starting PR interval
        prIntervalVariation: 0.3, // Progressive lengthening
        droppedBeats: 0.25, // Every 4th beat dropped (typical)
      };
      break;

    case 'second-degree-av-block-type2':
      // Fixed PR interval, sudden dropped QRS
      modifiers = {
        prInterval: 1.0, // Normal or slightly prolonged
        droppedBeats: 0.33, // Every 3rd beat dropped (can vary)
      };
      break;

    case 'third-degree-av-block':
      // Complete heart block - AV dissociation
      modifiers = {
        avDissociation: true,
        ventricularRate: 40, // Ventricular escape rhythm (30-50 bpm)
      };
      break;

    case 'left-bundle-branch-block':
      // LBBB is usually consistent but can be intermittent in some cases
      modifiers = {
        qrsWidth: 1.5, // Wide QRS >0.12s
        qrsMorphology: 'lbbb', // M pattern
        stSegmentPresent: true,
        tWaveInverted: true, // Discordant T wave
        abnormalityFrequency: 0.95, // Usually consistent, but can be intermittent
        abnormalityPattern: 'random', // Rarely intermittent
      };
      break;

    case 'right-bundle-branch-block':
      // RBBB is usually consistent but can be intermittent in some cases
      modifiers = {
        qrsWidth: 1.5, // Wide QRS >0.12s
        qrsMorphology: 'rbbb', // RSR' pattern
        stSegmentPresent: true,
        tWaveInverted: true, // Discordant T wave
        abnormalityFrequency: 0.95, // Usually consistent, but can be intermittent
        abnormalityPattern: 'random', // Rarely intermittent
      };
      break;

    case 'wolff-parkinson-white':
      // WPW: Intermittent preexcitation - delta wave appears every 3-5 beats typically
      // Not perfectly periodic - can vary based on conduction through accessory pathway
      modifiers = {
        prInterval: 0.7, // Short PR <0.12s (only when preexcited)
        deltaWave: true, // Slurred upstroke (intermittent)
        qrsWidth: 1.2, // Slightly widened QRS (only when preexcited)
        abnormalityFrequency: 0.22, // ~22% of beats show preexcitation (roughly every 3-5 beats)
        abnormalityPattern: 'random', // Not perfectly periodic - varies with conduction
      };
      break;

    case 'left-ventricular-hypertrophy':
      modifiers = {
        qrsAmplitude: 1.5, // Increased QRS voltage
        qrsWidth: 1.1,
        stSegmentElevation: -0.15, // ST depression
        tWaveInverted: true,
      };
      break;

    case 'right-ventricular-hypertrophy':
      modifiers = {
        qrsAmplitude: 1.2,
        qrsWidth: 1.1,
        stSegmentElevation: -0.1, // ST depression
        tWaveInverted: true,
      };
      break;

    case 'st-elevation-mi':
      // ST elevation can vary slightly beat-to-beat, Q waves may not be in every beat initially
      modifiers = {
        stSegmentElevation: 0.25, // ST elevation >1mm
        stSegmentDuration: 1.2,
        tWaveInverted: true, // Can be inverted in evolution
        qrsMorphology: 'pathological-q', // Pathological Q waves may develop
        abnormalityFrequency: 0.85, // Most beats show ST elevation, some variation
        abnormalityPattern: 'random', // Slight beat-to-beat variation
      };
      break;

    case 'st-depression-ischemia':
      // Ischemic ST changes can vary with each beat
      modifiers = {
        stSegmentElevation: -0.15, // ST depression >0.5mm
        stSegmentDuration: 1.1,
        tWaveInverted: true,
        abnormalityFrequency: 0.75, // Most beats show depression, some variation
        abnormalityPattern: 'random', // Varies beat-to-beat
      };
      break;

    case 'pathological-q-waves':
      // Pathological Q waves are usually consistent but can vary in depth
      modifiers = {
        qrsMorphology: 'pathological-q', // Deep and wide Q waves
        qrsWidth: 1.2,
        stSegmentElevation: -0.1, // May have ST depression
        tWaveInverted: true,
        abnormalityFrequency: 0.9, // Most beats show Q waves, slight variation
        abnormalityPattern: 'random', // Slight variation in depth
      };
      break;

    case 'long-qt-syndrome':
      modifiers = {
        qtInterval: 1.4, // Prolonged QT (normal QTc = 0.42s)
        tWaveAmplitude: 1.2,
        tWaveWidth: 1.3,
      };
      break;

    case 'hyperkalaemia':
      modifiers = {
        pWaveAmplitude: 0.3, // Flattened P waves
        pWavePresent: true,
        qrsWidth: 1.5, // Wide QRS
        stSegmentPresent: false,
        tWaveAmplitude: 1.8, // Tall, tented T waves
        tWaveWidth: 1.2,
        tWaveTented: true,
      };
      break;

    case 'right-atrial-hypertrophy':
      modifiers = {
        pWaveAmplitude: 1.5, // Tall P waves >2.5mm
        pWaveWidth: 1.0,
        pWavePresent: true,
      };
      break;

    case 'left-atrial-hypertrophy':
      modifiers = {
        pWaveAmplitude: 1.0,
        pWaveWidth: 1.4, // Wide P waves >0.11s
        pWavePresent: true,
      };
      break;
  }

  pathologyModifiersCache.set(pathology, modifiers);
  return modifiers;
}

export const PATHOLOGY_DEFAULTS: Record<PathologyType, Partial<ECGConfig>> = {
  normal: { heartRate: 72, amplitude: 1.0, noise: 0.02 },
  'sinus-tachycardia': { heartRate: 120, amplitude: 1.0, noise: 0.03 },
  'sinus-bradycardia': { heartRate: 50, amplitude: 1.0, noise: 0.02 },
  'sinus-arrhythmia': { heartRate: 70, amplitude: 1.0, noise: 0.02 },
  'atrial-fibrillation': { heartRate: 100, amplitude: 0.8, noise: 0.15 },
  'atrial-flutter': { heartRate: 75, amplitude: 0.9, noise: 0.05 },
  'atrial-premature-beat': { heartRate: 75, amplitude: 1.0, noise: 0.03 },
  'ventricular-tachycardia': { heartRate: 180, amplitude: 1.5, noise: 0.1 },
  'ventricular-fibrillation': { heartRate: 300, amplitude: 0.5, noise: 0.3 },
  'ventricular-premature-beat': { heartRate: 75, amplitude: 1.2, noise: 0.05 },
  'first-degree-av-block': { heartRate: 70, amplitude: 1.0, noise: 0.02 },
  'second-degree-av-block-type1': { heartRate: 70, amplitude: 1.0, noise: 0.02 },
  'second-degree-av-block-type2': { heartRate: 70, amplitude: 1.0, noise: 0.02 },
  'third-degree-av-block': { heartRate: 70, amplitude: 1.0, noise: 0.02 },
  'left-bundle-branch-block': { heartRate: 72, amplitude: 1.0, noise: 0.02 },
  'right-bundle-branch-block': { heartRate: 72, amplitude: 1.0, noise: 0.02 },
  'wolff-parkinson-white': { heartRate: 75, amplitude: 1.0, noise: 0.02 },
  'left-ventricular-hypertrophy': { heartRate: 72, amplitude: 1.0, noise: 0.02 },
  'right-ventricular-hypertrophy': { heartRate: 72, amplitude: 1.0, noise: 0.02 },
  'st-elevation-mi': { heartRate: 75, amplitude: 1.0, noise: 0.03 },
  'st-depression-ischemia': { heartRate: 75, amplitude: 1.0, noise: 0.03 },
  'pathological-q-waves': { heartRate: 72, amplitude: 1.0, noise: 0.02 },
  'long-qt-syndrome': { heartRate: 70, amplitude: 1.0, noise: 0.02 },
  'hyperkalaemia': { heartRate: 70, amplitude: 1.0, noise: 0.03 },
  'right-atrial-hypertrophy': { heartRate: 72, amplitude: 1.0, noise: 0.02 },
  'left-atrial-hypertrophy': { heartRate: 72, amplitude: 1.0, noise: 0.02 },
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
    'sinus-tachycardia': 'Sinus Tachycardia',
    'sinus-bradycardia': 'Sinus Bradycardia',
    'sinus-arrhythmia': 'Sinus Arrhythmia',
    'atrial-fibrillation': 'Atrial Fibrillation',
    'atrial-flutter': 'Atrial Flutter',
    'atrial-premature-beat': 'Atrial Premature Beat',
    'ventricular-tachycardia': 'Ventricular Tachycardia',
    'ventricular-fibrillation': 'Ventricular Fibrillation',
    'ventricular-premature-beat': 'Ventricular Premature Beat',
    'first-degree-av-block': 'First Degree AV Block',
    'second-degree-av-block-type1': 'Second Degree AV Block (Type 1 - Wenckebach)',
    'second-degree-av-block-type2': 'Second Degree AV Block (Type 2)',
    'third-degree-av-block': 'Third Degree AV Block (Complete Heart Block)',
    'left-bundle-branch-block': 'Left Bundle Branch Block (LBBB)',
    'right-bundle-branch-block': 'Right Bundle Branch Block (RBBB)',
    'wolff-parkinson-white': 'Wolff-Parkinson-White Syndrome',
    'left-ventricular-hypertrophy': 'Left Ventricular Hypertrophy',
    'right-ventricular-hypertrophy': 'Right Ventricular Hypertrophy',
    'st-elevation-mi': 'ST Elevation Myocardial Infarction',
    'st-depression-ischemia': 'ST Depression (Ischemia)',
    'pathological-q-waves': 'Pathological Q Waves',
    'long-qt-syndrome': 'Long QT Syndrome',
    'hyperkalaemia': 'Hyperkalaemia',
    'right-atrial-hypertrophy': 'Right Atrial Hypertrophy',
    'left-atrial-hypertrophy': 'Left Atrial Hypertrophy',
  };
  return names[pathology] || pathology;
}

/**
 * Get all available pathologies
 */
export const PATHOLOGIES: PathologyType[] = [
  'normal',
  'sinus-tachycardia',
  'sinus-bradycardia',
  'sinus-arrhythmia',
  'atrial-fibrillation',
  'atrial-flutter',
  'atrial-premature-beat',
  'ventricular-tachycardia',
  'ventricular-fibrillation',
  'ventricular-premature-beat',
  'first-degree-av-block',
  'second-degree-av-block-type1',
  'second-degree-av-block-type2',
  'third-degree-av-block',
  'left-bundle-branch-block',
  'right-bundle-branch-block',
  'wolff-parkinson-white',
  'left-ventricular-hypertrophy',
  'right-ventricular-hypertrophy',
  'st-elevation-mi',
  'st-depression-ischemia',
  'pathological-q-waves',
  'long-qt-syndrome',
  'hyperkalaemia',
  'right-atrial-hypertrophy',
  'left-atrial-hypertrophy',
];
