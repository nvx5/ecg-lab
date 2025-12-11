/**
 * ECG-Lab - Type definitions
 */

export type PathologyType =
  | 'normal'
  | 'sinus-tachycardia'
  | 'sinus-bradycardia'
  | 'sinus-arrhythmia'
  | 'atrial-fibrillation'
  | 'atrial-flutter'
  | 'atrial-premature-beat'
  | 'ventricular-tachycardia'
  | 'ventricular-fibrillation'
  | 'ventricular-premature-beat'
  | 'first-degree-av-block'
  | 'second-degree-av-block-type1'
  | 'second-degree-av-block-type2'
  | 'third-degree-av-block'
  | 'left-bundle-branch-block'
  | 'right-bundle-branch-block'
  | 'wolff-parkinson-white'
  | 'left-ventricular-hypertrophy'
  | 'right-ventricular-hypertrophy'
  | 'st-elevation-mi'
  | 'st-depression-ischemia'
  | 'pathological-q-waves'
  | 'long-qt-syndrome'
  | 'hyperkalaemia'
  | 'right-atrial-hypertrophy'
  | 'left-atrial-hypertrophy';

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
  pWaveWidth?: number;
  prInterval?: number;
  prIntervalVariation?: number; // For progressive lengthening (Wenckebach)
  qrsWidth?: number;
  qrsAmplitude?: number;
  qrsMorphology?: 'normal' | 'lbbb' | 'rbbb' | 'pathological-q';
  stSegmentPresent?: boolean;
  stSegmentElevation?: number; // Positive = elevation, negative = depression
  stSegmentDuration?: number;
  tWaveAmplitude?: number;
  tWaveWidth?: number;
  tWaveTented?: boolean;
  tWaveInverted?: boolean;
  qtInterval?: number; // Multiplier for QT interval
  baselineNoise?: number;
  irregularity?: number;
  droppedBeats?: number; // Probability/frequency of dropped QRS (for heart blocks)
  avDissociation?: boolean; // For third degree block
  deltaWave?: boolean; // For WPW
  ventricularRate?: number; // For AV blocks with independent rates
  // Intermittency modifiers for single-lead ECG realism
  abnormalityFrequency?: number; // 0-1: probability of abnormality appearing (1.0 = always, 0.2 = 20% of beats)
  abnormalityPattern?: 'random' | 'periodic' | 'clustered'; // How abnormalities appear
  abnormalityCycleLength?: number; // For periodic patterns (e.g., every N beats)
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

