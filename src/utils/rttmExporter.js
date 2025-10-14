export const generateRTTM = (filename, regions, speakers) => {
    const sortedRegions = [...regions].sort((a, b) => a.start - b.start);
    
    const lines = sortedRegions.map(region => {
      const speaker = speakers.find(s => s.id === region.speakerId);
      const duration = region.end - region.start;
      return `SPEAKER ${filename} 1 ${region.start.toFixed(2)} ${duration.toFixed(2)} <NA> <NA> ${region.speakerId} <NA>`;
    });
    
    return lines.join('\n');
  };
  
  export const downloadFile = (content, filename, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  export const downloadWAV = (audioFile, filename) => {
    const url = URL.createObjectURL(audioFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };