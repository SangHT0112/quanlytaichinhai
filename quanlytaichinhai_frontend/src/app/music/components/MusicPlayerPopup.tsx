// components/MusicPlayerPopup.tsx
"use client";

import { useState } from "react";
import { X } from 'lucide-react';
import MusicPlayer from "./MusicPlayer";

// Demo song data
const sampleSong = {
  id: 1,
  title: "Test UI",
  artist: "Chưa có dữ liệu",
  src: "/music/song1.mp3",
  image: "/images/song1.png",
};

const samplePlaylist = [sampleSong];

interface MusicPlayerPopupProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MusicPlayerPopup = ({ isOpen, onToggle }: MusicPlayerPopupProps) => {
  const [currentSong, setCurrentSong] = useState(sampleSong);

  if (!isOpen) return null;

  return (
    <div className="absolute left-0 right-0 mt-2 z-50 bg-player-bg w-80 rounded-xl p-4 shadow-xl border border-player-border">
      <button
        onClick={onToggle}
        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Close music player"
      >
        <X className="w-5 h-5" />
      </button>
      <MusicPlayer
        song={currentSong}
        playlist={samplePlaylist}
        setCurrentSong={setCurrentSong}
      />
    </div>
  );
};

export default MusicPlayerPopup;