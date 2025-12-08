import { useState, useEffect } from 'react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// LocalStorage 키
const SPEAKERS_STORAGE_KEY = 'speaker_diarization_speakers';

export const useSpeakers = () => {
  // LocalStorage에서 화자 목록 불러오기
  const loadSpeakersFromStorage = () => {
    try {
      const stored = localStorage.getItem(SPEAKERS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('Failed to load speakers from storage:', err);
    }
    return null;
  };

  const [speakers, setSpeakers] = useState(() => {
    const stored = loadSpeakersFromStorage();
    return stored || [];
  });
  const [selectedSpeaker, setSelectedSpeaker] = useState(() => {
    const stored = loadSpeakersFromStorage();
    return stored && stored.length > 0 ? stored[0].id : null;
  });

  // LocalStorage에 화자 목록 저장
  useEffect(() => {
    try {
      localStorage.setItem(SPEAKERS_STORAGE_KEY, JSON.stringify(speakers));
    } catch (err) {
      console.error('Failed to save speakers to storage:', err);
    }
  }, [speakers]);

  const addSpeaker = (name = null) => {
    const newId = `speaker_${Date.now()}`;
    const color = COLORS[speakers.length % COLORS.length];
    const newSpeaker = {
      id: newId,
      name: name || `화자 ${speakers.length + 1}`,
      color: color
    };
    setSpeakers([...speakers, newSpeaker]);
    setSelectedSpeaker(newId);
    return newSpeaker;
  };

  const updateSpeakerName = (speakerId, newName) => {
    if (!newName.trim()) return;
    setSpeakers(speakers.map(s => 
      s.id === speakerId ? { ...s, name: newName.trim() } : s
    ));
  };

  const deleteSpeaker = (speakerId) => {
    if (speakers.length <= 0) return;
    
    const newSpeakers = speakers.filter(s => s.id !== speakerId);
    setSpeakers(newSpeakers);
    
    if (selectedSpeaker === speakerId) {
      setSelectedSpeaker(newSpeakers.length > 0 ? newSpeakers[0].id : null);
    }
  };

  return {
    speakers,
    selectedSpeaker,
    setSelectedSpeaker,
    addSpeaker,
    updateSpeakerName,
    deleteSpeaker
  };
};