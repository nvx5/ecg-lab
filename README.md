<div align="center">
  
  ## ECG Lab

  A lightweight ECG waveform simulator library for web applications. Generate realistic Lead II ECG waveforms with over 20 different pathologies including heart blocks and arrhythmias. Features medically accurate, intermittent abnormality patterns for realistic single-lead ECG simulation. Used in my project [mlawizard](https://mlawizard.com).
  
</div>

### Demo

Check out the [live demo](https://mlawizard.com) and play around yourself!

<div align="center">
  <img src="https://github.com/user-attachments/assets/3b94d4aa-c49a-4083-89c8-4736c3d9250a" width="60%">
</div>

### Installation

```bash
npm install ecg-lab
```

### Quick Start

```typescript
import { createECG } from 'ecg-lab';

const canvas = document.getElementById('ecg-canvas') as HTMLCanvasElement;
const ecg = createECG({
  canvas,
  pathology: 'normal',
  heartRate: 72
});

// Change pathology dynamically
ecg.setPathology('atrial-fibrillation');
ecg.setHeartRate(120);
ecg.setAmplitude(1.5);
ecg.setNoise(0.05);

// Clean up when done
ecg.destroy();
```

### API

#### `createECG(options: ECGOptions): ECGInstance`

**Options:**
- `canvas` (required) - HTMLCanvasElement to render to
- `pathology` (optional) - Initial pathology type (default: `'normal'`)
- `heartRate` (optional) - Initial heart rate in BPM (default: pathology-specific)
- `amplitude` (optional) - Waveform amplitude multiplier (default: `1.0`)
- `noise` (optional) - Noise level (default: pathology-specific)

**Instance Methods:**
- `setPathology(pathology: PathologyType): void` - Change pathology type
- `setHeartRate(rate: number): void` - Change heart rate (30-300 BPM)
- `setAmplitude(amplitude: number): void` - Change amplitude (> 0)
- `setNoise(noise: number): void` - Change noise level (≥ 0)
- `getHeartRate(): number` - Get current heart rate
- `getPathology(): PathologyType` - Get current pathology
- `destroy(): void` - Stop rendering and clean up

### Supported Pathologies

```typescript
'normal'                          // Normal Sinus Rhythm
'sinus-tachycardia'               // Sinus Tachycardia
'sinus-bradycardia'               // Sinus Bradycardia
'sinus-arrhythmia'                // Sinus Arrhythmia
'atrial-fibrillation'             // Atrial Fibrillation
'atrial-flutter'                  // Atrial Flutter
'atrial-premature-beat'            // Atrial Premature Beat
'ventricular-tachycardia'         // Ventricular Tachycardia
'ventricular-fibrillation'         // Ventricular Fibrillation
'ventricular-premature-beat'       // Ventricular Premature Beat
'first-degree-av-block'           // First Degree AV Block
'second-degree-av-block-type1'     // Second Degree AV Block Type 1
'second-degree-av-block-type2'     // Second Degree AV Block Type 2
'third-degree-av-block'            // Third Degree AV Block
'left-bundle-branch-block'         // Left Bundle Branch Block
'right-bundle-branch-block'        // Right Bundle Branch Block
'wolff-parkinson-white'            // Wolff-Parkinson-White
'left-ventricular-hypertrophy'     // Left Ventricular Hypertrophy
'right-ventricular-hypertrophy'    // Right Ventricular Hypertrophy
'st-elevation-mi'                  // ST Elevation MI
'st-depression-ischemia'           // ST Depression Ischemia
'pathological-q-waves'             // Pathological Q Waves
'long-qt-syndrome'                 // Long QT Syndrome
'hyperkalaemia'                    // Hyperkalaemia
'right-atrial-hypertrophy'         // Right Atrial Hypertrophy
'left-atrial-hypertrophy'          // Left Atrial Hypertrophy
```

### Example (React)

```tsx
import { useEffect, useRef } from 'react';
import { createECG, PathologyType } from 'ecg-lab';

function ECGMonitor({ pathology, heartRate }: { pathology: PathologyType; heartRate: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ecgRef = useRef<ReturnType<typeof createECG> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    ecgRef.current = createECG({ canvas: canvasRef.current, pathology, heartRate });
    return () => ecgRef.current?.destroy();
  }, []);

  useEffect(() => { ecgRef.current?.setPathology(pathology); }, [pathology]);
  useEffect(() => { ecgRef.current?.setHeartRate(heartRate); }, [heartRate]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '200px' }} />;
}
```



 
