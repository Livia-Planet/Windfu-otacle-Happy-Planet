/**
 * Procedural Winter Wind Generator
 * Uses Pink Noise and a modulated Low-Pass Filter to create an organic wind sound.
 */
export class WindGenerator {
  private ctx: AudioContext | null = null;
  private noiseNode: ScriptProcessorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  // Persistence for pink noise state variables to ensure smooth signal
  private b0 = 0; private b1 = 0; private b2 = 0; 
  private b3 = 0; private b4 = 0; private b5 = 0; 
  private b6 = 0;

  constructor() {}

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  async start() {
    const ctx = this.initContext();
    
    // Resume context in case it's suspended by the browser
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (this.noiseNode) return;

    // Create Pink Noise using a ScriptProcessor
    const bufferSize = 4096;
    this.noiseNode = ctx.createScriptProcessor(bufferSize, 0, 1);
    this.noiseNode.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        this.b0 = 0.99886 * this.b0 + white * 0.0555179;
        this.b1 = 0.99332 * this.b1 + white * 0.0750759;
        this.b2 = 0.96900 * this.b2 + white * 0.1538520;
        this.b3 = 0.86650 * this.b3 + white * 0.3104856;
        this.b4 = 0.55000 * this.b4 + white * 0.5329522;
        this.b5 = -0.7616 * this.b5 - white * 0.0168980;
        output[i] = this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + white * 0.5362;
        output[i] *= 0.15; // Compensation
        this.b6 = white * 0.115926;
      }
    };

    // Lowpass filter for wind texture
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 500;
    this.filter.Q.value = 1.2;

    // LFO for periodic gusts
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.1; // Very slow gusting

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 300; 

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    // Main Output Gain
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    this.noiseNode.connect(this.filter);
    this.filter.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
  }

  async setVolume(volume: number) {
    const ctx = this.initContext();
    if (ctx.state === 'suspended' && volume > 0) {
      await ctx.resume();
    }
    
    if (!this.gainNode || !this.ctx) return;
    
    // Smooth transition to new volume
    const targetGain = volume * 0.2; 
    this.gainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
  }

  stop() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.noiseNode = null;
    }
  }
}

export const windSound = new WindGenerator();
