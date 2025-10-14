export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(5, '0')}`;
  };