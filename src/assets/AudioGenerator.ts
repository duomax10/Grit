/**
 * Procedural audio generation using Web Audio API.
 * Generates footsteps, ambient night sounds, owl hoots, and UI sounds.
 */

function createAudioBuffer(
  ctx: AudioContext,
  duration: number,
  sampleRate: number,
  generator: (t: number, i: number) => number,
): AudioBuffer {
  const length = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = generator(i / sampleRate, i);
  }
  return buffer;
}

function audioBufferToBase64(buffer: AudioBuffer): Promise<string> {
  return new Promise((resolve) => {
    const offlineCtx = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();
    offlineCtx.startRendering().then((renderedBuffer) => {
      // Encode as WAV
      const wav = encodeWAV(renderedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  });
}

function encodeWAV(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const data = buffer.getChannelData(0);
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);
  const dataSize = data.length * (bitDepth / 8);
  const headerSize = 44;
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Audio data
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Pseudo-random for deterministic noise
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Helper to load a generated WAV data URL into Phaser's audio cache.
 * Uses the scene's loader to properly decode and register the audio.
 */
function loadGeneratedAudio(scene: Phaser.Scene, key: string, dataUrl: string): Promise<void> {
  return new Promise((resolve) => {
    // Convert data URL to blob URL for Phaser loader
    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        scene.load.audio(key, blobUrl);
        scene.load.once(`filecomplete-audio-${key}`, () => {
          URL.revokeObjectURL(blobUrl);
          resolve();
        });
        scene.load.once('loaderror', () => {
          URL.revokeObjectURL(blobUrl);
          resolve(); // Don't fail the whole game over audio
        });
        scene.load.start();
      })
      .catch(() => resolve());
  });
}

export async function generateAudio(scene: Phaser.Scene): Promise<void> {
  const audioCtx = new AudioContext();
  const sampleRate = audioCtx.sampleRate;

  // --- FOOTSTEP (soft crunch) ---
  const footstepBuffer = createAudioBuffer(audioCtx, 0.15, sampleRate, (t) => {
    const env = Math.exp(-t * 30) * 0.3;
    const rand = seededRandom(42);
    const noise = (rand() * 2 - 1);
    return noise * env * (1 - t * 5);
  });
  const footstepUrl = await audioBufferToBase64(footstepBuffer);
  await loadGeneratedAudio(scene, 'footstep', footstepUrl);

  // --- FOOTSTEP ALT ---
  const footstep2Buffer = createAudioBuffer(audioCtx, 0.12, sampleRate, (t) => {
    const env = Math.exp(-t * 35) * 0.25;
    const rand = seededRandom(137);
    const noise = (rand() * 2 - 1);
    return noise * env * (1 - t * 6);
  });
  const footstep2Url = await audioBufferToBase64(footstep2Buffer);
  await loadGeneratedAudio(scene, 'footstep-alt', footstep2Url);

  // --- NIGHT AMBIENT (long loop with crickets and wind) ---
  const ambientDuration = 8;
  const ambientBuffer = createAudioBuffer(audioCtx, ambientDuration, sampleRate, (t, i) => {
    let val = 0;
    const windEnv = 0.03 * (0.5 + 0.5 * Math.sin(t * 0.3));
    const rand = seededRandom(i % 1000 + 1);
    val += (rand() * 2 - 1) * windEnv;

    // Low rumble only — crickets disabled (too high pitched)
    val += Math.sin(t * 30) * 0.008;
    return val;
  });
  const ambientUrl = await audioBufferToBase64(ambientBuffer);
  await loadGeneratedAudio(scene, 'night-ambient', ambientUrl);

  // --- OWL HOOT ---
  const owlBuffer = createAudioBuffer(audioCtx, 1.5, sampleRate, (t) => {
    let val = 0;
    if (t < 0.4) {
      const env = Math.sin((t / 0.4) * Math.PI) * 0.2;
      val = Math.sin(t * 300 * Math.PI * 2) * env;
      val += Math.sin(t * 600 * Math.PI * 2) * env * 0.15;
    } else if (t >= 0.5 && t < 1.1) {
      const lt = t - 0.5;
      const env = Math.sin((lt / 0.6) * Math.PI) * 0.3;
      const freq = 350 + lt * 20;
      val = Math.sin(lt * freq * Math.PI * 2) * env;
      val += Math.sin(lt * freq * 2 * Math.PI * 2) * env * 0.1;
    }
    return val;
  });
  const owlUrl = await audioBufferToBase64(owlBuffer);
  await loadGeneratedAudio(scene, 'owl-hoot', owlUrl);

  // --- UI CLICK ---
  const clickBuffer = createAudioBuffer(audioCtx, 0.08, sampleRate, (t) => {
    const env = Math.exp(-t * 60) * 0.3;
    return Math.sin(t * 800 * Math.PI * 2) * env;
  });
  const clickUrl = await audioBufferToBase64(clickBuffer);
  await loadGeneratedAudio(scene, 'ui-click', clickUrl);

  await audioCtx.close();
}
