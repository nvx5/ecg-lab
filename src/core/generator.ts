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
export function generatePRSegment(phase: number, modifiers: PathologyModifiers = {}, beatNumber: number = 0): number {
  const { 
    prInterval = 1.0, 
    prIntervalVariation = 0,
    deltaWave = false 
  } = modifiers;
  
  const prStart = 0.14;
  
  // Calculate PR interval with variation (for Wenckebach)
  let currentPRInterval = prInterval;
  if (prIntervalVariation > 0 && beatNumber > 0) {
    // Progressive lengthening for Wenckebach (type 1 second degree block)
    const cycleLength = 4; // Typical Wenckebach cycle
    const cyclePosition = beatNumber % cycleLength;
    if (cyclePosition < cycleLength - 1) {
      // Progressive lengthening until dropped beat
      currentPRInterval = prInterval + (prIntervalVariation * cyclePosition / (cycleLength - 1));
    }
  }
  
  const prEnd = prStart + (0.06 * currentPRInterval);
  
  // Delta wave for WPW (slurred upstroke of QRS)
  if (deltaWave && phase >= prStart && phase < prEnd) {
    const deltaPhase = (phase - prStart) / (prEnd - prStart);
    // Small upward deflection before QRS
    return Math.sin(deltaPhase * Math.PI) * 0.05;
  }
  
  return (phase >= prStart && phase < prEnd) ? 0 : 0;
}

/**
 * Generate QRS complex component
 */
export function generateQRSComplex(phase: number, modifiers: PathologyModifiers = {}, beatNumber: number = 0): number {
  const { qrsWidth = 1.0, qrsAmplitude = 1.0, qrsMorphology = 'normal' } = modifiers;

  const qrsStart = 0.20;
  const qrsDuration = 0.08 * qrsWidth;
  const qrsEnd = qrsStart + qrsDuration;

  if (phase >= qrsStart && phase < qrsEnd) {
    const qrsPhase = (phase - qrsStart) / qrsDuration;
    const amplitudeVariation = 1.0 + ((beatNumber * 9301 + 49297) % 200 - 100) / 100 * 0.03;

    // Handle different QRS morphologies
    switch (qrsMorphology) {
      case 'lbbb': // Left Bundle Branch Block - M pattern, wide QRS
        if (qrsPhase < 0.15) {
          // Initial small deflection
          return -0.05 * (qrsPhase / 0.15) * qrsAmplitude * amplitudeVariation;
        } else if (qrsPhase < 0.40) {
          // First R wave (tall)
          const r1Phase = (qrsPhase - 0.15) / 0.25;
          return (r1Phase * 1.0) * qrsAmplitude * amplitudeVariation;
        } else if (qrsPhase < 0.55) {
          // S wave (dip)
          const sPhase = (qrsPhase - 0.40) / 0.15;
          return (1.0 - sPhase * 1.2) * qrsAmplitude * amplitudeVariation;
        } else if (qrsPhase < 0.80) {
          // Second R wave (M pattern)
          const r2Phase = (qrsPhase - 0.55) / 0.25;
          return (-0.2 + r2Phase * 0.8) * qrsAmplitude * amplitudeVariation;
        } else {
          // Return to baseline
          const returnPhase = (qrsPhase - 0.80) / 0.20;
          return (-0.2 * (1 - returnPhase)) * qrsAmplitude * amplitudeVariation;
        }

      case 'rbbb': // Right Bundle Branch Block - RSR' pattern
        if (qrsPhase < 0.20) {
          // Initial R wave
          const rPhase = qrsPhase / 0.20;
          return (rPhase * 0.8) * qrsAmplitude * amplitudeVariation;
        } else if (qrsPhase < 0.45) {
          // S wave (deep)
          const sPhase = (qrsPhase - 0.20) / 0.25;
          return (0.8 - sPhase * 1.0) * qrsAmplitude * amplitudeVariation;
        } else if (qrsPhase < 0.70) {
          // R' wave (second R)
          const rPrimePhase = (qrsPhase - 0.45) / 0.25;
          return (-0.2 + rPrimePhase * 0.6) * qrsAmplitude * amplitudeVariation;
        } else {
          // Return to baseline
          const returnPhase = (qrsPhase - 0.70) / 0.30;
          return (0.4 * (1 - returnPhase)) * qrsAmplitude * amplitudeVariation;
        }

      case 'pathological-q': // Pathological Q waves (deep and wide)
        if (qrsPhase < 0.25) {
          // Deep Q wave
          const qPhase = qrsPhase / 0.25;
          return -0.25 * qPhase * qrsAmplitude * amplitudeVariation;
        } else if (qrsPhase < 0.50) {
          // R wave
          const rPhase = (qrsPhase - 0.25) / 0.25;
          return (-0.25 + rPhase * 1.1) * qrsAmplitude * amplitudeVariation;
        } else if (qrsPhase < 0.75) {
          // S wave
          const sPhase = (qrsPhase - 0.50) / 0.25;
          return (0.85 - sPhase * 0.95) * qrsAmplitude * amplitudeVariation;
        } else {
          // Return to baseline
          const returnPhase = (qrsPhase - 0.75) / 0.25;
          return (-0.10 * (1 - returnPhase)) * qrsAmplitude * amplitudeVariation;
        }

      case 'normal':
      default:
        // Standard QRS complex
        if (qrsPhase < 0.12) {
          const qPhase = qrsPhase / 0.12;
          return -0.10 * qPhase * qrsAmplitude * amplitudeVariation;
        } else if (qrsPhase < 0.50) {
          const rPhase = (qrsPhase - 0.12) / 0.38;
          if (rPhase < 0.5) {
            const rValue = -0.10 + 1.10 * (rPhase * 2);
            return rValue * qrsAmplitude * amplitudeVariation;
          } else {
            const rValue = 1.0 - 1.0 * ((rPhase - 0.5) * 2);
            return rValue * qrsAmplitude * amplitudeVariation;
          }
        } else if (qrsPhase < 0.75) {
          const sPhase = (qrsPhase - 0.50) / 0.25;
          const sStart = 0;
          const sTrough = -0.10;
          return (sStart - (sStart - sTrough) * sPhase) * qrsAmplitude * amplitudeVariation;
        } else {
          const returnPhase = (qrsPhase - 0.75) / 0.25;
          const sTrough = -0.10;
          return sTrough * (1 - returnPhase) * qrsAmplitude * amplitudeVariation;
        }
    }
  }
  return 0;
}

/**
 * Generate ST segment component
 */
export function generateSTSegment(phase: number, modifiers: PathologyModifiers = {}): number {
  const { 
    stSegmentPresent = true, 
    stSegmentDuration = 1.0, 
    qrsWidth = 1.0,
    stSegmentElevation = 0 
  } = modifiers;
  if (!stSegmentPresent) return 0;

  const qrsEnd = 0.20 + (0.08 * qrsWidth);
  const stStart = qrsEnd;
  const stEnd = stStart + (0.12 * stSegmentDuration);

  if (phase >= stStart && phase < stEnd) {
    // ST elevation or depression
    return stSegmentElevation;
  }
  return 0;
}

/**
 * Generate T wave component
 */
export function generateTWave(phase: number, modifiers: PathologyModifiers = {}): number {
  const {
    tWaveAmplitude = 1.0,
    tWaveWidth = 1.0,
    tWaveTented = false,
    tWaveInverted = false,
    qrsWidth = 1.0,
    stSegmentDuration = 1.0
  } = modifiers;

  const stEnd = 0.20 + (0.08 * qrsWidth) + (0.12 * stSegmentDuration);
  const tStart = stEnd;
  const tEnd = tStart + (0.20 * tWaveWidth);

  if (phase >= tStart && phase < tEnd) {
    const tPhase = (phase - tStart) / (tEnd - tStart);
    const baseAmplitude = tWaveTented ? 0.4 : 0.25;
    let tValue = Math.sin(tPhase * Math.PI) * baseAmplitude * tWaveAmplitude;
    
    // Invert T wave if needed
    if (tWaveInverted) {
      tValue = -tValue;
    }
    
    return tValue;
  }
  return 0;
}

/**
 * Determine if abnormality should appear for this beat (for intermittent patterns)
 */
function shouldShowAbnormality(
  beatNumber: number,
  modifiers: PathologyModifiers
): boolean {
  const frequency = modifiers.abnormalityFrequency;
  if (frequency === undefined || frequency >= 1.0) {
    return true; // Always show abnormality
  }
  if (frequency <= 0) {
    return false; // Never show abnormality
  }

  const pattern = modifiers.abnormalityPattern || 'random';
  const cycleLength = modifiers.abnormalityCycleLength || 4;

  switch (pattern) {
    case 'periodic':
      // Show abnormality every N beats (e.g., every 4th beat)
      return beatNumber % cycleLength === cycleLength - 1;

    case 'clustered':
      // Show abnormality in clusters
      const clusterSize = Math.ceil(cycleLength / 2);
      const clusterStart = Math.floor(beatNumber / cycleLength) * cycleLength;
      return (beatNumber - clusterStart) < clusterSize;

    case 'random':
    default:
      // Use deterministic pseudo-random based on beat number
      const seed = beatNumber * 9301 + 49297;
      const pseudoRandom = ((seed % 233280) / 233280);
      return pseudoRandom < frequency;
  }
}

/**
 * Generate complete ECG complex for a given phase
 */
export function generateECGComplex(phase: number, config: ECGConfig, beatNumber?: number): number {
  const { pathology, amplitude = 1.0, noise = 0.02, heartRate = 72 } = config;
  const normalizedPhase = phase % 1;

  const modifiers = getPathologyModifiers(pathology);
  const currentBeatNumber = beatNumber ?? Math.floor(phase);
  
  // Check if abnormality should appear for this beat (for intermittent patterns)
  const showAbnormality = shouldShowAbnormality(currentBeatNumber, modifiers);

  // For intermittent abnormalities, use normal modifiers when abnormality shouldn't appear
  let effectiveModifiers = modifiers;
  if (!showAbnormality && pathology !== 'normal') {
    // For WPW: when not preexcited, use normal PR and QRS
    if (pathology === 'wolff-parkinson-white') {
      effectiveModifiers = {
        ...modifiers,
        prInterval: 1.0, // Normal PR
        deltaWave: false, // No delta wave
        qrsWidth: 1.0, // Normal QRS width
        qrsMorphology: 'normal',
      };
    }
    // For premature beats: skip this logic, they're handled differently
    else if (pathology === 'atrial-premature-beat' || pathology === 'ventricular-premature-beat') {
      // These are handled by timing, not by modifiers
      effectiveModifiers = modifiers;
    }
    // For ST changes: reduce severity but still show some variation
    else if (pathology === 'st-elevation-mi' || pathology === 'st-depression-ischemia') {
      // Add beat-to-beat variation in ST elevation/depression
      const baseSTChange = modifiers.stSegmentElevation || 0;
      const variationSeed = currentBeatNumber * 7301 + 29347;
      const variation = ((variationSeed % 233280) / 233280 - 0.5) * 0.2; // ±10% variation
      effectiveModifiers = {
        ...modifiers,
        stSegmentElevation: baseSTChange * (0.3 + variation), // Reduced ST change with variation
      };
    }
    // For other pathologies with ST changes, add slight variation
    else if (modifiers.stSegmentElevation !== undefined && modifiers.stSegmentElevation !== 0) {
      const variationSeed = currentBeatNumber * 5301 + 19347;
      const variation = ((variationSeed % 233280) / 233280 - 0.5) * 0.05; // ±2.5% variation
      effectiveModifiers = {
        ...modifiers,
        stSegmentElevation: (modifiers.stSegmentElevation || 0) * (1 + variation),
      };
    }
    // For pathological Q waves: may not appear in every beat initially
    else if (pathology === 'pathological-q-waves') {
      effectiveModifiers = {
        ...modifiers,
        qrsMorphology: 'normal', // Normal QRS when Q wave doesn't appear
      };
    }
    // For bundle branch blocks: rarely intermittent, but possible
    else if (pathology === 'left-bundle-branch-block' || pathology === 'right-bundle-branch-block') {
      effectiveModifiers = {
        ...modifiers,
        qrsWidth: 1.0, // Normal QRS width
        qrsMorphology: 'normal',
        tWaveInverted: false, // Normal T wave
      };
    }
  }

  // Check for dropped beats (heart blocks)
  if (effectiveModifiers.droppedBeats !== undefined && effectiveModifiers.droppedBeats > 0) {
    const cycleLength = Math.round(1 / effectiveModifiers.droppedBeats);
    if (cycleLength > 1 && currentBeatNumber % cycleLength === cycleLength - 1) {
      // This is a dropped beat - only show P wave, no QRS
      let value = 0;
      value += generatePWave(normalizedPhase, effectiveModifiers);
      value += generatePRSegment(normalizedPhase, effectiveModifiers, currentBeatNumber);
      // No QRS, ST, or T wave
      const totalNoise = noise + (effectiveModifiers.baselineNoise || 0);
      if (totalNoise > 0) {
        const noiseSeed = normalizedPhase * 1000 + Math.floor(normalizedPhase * 10000);
        const pseudoRandom = ((noiseSeed * 9301 + 49297) % 233280) / 233280;
        value += (pseudoRandom - 0.5) * totalNoise;
      }
      return value * amplitude;
    }
  }

  // AV dissociation (third degree block) - P waves and QRS independent
  if (effectiveModifiers.avDissociation) {
    const atrialRate = heartRate; // P wave rate
    const ventricularRate = effectiveModifiers.ventricularRate || heartRate * 0.4; // Slower QRS rate
    
    // Generate P waves at atrial rate
    const atrialPhase = (phase * heartRate / 60) % 1;
    let value = generatePWave(atrialPhase, effectiveModifiers);
    
    // Generate QRS at ventricular rate (independent)
    const ventricularPhase = (phase * ventricularRate / 60) % 1;
    value += generatePRSegment(ventricularPhase, effectiveModifiers, currentBeatNumber);
    value += generateQRSComplex(ventricularPhase, effectiveModifiers, currentBeatNumber);
    value += generateSTSegment(ventricularPhase, effectiveModifiers);
    value += generateTWave(ventricularPhase, effectiveModifiers);
    
    const totalNoise = noise + (effectiveModifiers.baselineNoise || 0);
    if (totalNoise > 0) {
      const noiseSeed = normalizedPhase * 1000 + Math.floor(normalizedPhase * 10000);
      const pseudoRandom = ((noiseSeed * 9301 + 49297) % 233280) / 233280;
      value += (pseudoRandom - 0.5) * totalNoise;
    }
    return value * amplitude;
  }

  // Handle premature beats - they occur early and have different timing
  let adjustedPhase = normalizedPhase;
  if (pathology === 'atrial-premature-beat' && showAbnormality) {
    // APB occurs ~0.6-0.8x through the normal cycle
    adjustedPhase = normalizedPhase * 0.7;
  } else if (pathology === 'ventricular-premature-beat' && showAbnormality) {
    // VPB occurs ~0.5-0.7x through the normal cycle, no P wave
    adjustedPhase = normalizedPhase * 0.6;
  }

  let value = 0;

  // For VPBs, skip P wave when abnormality is shown
  if (!(pathology === 'ventricular-premature-beat' && showAbnormality)) {
    value += generatePWave(adjustedPhase, effectiveModifiers);
  }
  
  value += generatePRSegment(adjustedPhase, effectiveModifiers, currentBeatNumber);
  value += generateQRSComplex(adjustedPhase, effectiveModifiers, currentBeatNumber);
  value += generateSTSegment(adjustedPhase, effectiveModifiers);
  
  // Adjust T wave for QT interval changes (scale tWaveWidth)
  const qtMultiplier = effectiveModifiers.qtInterval || 1.0;
  if (qtMultiplier !== 1.0) {
    // Create modified modifiers with scaled tWaveWidth
    const modifiedModifiers = {
      ...effectiveModifiers,
      tWaveWidth: (effectiveModifiers.tWaveWidth || 1.0) * qtMultiplier,
    };
    value += generateTWave(adjustedPhase, modifiedModifiers);
  } else {
    value += generateTWave(adjustedPhase, effectiveModifiers);
  }

  // Special handling for atrial flutter
  if (pathology === 'atrial-flutter') {
    if (adjustedPhase < 0.20) {
      const flutterCycles = 3;
      const flutterPhase = (adjustedPhase % (0.20 / flutterCycles)) / (0.20 / flutterCycles);
      value = (flutterPhase < 0.5 ? flutterPhase * 0.4 : (1 - flutterPhase) * 0.4) - 0.2;
      value += generatePRSegment(adjustedPhase, effectiveModifiers, currentBeatNumber);
      value += generateQRSComplex(adjustedPhase, effectiveModifiers, currentBeatNumber);
      value += generateSTSegment(adjustedPhase, effectiveModifiers);
      value += generateTWave(adjustedPhase, effectiveModifiers);
    }
  }

  // Special handling for ventricular fibrillation
  if (pathology === 'ventricular-fibrillation') {
    const noiseSeed = adjustedPhase * 1000 + Math.floor(adjustedPhase * 10000);
    const pseudoRandom = ((noiseSeed * 9301 + 49297) % 233280) / 233280;
    value = (pseudoRandom - 0.5) * 1.2;
  }

  const totalNoise = noise + (effectiveModifiers.baselineNoise || 0);
  
  // Use deterministic noise based on phase for consistency
  if (totalNoise > 0) {
    const noiseSeed = normalizedPhase * 1000 + Math.floor(normalizedPhase * 10000);
    const pseudoRandom = ((noiseSeed * 9301 + 49297) % 233280) / 233280;
    value += (pseudoRandom - 0.5) * totalNoise;
  }

  return value * amplitude;
}

