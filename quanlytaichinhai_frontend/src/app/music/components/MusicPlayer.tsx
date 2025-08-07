"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider"; // Assuming you have a shadcn Slider component

interface Song {
  id: number;
  title: string;
  artist: string;
  src: string;
  image: string;
}

interface MusicPlayerProps {
  song: Song;
  playlist: Song[];
  setCurrentSong: (song: Song) => void;
}

const MusicPlayer = ({ song, playlist, setCurrentSong }: MusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7); // Default volume

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [song, isPlaying, volume]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const newProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isNaN(newProgress) ? 0 : newProgress);
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = (audioRef.current.duration / 100) * value[0];
      setProgress(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
      setVolume(value[0] / 100);
    }
  };

  const playNextSong = () => {
    const currentIndex = playlist.findIndex(s => s.id === song.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentSong(playlist[nextIndex]);
    setIsPlaying(true);
  };

  const playPreviousSong = () => {
    const currentIndex = playlist.findIndex(s => s.id === song.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentSong(playlist[prevIndex]);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-card p-4 rounded-lg shadow-sm text-card-foreground">
      <audio
        ref={audioRef}
        src={song.src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={playNextSong}
        preload="metadata"
      />
      <Image
        src={song.image || "/placeholder.svg"}
        alt={song.title}
        width={180}
        height={180}
        className="rounded-md object-cover shadow-md"
      />
      <div className="text-center">
        <h3 className="text-lg font-semibold text-player-text">{song.title}</h3>
        <p className="text-sm text-muted-foreground">{song.artist}</p>
      </div>

      <div className="w-full">
        <Slider
          value={[progress]}
          max={100}
          step={0.1}
          onValueChange={handleProgressChange}
          className="[&>span:first-child]:h-1 [&>span:first-child]:bg-player-accent [&_[role=slider]]:bg-player-accent [&_[role=slider]]:border-player-accent [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{new Date(progress * (audioRef.current?.duration || 0) * 10).toISOString().slice(14, 19)}</span>
          <span>{new Date((audioRef.current?.duration || 0) * 1000).toISOString().slice(14, 19)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={playPreviousSong} className="text-player-text hover:bg-player-accent hover:text-white">
          <SkipBack className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayPause}
          className="bg-player-gradient-start hover:bg-player-gradient-end text-white p-2 rounded-full shadow-md transition-all"
        >
          {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={playNextSong} className="text-player-text hover:bg-player-accent hover:text-white">
          <SkipForward className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex items-center w-full gap-2">
        {volume === 0 ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-muted-foreground" />}
        <Slider
          value={[volume * 100]}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
          className="flex-1 [&>span:first-child]:h-1 [&>span:first-child]:bg-player-accent [&_[role=slider]]:bg-player-accent [&_[role=slider]]:border-player-accent [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
        />
      </div>
    </div>
  );
};

export default MusicPlayer;