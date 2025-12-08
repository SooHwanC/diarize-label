// File System Access API 유틸리티

// 브라우저 지원 확인
export const isFileSystemAccessSupported = () => {
  return 'showDirectoryPicker' in window;
};

// 폴더 선택
export const selectFolder = async () => {
  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite'
    });
    return dirHandle;
  } catch (err) {
    if (err.name === 'AbortError') {
      // 사용자가 취소
      return null;
    }
    throw err;
  }
};

// 폴더 내 오디오 파일 목록 가져오기
export const getAudioFilesFromFolder = async (dirHandle) => {
  const audioFiles = [];
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma'];
  
  try {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const fileName = entry.name.toLowerCase();
        const hasAudioExtension = audioExtensions.some(ext => fileName.endsWith(ext));
        
        if (hasAudioExtension) {
          const file = await entry.getFile();
          audioFiles.push({
            name: entry.name,
            file: file,
            handle: entry,
            size: file.size,
            lastModified: file.lastModified
          });
        }
      }
    }
    
    // 이름순 정렬
    audioFiles.sort((a, b) => a.name.localeCompare(b.name));
    return audioFiles;
  } catch (err) {
    console.error('Error reading folder:', err);
    throw err;
  }
};

// dataset 폴더 구조 생성 및 파일 저장
export const saveToDatasetFolder = async (dirHandle, fileName, audioBlob, rttmContent) => {
  try {
    // dataset 폴더 생성 또는 가져오기
    const datasetHandle = await dirHandle.getDirectoryHandle('dataset', { create: true });
    
    // audio, rttm 하위 폴더 생성
    const audioHandle = await datasetHandle.getDirectoryHandle('audio', { create: true });
    const rttmHandle = await datasetHandle.getDirectoryHandle('rttm', { create: true });
    
    // 파일명에서 확장자 제거
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    
    // WAV 파일 저장
    const wavFileName = `${baseName}.wav`;
    const wavFileHandle = await audioHandle.getFileHandle(wavFileName, { create: true });
    const wavWritable = await wavFileHandle.createWritable();
    await wavWritable.write(audioBlob);
    await wavWritable.close();
    
    // RTTM 파일 저장
    const rttmFileName = `${baseName}.rttm`;
    const rttmFileHandle = await rttmHandle.getFileHandle(rttmFileName, { create: true });
    const rttmWritable = await rttmFileHandle.createWritable();
    await rttmWritable.write(rttmContent);
    await rttmWritable.close();
    
    return {
      audioPath: `dataset/audio/${wavFileName}`,
      rttmPath: `dataset/rttm/${rttmFileName}`
    };
  } catch (err) {
    console.error('Error saving to dataset folder:', err);
    throw err;
  }
};

// 기존 RTTM 파일 읽기
export const loadExistingRTTM = async (dirHandle, fileName) => {
  try {
    // dataset 폴더 확인
    const datasetHandle = await dirHandle.getDirectoryHandle('dataset', { create: false });
    const rttmHandle = await datasetHandle.getDirectoryHandle('rttm', { create: false });
    
    // 파일명에서 확장자 제거
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const rttmFileName = `${baseName}.rttm`;
    
    // RTTM 파일 읽기
    const rttmFileHandle = await rttmHandle.getFileHandle(rttmFileName, { create: false });
    const file = await rttmFileHandle.getFile();
    const content = await file.text();
    
    return content;
  } catch (err) {
    // 파일이 없으면 null 반환
    if (err.name === 'NotFoundError') {
      return null;
    }
    throw err;
  }
};

// dataset 폴더에서 완료된 파일 목록 가져오기
export const getCompletedFiles = async (dirHandle) => {
  const completedSet = new Set();
  
  try {
    // dataset/rttm 폴더 확인
    const datasetHandle = await dirHandle.getDirectoryHandle('dataset', { create: false });
    const rttmHandle = await datasetHandle.getDirectoryHandle('rttm', { create: false });
    
    // rttm 폴더의 모든 파일 스캔
    for await (const entry of rttmHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.rttm')) {
        // .rttm 제거한 파일명 추출
        const baseName = entry.name.replace('.rttm', '');
        completedSet.add(baseName);
      }
    }
  } catch (err) {
    // dataset 폴더가 없으면 빈 Set 반환
    if (err.name === 'NotFoundError') {
      return completedSet;
    }
    console.error('Error scanning completed files:', err);
  }
  
  return completedSet;
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// 파일명 안전하게 변환 (특수문자 제거)
const sanitizeFileName = (name) => {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
};

/**
 * 화자별 폴더에 WAV 세그먼트 저장
 * 구조: speakers/{화자이름}/{원본파일명}_{시작시간}_{종료시간}.wav
 */
export const saveSegmentsToSpeakerFolders = async (dirHandle, sourceFileName, segments, speakers) => {
  try {
    // speakers 폴더 생성 또는 가져오기
    const speakersHandle = await dirHandle.getDirectoryHandle('speakers', { create: true });
    
    // 원본 파일명에서 확장자 제거
    const baseName = sourceFileName.replace(/\.[^/.]+$/, '');
    
    const savedFiles = [];
    
    // 화자별로 그룹화
    const segmentsBySpeaker = {};
    for (const segment of segments) {
      const speakerId = segment.speakerId;
      if (!segmentsBySpeaker[speakerId]) {
        segmentsBySpeaker[speakerId] = [];
      }
      segmentsBySpeaker[speakerId].push(segment);
    }
    
    // 각 화자별로 폴더 생성 및 파일 저장
    for (const [speakerId, speakerSegments] of Object.entries(segmentsBySpeaker)) {
      const speaker = speakers.find(s => s.id === speakerId);
      if (!speaker) continue;
      
      // 화자 이름으로 폴더 생성 (특수문자 제거)
      const speakerFolderName = sanitizeFileName(speaker.name);
      const speakerHandle = await speakersHandle.getDirectoryHandle(speakerFolderName, { create: true });
      
      // 해당 화자의 모든 세그먼트 저장
      for (const segment of speakerSegments) {
        // 파일명: 원본파일명_시작초_종료초.wav
        const startStr = segment.start.toFixed(2).replace('.', '_');
        const endStr = segment.end.toFixed(2).replace('.', '_');
        const wavFileName = `${baseName}_${startStr}_${endStr}.wav`;
        
        // WAV 파일 저장
        const wavFileHandle = await speakerHandle.getFileHandle(wavFileName, { create: true });
        const wavWritable = await wavFileHandle.createWritable();
        await wavWritable.write(segment.wavBlob);
        await wavWritable.close();
        
        savedFiles.push({
          speaker: speaker.name,
          path: `speakers/${speakerFolderName}/${wavFileName}`,
          duration: segment.duration
        });
      }
    }
    
    return savedFiles;
  } catch (err) {
    console.error('Error saving segments to speaker folders:', err);
    throw err;
  }
};

/**
 * 저장된 화자 폴더들의 통계 정보 가져오기
 */
export const getSpeakerFolderStats = async (dirHandle) => {
  const stats = {};
  
  try {
    const speakersHandle = await dirHandle.getDirectoryHandle('speakers', { create: false });
    
    for await (const entry of speakersHandle.values()) {
      if (entry.kind === 'directory') {
        let fileCount = 0;
        let totalSize = 0;
        
        for await (const fileEntry of entry.values()) {
          if (fileEntry.kind === 'file' && fileEntry.name.endsWith('.wav')) {
            fileCount++;
            const file = await fileEntry.getFile();
            totalSize += file.size;
          }
        }
        
        stats[entry.name] = {
          fileCount,
          totalSize
        };
      }
    }
  } catch (err) {
    if (err.name !== 'NotFoundError') {
      console.error('Error getting speaker folder stats:', err);
    }
  }
  
  return stats;
};

/**
 * speakers 폴더에서 이미 처리된 원본 파일명 목록 가져오기
 * WAV 파일명이 "원본파일명_시작초_종료초.wav" 형태이므로 원본 파일명 추출
 */
export const getProcessedFiles = async (dirHandle) => {
  const processedSet = new Set();
  
  try {
    const speakersHandle = await dirHandle.getDirectoryHandle('speakers', { create: false });
    
    for await (const speakerEntry of speakersHandle.values()) {
      if (speakerEntry.kind === 'directory') {
        for await (const fileEntry of speakerEntry.values()) {
          if (fileEntry.kind === 'file' && fileEntry.name.endsWith('.wav')) {
            // 파일명에서 원본 파일명 추출 (마지막 두 부분 _시작_종료.wav 제거)
            // 예: call_001_0_00_3_50.wav -> call_001
            const nameWithoutExt = fileEntry.name.replace('.wav', '');
            const parts = nameWithoutExt.split('_');
            
            // 마지막 4개 파트가 시작/종료 시간 (0_00, 3_50 형태)
            if (parts.length > 4) {
              const baseName = parts.slice(0, -4).join('_');
              processedSet.add(baseName);
            }
          }
        }
      }
    }
  } catch (err) {
    if (err.name !== 'NotFoundError') {
      console.error('Error getting processed files:', err);
    }
  }
  
  return processedSet;
};

