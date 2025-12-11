/**
 * ECG-Lab - Waveform generation functions
 */

import type { ECGConfig, PathologyModifiers } from './types';
import { getPathologyModifiers } from './pathologies';

/**
 * Generate P wave component
 */
export function generatePWave(phase: number, modifiers: PathologyModifiers = {}): number {
  const { pWaveAmplitude = 1.0, pWavePresent = true } = modifiers;
  if (!pWavePresent || pWaveAmplitude === 0) return 0;

  const pStart = 0;
  const pEnd = 0.14;

  if (phase >= pStart && phase < pEnd) {
    const pPhase = (phase - pStart) / (pEnd - pStart);
    return Math.sin(pPhase * Math.PI) * 0.15 * pWaveAmplitude;
  }
  return 0;
}

/**
 * Generate PR segment component
 */
export function generatePRSegment(phase: number, modifiers: PathologyModifiers = {}): number {
  const { prInterval = 1.0 } = modifiers;
  const prStart = 0.14;
  const prEnd = 0.14 + (0.06 * prInterval);
  return (phase >= prStart && phase < prEnd) ? 0 : 0;
}

/**
 * Generate QRS complex component
 */
export function generateQRSComplex(phase: number, modifiers: PathologyModifiers = {}): number {
  const { qrsWidth = 1.0, qrsAmplitude = 1.0 } = modifiers;

  const qrsStart = 0.20;
  const qrsDuration = 0.08 * qrsWidth;
  const qrsEnd = qrsStart + qrsDuration;

  if (phase >= qrsStart && phase < qrsEnd) {
    const qrsPhase = (phase - qrsStart) / qrsDuration;

    if (qrsPhase < 0.12) {
      const qPhase = qrsPhase / 0.12;
      return -0.10 * qPhase * qrsAmplitude;
    } else if (qrsPhase < 0.50) {
      const rPhase = (qrsPhase - 0.12) / 0.38;
      if (rPhase < 0.5) {
        const rValue = -0.10 + 1.10 * (rPhase * 2);
        return rValue * qrsAmplitude;
      } else {
        const rValue = 1.0 - 1.0 * ((rPhase - 0.5) * 2);
        return rValue * qrsAmplitude;
      }
    } else if (qrsPhase < 0.75) {
      const sPhase = (qrsPhase - 0.50) / 0.25;
      const sStart = 0;
      const sTrough = -0.10;
      return (sStart - (sStart - sTrough) * sPhase) * qrsAmplitude;
    } else {
      const returnPhase = (qrsPhase - 0.75) / 0.25;
      const sTrough = -0.10;
      return sTrough * (1 - returnPhase) * qrsAmplitude;
    }
  }
  return 0;
}

/**
 * Generate ST segment component
 */
export function generateSTSegment(phase: number, modifiers: PathologyModifiers = {}): number {
  const { stSegmentPresent = true, stSegmentDuration = 1.0, qrsWidth = 1.0 } = modifiers;
  if (!stSegmentPresent) return 0;

  const qrsEnd = 0.20 + (0.08 * qrsWidth);
  const stStart = qrsEnd;
  const stEnd = stStart + (0.12 * stSegmentDuration);

  return (phase >= stStart && phase < stEnd) ? 0 : 0;
}

/**
 * Generate T wave component
 */
export function generateTWave(phase: number, modifiers: PathologyModifiers = {}): number {
  const {
    tWaveAmplitude = 1.0,
    tWaveWidth = 1.0,
    tWaveTented = false,
    qrsWidth = 1.0,
    stSegmentDuration = 1.0
  } = modifiers;

  const stEnd = 0.20 + (0.08 * qrsWidth) + (0.12 * stSegmentDuration);
  const tStart = stEnd;
  const tEnd = tStart + (0.20 * tWaveWidth);

  if (phase >= tStart && phase < tEnd) {
    const tPhase = (phase - tStart) / (tEnd - tStart);
    const baseAmplitude = tWaveTented ? 0.4 : 0.25;
    return Math.sin(tPhase * Math.PI) * baseAmplitude * tWaveAmplitude;
  }
  return 0;
}

/**
 * Generate complete ECG complex for a given phase
 */
export function generateECGComplex(phase: number, config: ECGConfig): number {
  const { pathology, amplitude = 1.0, noise = 0.02 } = config;
  const normalizedPhase = phase % 1;

  const modifiers = getPathologyModifiers(pathology);

  let value = 0;

  value += generatePWave(normalizedPhase, modifiers);
  value += generatePRSegment(normalizedPhase, modifiers);
  value += generateQRSComplex(normalizedPhase, modifiers);
  value += generateSTSegment(normalizedPhase, modifiers);
  value += generateTWave(normalizedPhase, modifiers);

  // Special handling for atrial flutter
  if (pathology === 'atrial-flutter') {
    if (normalizedPhase < 0.20) {
      const flutterCycles = 3;
      const flutterPhase = (normalizedPhase % (0.20 / flutterCycles)) / (0.20 / flutterCycles);
      value = (flutterPhase < 0.5 ? flutterPhase * 0.4 : (1 - flutterPhase) * 0.4) - 0.2;
      value += generatePRSegment(normalizedPhase, modifiers);
      value += generateQRSComplex(normalizedPhase, modifiers);
      value += generateSTSegment(normalizedPhase, modifiers);
      value += generateTWave(normalizedPhase, modifiers);
    }
  }

  // Special handling for ventricular fibrillation
  if (pathology === 'ventricular-fibrillation') {
    value = (Math.random() - 0.5) * 1.2;
  }

  const totalNoise = noise + (modifiers.baselineNoise || 0);
  value += (Math.random() - 0.5) * totalNoise;

  return value * amplitude;
}

