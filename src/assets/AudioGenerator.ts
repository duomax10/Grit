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

  // --- FOUNTAIN WATER (gentle loop, ramped by proximity) ---
  // Generated early in the queue so the GraveyardScene can grab it
  // before its 500 ms ambient-start delay elapses. The loop is built
  // from three layers:
  //   1. HISS: high-frequency noise for the water-spray bed.
  //   2. GURGLE: short upward-sweeping sine chirps scattered across
  //      the buffer. Each chirp is a decaying "bloop" — the
  //      characteristic sound of an air bubble collapsing in water.
  //   3. BASIN: a couple of low sines to suggest the resonant cavity
  //      of the stone basin.
  // Times, base freqs, sweep rates, and decay rates are hand-picked
  // for organic irregularity and to wrap cleanly at the loop seam.
  // Parallel flat arrays are used so the per-sample generator can
  // iterate without allocating per call.
  const waterDuration = 6;
  const bubbleStarts  = [0.15, 0.48, 0.92, 1.27, 1.71, 2.14, 2.55, 2.98, 3.43, 3.86, 4.27, 4.71, 5.12, 5.55];
  const bubbleFreqs   = [ 480,  320,  560,  380,  420,  290,  510,  360,  440,  270,  530,  400,  350,  470];
  const bubbleSweeps  = [ 3.2,  2.8,  3.5,  2.5,  3.0,  2.6,  3.3,  2.9,  3.1,  2.4,  3.4,  2.7,  2.8,  3.1];
  const bubbleDecays  = [  22,   28,   24,   26,   22,   30,   23,   27,   25,   32,   23,   26,   28,   24];
  const numBubbles = bubbleStarts.length;
  const waterBuffer = createAudioBuffer(audioCtx, waterDuration, sampleRate, (t, i) => {
    // --- HISS: filtered noise for the water-spray bed ---
    // Subtracting two independent noise streams biases toward
    // higher-frequency content than a single stream, giving the
    // "shh" of spray instead of a low wind rumble.
    const r1 = seededRandom((i * 31) % 1000 + 1);
    const r2 = seededRandom((i * 53) % 997 + 1);
    const n1 = r1() * 2 - 1;
    const n2 = r2() * 2 - 1;
    let hiss = (n1 - n2 * 0.7) * 0.08;
    hiss *= 0.7 + 0.3 * Math.sin(t * 0.8 * Math.PI * 2);

    // --- GURGLE: exponentially decaying upward chirps ---
    let gurgle = 0;
    for (let b = 0; b < numBubbles; b++) {
      const dt = t - bubbleStarts[b];
      if (dt >= 0 && dt < 0.25) {
        const env = Math.exp(-dt * bubbleDecays[b]);
        const freq = bubbleFreqs[b] * (1 + dt * bubbleSweeps[b]);
        gurgle += Math.sin(dt * freq * Math.PI * 2) * env * 0.35;
      }
    }

    // --- BASIN: subtle low resonance ---
    const basin = (Math.sin(t * 90 * Math.PI * 2) * 0.015
                 + Math.sin(t * 130 * Math.PI * 2) * 0.010)
                * (0.7 + 0.3 * Math.sin(t * 1.3));

    let val = hiss + gurgle + basin;

    // Short fade at the loop boundaries so the seam isn't a click.
    const fade = 0.3;
    let fadeEnv = 1;
    if (t < fade) fadeEnv = t / fade;
    if (t > waterDuration - fade) fadeEnv = (waterDuration - t) / fade;
    return val * 0.7 * fadeEnv;
  });
  const waterUrl = await audioBufferToBase64(waterBuffer);
  await loadGeneratedAudio(scene, 'fountain-water', waterUrl);

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
