# ECG-Lab

A lightweight, easy-to-use ECG waveform simulator library for web applications. Generate realistic electrocardiogram waveforms with various pathologies programmatically.

## Features

- 🎯 **Simple API** - Easy to integrate into any web application
- 🏥 **Medical Accuracy** - Realistic ECG waveforms based on medical standards
- 🔬 **Multiple Pathologies** - Support for 8 different cardiac rhythms and conditions
- ⚡ **Real-time Rendering** - Smooth, continuous waveform display at 60fps
- 📦 **Zero Dependencies** - No external dependencies required
- 🎨 **Customizable** - Adjustable heart rate, amplitude, and noise levels
- 📱 **Canvas-based** - Works with standard HTML5 Canvas API
- 🔧 **TypeScript** - Full TypeScript support with type definitions

## Installation

```bash
npm install ecg-lab
```

## Quick Start

```typescript
import { createECG } from 'ecg-lab';

// Get your canvas element
const canvas = document.getElementById('ecg-canvas') as HTMLCanvasElement;

// Create an ECG instance
const ecg = createECG({
  canvas,
  pathology: 'normal',
  heartRate: 72
});

// Change pathology dynamically
ecg.setPathology('atrial-fibrillation');

// Adjust heart rate
ecg.setHeartRate(120);

// Clean up when done
// ecg.destroy();
```

## Browser Support

ECG-Lab requires modern browsers with support for:
- HTML5 Canvas API
- `requestAnimationFrame`
- ES2020 features

Tested in:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## API Reference

### `createECG(options: ECGOptions): ECGInstance`

Creates a new ECG instance that renders to a canvas element.

#### Parameters

- `options.canvas` (required) - The HTMLCanvasElement to render to
- `options.pathology` (optional) - Initial pathology type (default: `'normal'`)
- `options.heartRate` (optional) - Initial heart rate in BPM (default: pathology-specific)
- `options.amplitude` (optional) - Waveform amplitude multiplier (default: `1.0`)
- `options.noise` (optional) - Noise level (default: pathology-specific)

#### Returns

An `ECGInstance` object with methods to control the waveform.

### Instance Methods

#### `setPathology(pathology: PathologyType): void`

Changes the pathology type. The waveform will update immediately with the new rhythm characteristics.

```typescript
ecg.setPathology('sinus-tachycardia');
```

#### `setHeartRate(rate: number): void`

Changes the heart rate in beats per minute. Valid range: 30-300 BPM. Values outside this range will be clamped.

```typescript
ecg.setHeartRate(100);
```

#### `setAmplitude(amplitude: number): void`

Changes the waveform amplitude. Must be greater than 0.

```typescript
ecg.setAmplitude(1.5);
```

#### `setNoise(noise: number): void`

Changes the noise level. Must be non-negative.

```typescript
ecg.setNoise(0.05);
```

#### `getHeartRate(): number`

Returns the current heart rate in BPM.

```typescript
const hr = ecg.getHeartRate();
```

#### `getPathology(): PathologyType`

Returns the current pathology type.

```typescript
const pathology = ecg.getPathology();
```

#### `destroy(): void`

Stops rendering and cleans up resources. Call this when you're done with the ECG instance to prevent memory leaks.

```typescript
ecg.destroy();
```

## Supported Pathologies

ECG-Lab supports the following cardiac rhythms and conditions:

| Pathology | Display Name | Default Heart Rate | Description |
|-----------|--------------|-------------------|-------------|
| `'normal'` | Normal Sinus Rhythm | 72 BPM | Regular, normal cardiac rhythm |
| `'atrial-fibrillation'` | Atrial Fibrillation | 100 BPM | Irregular rhythm, absent P waves |
| `'sinus-tachycardia'` | Sinus Tachycardia | 120 BPM | Fast but regular rhythm |
| `'sinus-bradycardia'` | Sinus Bradycardia | 50 BPM | Slow but regular rhythm |
| `'atrial-flutter'` | Atrial Flutter | 75 BPM | Sawtooth flutter waves |
| `'ventricular-tachycardia'` | Ventricular Tachycardia | 180 BPM | Wide QRS complexes |
| `'ventricular-fibrillation'` | Ventricular Fibrillation | 300 BPM | Chaotic, irregular waveform |
| `'hyperkalaemia'` | Hyperkalaemia | 70 BPM | Peaked T waves, wide QRS |

## Examples

### Basic Usage

```typescript
import { createECG } from 'ecg-lab';

const canvas = document.getElementById('ecg-canvas') as HTMLCanvasElement;
const ecg = createECG({
  canvas,
  pathology: 'normal',
  heartRate: 72
});
```

### Changing Pathology

```typescript
// Start with normal rhythm
const ecg = createECG({
  canvas,
  pathology: 'normal'
});

// Switch to atrial fibrillation
ecg.setPathology('atrial-fibrillation');

// Switch to ventricular tachycardia
ecg.setPathology('ventricular-tachycardia');
```

### Dynamic Heart Rate Control

```typescript
const ecg = createECG({
  canvas,
  pathology: 'normal',
  heartRate: 60
});

// Increase heart rate gradually
let hr = 60;
const interval = setInterval(() => {
  hr += 5;
  ecg.setHeartRate(hr);
  if (hr >= 120) {
    clearInterval(interval);
  }
}, 1000);
```

### Multiple Instances

You can create multiple ECG instances on different canvases:

```typescript
const canvas1 = document.getElementById('ecg-1') as HTMLCanvasElement;
const canvas2 = document.getElementById('ecg-2') as HTMLCanvasElement;

const ecg1 = createECG({
  canvas: canvas1,
  pathology: 'normal',
  heartRate: 72
});

const ecg2 = createECG({
  canvas: canvas2,
  pathology: 'atrial-fibrillation',
  heartRate: 100
});
```

### Using with React

```tsx
import { useEffect, useRef } from 'react';
import { createECG, PathologyType } from 'ecg-lab';

function ECGMonitor({ pathology, heartRate }: { pathology: PathologyType; heartRate: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ecgRef = useRef<ReturnType<typeof createECG> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    ecgRef.current = createECG({
      canvas: canvasRef.current,
      pathology,
      heartRate,
    });

    return () => {
      ecgRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    ecgRef.current?.setPathology(pathology);
  }, [pathology]);

  useEffect(() => {
    ecgRef.current?.setHeartRate(heartRate);
  }, [heartRate]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '200px' }} />;
}
```

### Using with Vue

```vue
<template>
  <canvas ref="canvasRef" style="width: 100%; height: 200px;"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { createECG, type PathologyType } from 'ecg-lab';

const props = defineProps<{
  pathology: PathologyType;
  heartRate: number;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ecg: ReturnType<typeof createECG> | null = null;

onMounted(() => {
  if (canvasRef.value) {
    ecg = createECG({
      canvas: canvasRef.value,
      pathology: props.pathology,
      heartRate: props.heartRate,
    });
  }
});

onUnmounted(() => {
  ecg?.destroy();
});

watch(() => props.pathology, (newPathology) => {
  ecg?.setPathology(newPathology);
});

watch(() => props.heartRate, (newHeartRate) => {
  ecg?.setHeartRate(newHeartRate);
});
</script>
```

## Utility Functions

### `getPathologyDisplayName(pathology: PathologyType): string`

Get a human-readable display name for a pathology.

```typescript
import { getPathologyDisplayName } from 'ecg-lab';

const name = getPathologyDisplayName('atrial-fibrillation');
// Returns: "Atrial Fibrillation"
```

### Pathology Constants

```typescript
import { PATHOLOGIES } from 'ecg-lab';

PATHOLOGIES.NORMAL // 'normal'
PATHOLOGIES.ATRIAL_FIBRILLATION // 'atrial-fibrillation'
PATHOLOGIES.SINUS_TACHYCARDIA // 'sinus-tachycardia'
// ... etc
```

## Technical Details

### Lead II Simulation

ECG-Lab simulates **Lead II** ECG, which is the most common lead used in hospital vital signs monitoring. Lead II provides a good view of the heart's electrical activity from the right arm to the left leg.

### Rendering

- **Paper Speed**: 25 mm/s (standard clinical speed)
- **Resolution**: 4 pixels per millimeter
- **Sample Rate**: 250 Hz
- **Frame Rate**: 60 FPS (via `requestAnimationFrame`)

### Waveform Characteristics

The library generates realistic ECG waveforms with:
- P waves (atrial depolarization)
- PR segments
- QRS complexes (ventricular depolarization)
- ST segments
- T waves (ventricular repolarization)

Each pathology modifies these components according to medical characteristics.

## Building from Source

```bash
# Clone the repository
git clone <repository-url>
cd ecg-lab

# Install dependencies
npm install

# Build the library
npm run build

# Build in watch mode
npm run dev
```

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

This library is for **educational and simulation purposes only**. It is not intended for medical diagnosis or treatment. Always consult qualified medical professionals for actual ECG interpretation and diagnosis.
