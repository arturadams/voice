/**
 * A minimal MediaRecorder-like implementation that captures audio using the
 * Web Audio API and outputs a WAV blob. Used as a fallback on browsers without
 * reliable MediaRecorder support (e.g. Chrome on iOS).
 */
export class WavRecorder {
  stream: MediaStream;
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((ev: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;

  private ctx: AudioContext;
  private processor: ScriptProcessorNode;
  private chunks: Float32Array[] = [];

  constructor(stream: MediaStream) {
    this.stream = stream;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = this.ctx.createMediaStreamSource(stream);
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
    source.connect(this.processor);
    this.processor.connect(this.ctx.destination);
    this.processor.onaudioprocess = (e) => {
      if (this.state === 'recording') {
        this.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      }
    };
  }

  start(_timeslice?: number) {
    this.state = 'recording';
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.processor.disconnect();
    this.stream.getTracks().forEach((t) => t.stop());
    const bufferLength = this.chunks.reduce((n, c) => n + c.length, 0);
    const buffer = new Float32Array(bufferLength);
    let offset = 0;
    for (const c of this.chunks) {
      buffer.set(c, offset);
      offset += c.length;
    }
    const wav = encodeWav(buffer, this.ctx.sampleRate);
    const blob = new Blob([wav], { type: 'audio/wav' });
    if (this.ondataavailable) {
      this.ondataavailable(new BlobEvent('dataavailable', { data: blob }));
    }
    if (this.onstop) this.onstop();
    this.ctx.close();
  }

  // Cancel without emitting data
  cancel() {
    this.state = 'inactive';
    this.processor.disconnect();
    this.stream.getTracks().forEach((t) => t.stop());
    this.ctx.close();
    this.chunks = [];
  }
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  let offset = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    offset += str.length;
  }

  writeString('RIFF');
  view.setUint32(offset, 36 + samples.length * 2, true); offset += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4; // PCM chunk size
  view.setUint16(offset, 1, true); offset += 2; // format
  view.setUint16(offset, 1, true); offset += 2; // channels
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * 2, true); offset += 4; // byte rate
  view.setUint16(offset, 2, true); offset += 2; // block align
  view.setUint16(offset, 16, true); offset += 2; // bits per sample
  writeString('data');
  view.setUint32(offset, samples.length * 2, true); offset += 4;

  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}
