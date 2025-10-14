import { useState } from 'react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const useSpeakers = () => {
  const [speakers, setSpeakers] = useState([
    { id: 'speaker_0', name: 'Speaker 0', color: '#3b82f6' },
    { id: 'speaker_1', name: 'Speaker 1', color: '#ef4444' }
  ]);
  const [selectedSpeaker, setSelectedSpeaker] = useState('speaker_0');

  const addSpeaker = () => {
    const newId = `speaker_${speakers.length}`;
    const color = COLORS[speakers.length % COLORS.length];
    setSpeakers([...speakers, {
      id: newId,
      name: `Speaker ${speakers.length}`,
      color: color
    }]);
    setSelectedSpeaker(newId);
  };

  const deleteSpeaker = (speakerId) => {
    if (speakers.length <= 1) return;
    
    setSpeakers(speakers.filter(s => s.id !== speakerId));
    
    if (selectedSpeaker === speakerId) {
      setSelectedSpeaker(speakers[0].id);
    }
  };

  return {
    speakers,
    selectedSpeaker,
    setSelectedSpeaker,
    addSpeaker,
    deleteSpeaker
  };
};