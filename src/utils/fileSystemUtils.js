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

