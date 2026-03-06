"use client";

let audioContext: AudioContext | null = null;

export function playNotificationSound(volume = 0.3) {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    const ctx = audioContext;

    // Create a pleasant two-tone notification
    const now = ctx.currentTime;

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 830;
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second tone (higher)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 1200;
    gain2.gain.setValueAtTime(volume, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.3);
  } catch {
    // Audio not supported
  }
}

// Tab title flashing for unread notifications
let flashInterval: NodeJS.Timeout | null = null;
let originalTitle = "";

export function startTitleFlash(message: string) {
  if (flashInterval) return;
  originalTitle = document.title;

  let show = true;
  flashInterval = setInterval(() => {
    document.title = show ? message : originalTitle;
    show = !show;
  }, 1000);
}

export function stopTitleFlash() {
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
    document.title = originalTitle;
  }
}
