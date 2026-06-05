import React, { useEffect, useRef, useState } from "react";
import type { Video } from "@/shared/types";

interface MuxPlayerWrapperProps {
  video: Video;
  startTime?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  subtitlesEnabled?: boolean;
}

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "mux-player": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        "playback-id"?: string;
        "metadata-video-id"?: string;
        "metadata-video-title"?: string;
        "start-time"?: number;
        autoplay?: boolean;
        controls?: boolean;
        style?: React.CSSProperties;
        ref?: React.Ref<HTMLElement & { currentTime: number; duration: number; paused: boolean; play: () => void; pause: () => void }>;
        "default-hidden-captions"?: boolean;
        "disable-tracking"?: boolean;
      }, HTMLElement>;
    }
  }
}

export default function MuxPlayerWrapper({
  video,
  startTime = 0,
  onTimeUpdate,
  onEnded,
  autoPlay = false,
  subtitlesEnabled = true,
}: MuxPlayerWrapperProps) {
  const playerRef = useRef<HTMLElement & {
    currentTime: number;
    duration: number;
    paused: boolean;
    play: () => void;
    pause: () => void;
  }>(null);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mux/mux-player";
    script.async = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleTimeUpdate = () => {
      const t = player.currentTime;
      const d = player.duration || 0;
      onTimeUpdate?.(t, d);

      if (
        video.intro_start_seconds != null &&
        video.intro_end_seconds != null &&
        t >= video.intro_start_seconds &&
        t < video.intro_end_seconds
      ) {
        setShowSkipIntro(true);
      } else {
        setShowSkipIntro(false);
      }
    };

    const handleEnded = () => {
      onEnded?.();
    };

    player.addEventListener("timeupdate", handleTimeUpdate);
    player.addEventListener("ended", handleEnded);

    // Periodic sync so position saves even if timeupdate batching is inconsistent
    intervalRef.current = setInterval(() => {
      if (!player.paused) {
        onTimeUpdate?.(player.currentTime, player.duration || 0);
      }
    }, 10000);

    return () => {
      player.removeEventListener("timeupdate", handleTimeUpdate);
      player.removeEventListener("ended", handleEnded);
      clearInterval(intervalRef.current);
    };
  }, [video, onTimeUpdate, onEnded]);

  const skipIntro = () => {
    if (playerRef.current && video.intro_end_seconds != null) {
      playerRef.current.currentTime = video.intro_end_seconds;
      setShowSkipIntro(false);
    }
  };

  if (!video.mux_playback_id) {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center rounded-xl">
        <p className="text-gray-500">Video not available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <mux-player
        ref={playerRef}
        playback-id={video.mux_playback_id}
        metadata-video-id={String(video.id)}
        metadata-video-title={video.title}
        start-time={startTime}
        autoplay={autoPlay}
        controls
        default-hidden-captions={!subtitlesEnabled}
        style={{ width: "100%", aspectRatio: "16/9", display: "block" }}
      />

      {showSkipIntro && (
        <button
          onClick={skipIntro}
          className="absolute bottom-20 right-4 md:right-8 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg font-medium text-sm transition-all"
        >
          Skip Intro
        </button>
      )}
    </div>
  );
}
