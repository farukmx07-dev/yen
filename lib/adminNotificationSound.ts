let audioContext: AudioContext | null = null;
let volumeMultiplier = 0.8;

export function setAdminNotificationVolume(percent: number) {
  const clamped = Math.max(0, Math.min(100, percent));
  volumeMultiplier = clamped / 100;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
  }
  return audioContext;
}

function playTone(frequency: number, durationMs: number, volume = 0.5, delayMs = 0) {
  const ctx = getAudioContext();
  if (!ctx || volumeMultiplier <= 0) return;

  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const startAt = ctx.currentTime + delayMs / 1000;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume * volumeMultiplier, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + durationMs / 1000);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationMs / 1000 + 0.05);
}

export function playNewLogSound() {
  playTone(880, 180, 0.48);
}

export function playThreeDSecureSound() {
  playTone(880, 160, 0.5);
  playTone(1100, 180, 0.46, 160);
}

export function playTestNotificationSound() {
  playNewLogSound();
}
