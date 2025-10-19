import { useState, useCallback, useRef, useEffect } from 'react';
import { FolderSelector } from './components/FolderSelector';
import { FileList } from './components/FileList';
import { SpeakerSelector } from './components/SpeakerSelector';
import { WaveformViewer } from './components/WaveformViewer';
import { RegionsList } from './components/RegionsList';
import { SavePanel } from './components/SavePanel';
import { useSpeakers } from './hooks/useSpeakers';
import { generateRTTM } from './utils/rttmExporter';
import { selectFolder, getAudioFilesFromFolder, saveToDatasetFolder, loadExistingRTTM } from './utils/fileSystemUtils';
import { parseRTTM, mapSpeakersToRegions } from './utils/rttmParser';

function App() {
  // 폴더 관련 상태
  const [folderHandle, setFolderHandle] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [audioFiles, setAudioFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [completedFiles, setCompletedFiles] = useState(new Set());
  
  // 현재 작업 중인 파일 상태
  const [audioFile, setAudioFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [regions, setRegions] = useState([]);
  const [loopingRegionId, setLoopingRegionId] = useState(null);
  const [hasExistingLabel, setHasExistingLabel] = useState(false);
  const waveformRef = useRef(null);
  
  const { speakers, selectedSpeaker, setSelectedSpeaker, addSpeaker, deleteSpeaker } = useSpeakers();

  // 폴더 선택 핸들러
  const handleFolderSelect = async () => {
    try {
      const dirHandle = await selectFolder();
      if (!dirHandle) return; // 사용자가 취소
      
      setFolderHandle(dirHandle);
      setFolderName(dirHandle.name);
      
      // 오디오 파일 목록 가져오기
      const files = await getAudioFilesFromFolder(dirHandle);
      setAudioFiles(files);
      
      if (files.length > 0) {
        // 첫 번째 파일 자동 선택
        handleFileSelect(0, files);
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
      alert('폴더를 선택하는 중 오류가 발생했습니다.');
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = async (index, files = audioFiles) => {
    if (index < 0 || index >= files.length) return;
    
    // 기존 재생 완전히 중지
    if (waveformRef.current) {
      // 반복 재생 중지
      if (waveformRef.current.stopRegionLoop) {
        waveformRef.current.stopRegionLoop();
      }
      // WaveSurfer 정지
      if (waveformRef.current.stop) {
        waveformRef.current.stop();
      }
      // 구간 초기화
      if (waveformRef.current.clearAllRegions) {
        waveformRef.current.clearAllRegions();
      }
    }
    
    // 상태 초기화
    setLoopingRegionId(null);
    setRegions([]);
    setHasExistingLabel(false);
    
    // 새 파일 로드
    const fileInfo = files[index];
    setCurrentFileIndex(index);
    setAudioFile(fileInfo.file);
    setFileName(fileInfo.name);
    
    // 기존 RTTM 파일이 있는지 확인하고 불러오기
    if (folderHandle) {
      try {
        const rttmContent = await loadExistingRTTM(folderHandle, fileInfo.name);
        
        if (rttmContent) {
          // RTTM 파싱
          const parsedRegions = parseRTTM(rttmContent);
          
          if (parsedRegions.length > 0) {
            setHasExistingLabel(true);
            
            // 화자 정보와 매핑 (나중에 WaveSurfer ready 이벤트에서 처리)
            // 일단 상태에 저장해둠
            setTimeout(() => {
              if (waveformRef.current && waveformRef.current.loadRegions) {
                const speakersMap = new Map(speakers.map(s => [s.id, s]));
                const mappedRegions = mapSpeakersToRegions(parsedRegions, speakers);
                waveformRef.current.loadRegions(mappedRegions, speakersMap);
                
                // regions 상태도 업데이트
                setTimeout(() => {
                  if (handleRegionsChange) {
                    handleRegionsChange();
                  }
                }, 100);
              }
            }, 500); // WaveSurfer가 로드될 시간을 줌
          }
        }
      } catch (err) {
        console.error('Failed to load existing RTTM:', err);
        // 에러가 있어도 계속 진행
      }
    }
  };

  const handleRegionsChange = useCallback(() => {
    if (waveformRef.current && waveformRef.current.getRegions) {
      const allRegions = waveformRef.current.getRegions();
      
      const currentRegions = allRegions
        .filter(region => !!region.speakerId)
        .map(region => ({
          id: region.id,
          start: region.start,
          end: region.end,
          speakerId: region.speakerId,
          speakerName: region.speakerName
        }));
      
      setRegions([...currentRegions]);
    }
  }, []);

  const handlePlayRegion = (regionId) => {
    if (waveformRef.current && waveformRef.current.playRegionLoop) {
      // 같은 구간을 다시 클릭하면 반복 정지
      if (loopingRegionId === regionId) {
        waveformRef.current.stopRegionLoop();
        setLoopingRegionId(null);
      } else {
        // 새로운 구간 반복 재생
        waveformRef.current.playRegionLoop(regionId);
        setLoopingRegionId(regionId);
      }
    }
  };

  const handleDeleteRegion = (regionId) => {
    // 삭제하려는 구간이 반복 재생 중이면 먼저 중지
    if (loopingRegionId === regionId) {
      if (waveformRef.current && waveformRef.current.stopRegionLoop) {
        waveformRef.current.stopRegionLoop();
      }
      setLoopingRegionId(null);
    }
    
    if (waveformRef.current && waveformRef.current.getRegionById) {
      const wavesurferRegion = waveformRef.current.getRegionById(regionId);
      if (wavesurferRegion) {
        wavesurferRegion.remove();
      }
    }
  };

  const handleSave = async () => {
    if (regions.length === 0) {
      alert('저장할 구간이 없습니다.');
      return;
    }

    if (!folderHandle) {
      alert('폴더가 선택되지 않았습니다.');
      return;
    }

    try {
      // RTTM 내용 생성
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      const rttmContent = generateRTTM(baseName, regions, speakers);
      
      // 오디오 파일을 Blob으로 변환
      const audioBlob = audioFile;
      
      // dataset 폴더에 저장
      const result = await saveToDatasetFolder(
        folderHandle,
        fileName,
        audioBlob,
        rttmContent
      );
      
      // 완료된 파일 목록에 추가
      const newCompletedFiles = new Set(completedFiles);
      newCompletedFiles.add(fileName);
      setCompletedFiles(newCompletedFiles);
      
      alert(`저장 완료!\n\n✅ ${result.audioPath}\n✅ ${result.rttmPath}`);
      
      // 다음 파일로 자동 이동
      if (currentFileIndex !== null && currentFileIndex < audioFiles.length - 1) {
        handleFileSelect(currentFileIndex + 1);
      } else {
        // 마지막 파일이면 초기화
        setRegions([]);
        if (waveformRef.current && waveformRef.current.clearAllRegions) {
          waveformRef.current.clearAllRegions();
        }
      }
    } catch (err) {
      console.error('Failed to save:', err);
      alert('저장 중 오류가 발생했습니다.\n\n' + err.message);
    }
  };

  const handleClearAll = () => {
    if (confirm('정말 모든 구간을 삭제하시겠습니까?')) {
      if (waveformRef.current && waveformRef.current.clearAllRegions) {
        waveformRef.current.clearAllRegions();
      }
      setRegions([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-8 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            RTTM 레이블링 도구
          </h1>
          <p className="text-gray-600 mt-1">
            pyannote 학습용 화자 다이어리제이션 데이터셋 생성
          </p>
        </div>
      </header>

      {/* 폴더 선택 */}
      {!folderHandle && (
        <div className="max-w-4xl mx-auto p-8">
          <FolderSelector 
            onFolderSelect={handleFolderSelect}
            folderName={folderName}
          />
        </div>
      )}

      {/* 메인 레이아웃: 사이드바 + 작업 공간 */}
      {audioFiles.length > 0 && (
        <div className="flex h-[calc(100vh-120px)]">
          {/* 왼쪽 사이드바 - 파일 목록 */}
          <div className="w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900">📁 {folderName}</h2>
                <button
                  onClick={handleFolderSelect}
                  className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                >
                  변경
                </button>
              </div>
              <div className="text-sm text-gray-600">
                총 {audioFiles.length}개 파일
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <FileList
                files={audioFiles}
                currentFileIndex={currentFileIndex}
                onFileSelect={handleFileSelect}
                completedFiles={completedFiles}
              />
            </div>
          </div>

          {/* 오른쪽 작업 공간 */}
          <div className="flex-1 overflow-y-auto">
            {audioFile ? (
              <div className="p-8 max-w-6xl mx-auto">
                <SpeakerSelector
                  speakers={speakers}
                  selectedSpeaker={selectedSpeaker}
                  onSelectSpeaker={setSelectedSpeaker}
                  onAddSpeaker={addSpeaker}
                  onDeleteSpeaker={deleteSpeaker}
                />

                <WaveformViewer
                  ref={waveformRef}
                  audioFile={audioFile}
                  speakers={speakers}
                  onRegionsChange={handleRegionsChange}
                  onLoopingChange={setLoopingRegionId}
                />

                <RegionsList
                  regions={regions}
                  speakers={speakers}
                  onPlayRegion={handlePlayRegion}
                  onDeleteRegion={handleDeleteRegion}
                  loopingRegionId={loopingRegionId}
                />

            <SavePanel
              fileName={fileName}
              regionCount={regions.length}
              onSave={handleSave}
              onClearAll={handleClearAll}
              currentFileIndex={currentFileIndex}
              totalFiles={audioFiles.length}
              completedCount={completedFiles.size}
              hasExistingLabel={hasExistingLabel}
            />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-lg">왼쪽에서 파일을 선택하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;