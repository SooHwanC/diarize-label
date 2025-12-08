export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(5, '0')}`;
};

/**
 * AudioBuffer를 WAV Blob으로 변환
 */
export const audioBufferToWav = (audioBuffer) => {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  // 모든 채널 데이터 가져오기
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  // Interleave channels
  const length = channels[0].length;
  const interleaved = new Float32Array(length * numChannels);
  
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      interleaved[i * numChannels + ch] = channels[ch][i];
    }
  }

  // Float32 to Int16
  const dataLength = interleaved.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // WAV 헤더 작성
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // 오디오 데이터 작성
  let offset = 44;
  for (let i = 0; i < interleaved.length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

/**
 * 오디오 파일을 AudioBuffer로 디코딩
 */
export const decodeAudioFile = async (audioFile) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await audioFile.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioContext.close();
  return audioBuffer;
};

/**
 * AudioBuffer에서 특정 구간을 슬라이싱
 */
export const sliceAudioBuffer = (audioBuffer, startTime, endTime) => {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const length = endSample - startSample;

  // Offline AudioContext 생성
  const offlineContext = new OfflineAudioContext(numChannels, length, sampleRate);
  const newBuffer = offlineContext.createBuffer(numChannels, length, sampleRate);

  // 각 채널 데이터 복사
  for (let ch = 0; ch < numChannels; ch++) {
    const sourceData = audioBuffer.getChannelData(ch);
    const destData = newBuffer.getChannelData(ch);
    
    for (let i = 0; i < length; i++) {
      destData[i] = sourceData[startSample + i] || 0;
    }
  }

  return newBuffer;
};

/**
 * 오디오 파일에서 지정된 구간들을 추출하여 WAV Blob 배열로 반환
 */
export const extractAudioSegments = async (audioFile, regions) => {
  // 오디오 파일 디코딩
  const audioBuffer = await decodeAudioFile(audioFile);
  
  // 각 구간별로 슬라이싱 및 WAV 변환
  const segments = [];
  
  for (const region of regions) {
    const slicedBuffer = sliceAudioBuffer(audioBuffer, region.start, region.end);
    const wavBlob = audioBufferToWav(slicedBuffer);
    
    segments.push({
      ...region,
      wavBlob,
      duration: region.end - region.start
    });
  }
  
  return segments;
};