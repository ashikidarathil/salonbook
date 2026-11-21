import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Icon } from '@iconify/react';
import { placeholderWaveform, waveformFromUrl } from '../waveform';

interface VoicePlayerProps {
  src: string;
  duration?: number;
  waveform?: number[];
}

const formatTime = (secs?: number) => {
  if (!secs || !Number.isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export function VoicePlayer({ src, duration, waveform }: VoicePlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioLength, setAudioLength] = useState(0);
  const [decoded, setDecoded] = useState<{ src: string; peaks: number[] } | null>(null);

  // Older messages have no saved wave: work it out once the message scrolls into view
  useEffect(() => {
    if (waveform?.length || !rootRef.current) return;
    let alive = true;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      waveformFromUrl(src).then((peaks) => {
        if (alive && peaks?.length) setDecoded({ src, peaks });
      });
    });
    observer.observe(rootRef.current);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [src, waveform]);

  const bars = waveform?.length
    ? waveform
    : decoded?.src === src
      ? decoded.peaks
      : placeholderWaveform(src);

  // Browser recordings often report an infinite length, so prefer the saved duration
  const total = duration || audioLength;
  const progress = total > 0 ? Math.min(1, currentTime / total) : 0;

  const readLength = () => {
    const length = audioRef.current?.duration;
    if (length && Number.isFinite(length)) setAudioLength(length);
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play().catch(() => {});
  };

  const seekTo = (fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !total) return;
    const time = Math.max(0, Math.min(1, fraction)) * total;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const onBarsClick = (e: MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - box.left) / box.width);
  };

  const onBarsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!total) return;
    if (e.key === 'ArrowRight') seekTo((currentTime + 2) / total);
    if (e.key === 'ArrowLeft') seekTo((currentTime - 2) / total);
  };

  return (
    <div ref={rootRef} className="flex items-center gap-2 w-[200px] sm:w-[240px] py-1">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={readLength}
        onDurationChange={readLength}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        className="hidden"
      />
      <button
        type="button"
        onClick={toggle}
        className="shrink-0 size-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <Icon icon={isPlaying ? 'solar:pause-bold' : 'solar:play-bold'} className="size-5" />
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div
          role="slider"
          tabIndex={0}
          aria-label="Voice message position"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(total)}`}
          data-voice-wave
          onClick={onBarsClick}
          onKeyDown={onBarsKey}
          className="flex h-7 items-center gap-px cursor-pointer rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
        >
          {bars.map((height, i) => (
            <span
              key={i}
              data-played={(i + 0.5) / bars.length <= progress ? 'true' : 'false'}
              className={`flex-1 min-w-0 rounded-full bg-current transition-opacity ${
                (i + 0.5) / bars.length <= progress ? 'opacity-100' : 'opacity-35'
              }`}
              style={{ height: `${Math.max(8, height)}%` }}
            />
          ))}
        </div>
        <span className="text-[10px] opacity-70 tabular-nums">
          {formatTime(isPlaying || currentTime > 0 ? currentTime : total)}
        </span>
      </div>
    </div>
  );
}
