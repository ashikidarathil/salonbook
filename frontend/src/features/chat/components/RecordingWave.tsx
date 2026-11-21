import { useEffect, useRef } from 'react';

const BAR_WIDTH = 3;
const BAR_GAP = 2;

/** Live scrolling wave of the microphone while recording. */
export function RecordingWave({ stream }: { stream: MediaStream }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    audioContext.resume().catch(() => {});

    const samples = new Uint8Array(analyser.fftSize);
    const levels: number[] = [];
    let frame = 0;
    let lastBar = 0;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }

      if (now - lastBar > 70) {
        lastBar = now;
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
        levels.push(Math.min(1, Math.sqrt(sum / samples.length) * 4));
        const maxBars = Math.ceil(width / (BAR_WIDTH + BAR_GAP));
        if (levels.length > maxBars) levels.splice(0, levels.length - maxBars);
      }

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = getComputedStyle(canvas).color;
      levels.forEach((level, i) => {
        const barHeight = Math.max(3, level * height);
        const x = width - (levels.length - i) * (BAR_WIDTH + BAR_GAP);
        ctx.beginPath();
        ctx.roundRect(x, (height - barHeight) / 2, BAR_WIDTH, barHeight, 1.5);
        ctx.fill();
      });
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      audioContext.close().catch(() => {});
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      data-recording-wave
      aria-hidden="true"
      className="h-6 w-0 min-w-0 flex-1 text-primary"
    />
  );
}
