import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { FolderSelector } from './components/FolderSelector';
import { FileList } from './components/FileList';
import { SpeakerSelector } from './components/SpeakerSelector';
import { WaveformViewer } from './components/WaveformViewer';
import { RegionsList } from './components/RegionsList';
import { SavePanel } from './components/SavePanel';
import { useSpeakers } from './hooks/useSpeakers';
import { selectFolder, getAudioFilesFromFolder, saveSegmentsToSpeakerFolders, getSpeakerFolderStats, getProcessedFiles, saveRegionsMetadata, loadRegionsMetadata, renameSpeakerFolder, deleteSpeakerFolder } from './utils/fileSystemUtils';
import { extractAudioSegments } from './utils/audioUtils';

function App() {
  // 폴더 관련 상태
  const [folderHandle, setFolderHandle] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [audioFiles, setAudioFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [completedFiles, setCompletedFiles] = useState(new Set());
  const [skippedFiles, setSkippedFiles] = useState(new Set()); // 스킵한 파일들
  const [searchQuery, setSearchQuery] = useState(''); // 검색어
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, pending, skipped
  
  // 현재 작업 중인 파일 상태
  const [audioFile, setAudioFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [regions, setRegions] = useState([]);
  const [savedRegions, setSavedRegions] = useState(null); // 저장된 구간 정보
  const [loopingRegionId, setLoopingRegionId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [speakerStats, setSpeakerStats] = useState({});
  const waveformRef = useRef(null);
  
  const { speakers, selectedSpeaker, setSelectedSpeaker, addSpeaker, updateSpeakerName: updateSpeakerNameOriginal, deleteSpeaker: deleteSpeakerOriginal } = useSpeakers();

  // 화자 이름 업데이트 (폴더 이름도 함께 변경)
  const updateSpeakerName = async (speakerId, newName) => {
    if (!newName.trim()) return;
    
    // 기존 화자 찾기
    const speaker = speakers.find(s => s.id === speakerId);
    if (!speaker) return;
    
    const oldName = speaker.name;
    const trimmedNewName = newName.trim();
    
    // 이름이 같으면 변경할 필요 없음
    if (oldName === trimmedNewName) return;
    
    // 상태 업데이트 (먼저)
    updateSpeakerNameOriginal(speakerId, trimmedNewName);
    
    // 현재 파일의 구간에서 해당 화자를 사용하는 구간들의 이름도 업데이트
    if (waveformRef.current && waveformRef.current.getRegions) {
      const allRegions = waveformRef.current.getRegions();
      allRegions.forEach(region => {
        if (region.speakerId === speakerId) {
          region.speakerName = trimmedNewName;
        }
      });
      // 구간 변경 이벤트 발생하여 UI 업데이트
      handleRegionsChange();
    }
    
    // 폴더가 있으면 폴더 이름도 변경
    if (folderHandle) {
      try {
        await renameSpeakerFolder(folderHandle, oldName, trimmedNewName);
        
        // 통계 업데이트
        const stats = await getSpeakerFolderStats(folderHandle);
        setSpeakerStats(stats);
      } catch (err) {
        console.error('Failed to rename speaker folder:', err);
        // 폴더 변경 실패해도 상태는 이미 업데이트됨
        // 다음 저장 시 새 이름으로 폴더가 생성됨
      }
    }
  };

  // 화자 삭제 (폴더도 함께 삭제)
  const deleteSpeaker = async (speakerId) => {
    // 화자 정보 가져오기 (삭제 전에)
    const speaker = speakers.find(s => s.id === speakerId);
    if (!speaker) return;
    
    // 현재 파일에서 사용 중인지 확인
    const usedInRegions = regions.filter(r => r.speakerId === speakerId);
    if (usedInRegions.length > 0) {
      alert(`화자 "${speaker.name}"는 현재 ${usedInRegions.length}개 구간에서 사용 중입니다.\n\n먼저 해당 구간들을 삭제하거나 다른 화자로 변경해주세요.`);
      return;
    }
    
    // 확인 대화상자
    if (!confirm(`화자 "${speaker.name}"를 삭제하시겠습니까?\n\n저장된 음성 파일도 함께 삭제됩니다.`)) {
      return;
    }
    
    // 상태에서 삭제
    deleteSpeakerOriginal(speakerId);
    
    // 폴더도 삭제
    if (folderHandle) {
      try {
        await deleteSpeakerFolder(folderHandle, speaker.name);
        
        // 통계 업데이트
        const stats = await getSpeakerFolderStats(folderHandle);
        setSpeakerStats(stats);
      } catch (err) {
        console.error('Failed to delete speaker folder:', err);
        // 폴더 삭제 실패해도 상태는 이미 업데이트됨
      }
    }
  };

  // 폴더 선택 핸들러
  const handleFolderSelect = async () => {
    try {
      const dirHandle = await selectFolder();
      if (!dirHandle) return; // 사용자가 취소
      
      // 오디오 파일 목록 가져오기 (먼저 처리)
      const files = await getAudioFilesFromFolder(dirHandle);
      
      // 완료된 파일 목록 복원 (speakers 폴더에서 처리된 파일 확인)
      const completedBasenames = await getProcessedFiles(dirHandle);
      const newCompletedFiles = new Set();
      
      // 오디오 파일명과 매칭 (확장자 제거해서 비교)
      files.forEach(file => {
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        if (completedBasenames.has(baseName)) {
          newCompletedFiles.add(file.name);
        }
      });
      
      // 화자별 폴더 통계 불러오기
      const stats = await getSpeakerFolderStats(dirHandle);
      
      // 모든 데이터 준비 완료 후 한번에 상태 업데이트
      setFolderHandle(dirHandle);
      setFolderName(dirHandle.name);
      setAudioFiles(files);
      setCompletedFiles(newCompletedFiles);
      setSpeakerStats(stats);
      
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
    setSavedRegions(null);
    
    // 새 파일 로드
    const fileInfo = files[index];
    setCurrentFileIndex(index);
    setAudioFile(fileInfo.file);
    setFileName(fileInfo.name);
    
    // 완료된 파일이면 저장된 구간 정보 불러오기
    if (folderHandle && completedFiles.has(fileInfo.name)) {
      try {
        const metadata = await loadRegionsMetadata(folderHandle, fileInfo.name);
        if (metadata && metadata.regions) {
          setSavedRegions(metadata.regions);
        }
      } catch (err) {
        console.error('Failed to load saved regions:', err);
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

    if (speakers.length === 0) {
      alert('화자를 먼저 추가해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      // 오디오 구간 추출 (슬라이싱)
      const segments = await extractAudioSegments(audioFile, regions);
      
      // 화자별 폴더에 저장
      const savedFiles = await saveSegmentsToSpeakerFolders(
        folderHandle,
        fileName,
        segments,
        speakers
      );
      
      // 구간 메타데이터 저장
      await saveRegionsMetadata(folderHandle, fileName, regions);
      
      // 완료된 파일 목록에 추가
      const newCompletedFiles = new Set(completedFiles);
      newCompletedFiles.add(fileName);
      setCompletedFiles(newCompletedFiles);
      
      // 화자별 폴더 통계 업데이트
      const stats = await getSpeakerFolderStats(folderHandle);
      setSpeakerStats(stats);
      
      // 저장 결과 표시
      const speakerSummary = {};
      savedFiles.forEach(f => {
        if (!speakerSummary[f.speaker]) {
          speakerSummary[f.speaker] = { count: 0, duration: 0 };
        }
        speakerSummary[f.speaker].count++;
        speakerSummary[f.speaker].duration += f.duration;
      });
      
      const summaryText = Object.entries(speakerSummary)
        .map(([name, data]) => `${name}: ${data.count}개 (${data.duration.toFixed(1)}초)`)
        .join('\n');
      
      alert(`저장 완료! 총 ${savedFiles.length}개 파일\n\n${summaryText}`);
      
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
    } finally {
      setIsSaving(false);
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

  // 파일 스킵 핸들러
  const handleSkipFile = () => {
    if (!fileName) return;
    
    const newSkippedFiles = new Set(skippedFiles);
    
    if (skippedFiles.has(fileName)) {
      // 이미 스킵된 파일이면 스킵 해제
      newSkippedFiles.delete(fileName);
      setSkippedFiles(newSkippedFiles);
    } else {
      // 스킵 추가
      newSkippedFiles.add(fileName);
      setSkippedFiles(newSkippedFiles);
      
      // 다음 파일로 자동 이동
      if (currentFileIndex !== null && currentFileIndex < audioFiles.length - 1) {
        handleFileSelect(currentFileIndex + 1);
      }
    }
  };

  // 필터링된 파일 목록 계산 (useMemo로 최적화)
  const filteredFiles = useMemo(() => {
    let filtered = audioFiles;

    // 검색어 필터링
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(lowerQuery)
      );
    }

    // 상태 필터링
    if (filterStatus !== 'all') {
      filtered = filtered.filter(file => {
        if (filterStatus === 'completed') {
          return completedFiles.has(file.name);
        } else if (filterStatus === 'skipped') {
          return skippedFiles.has(file.name);
        } else if (filterStatus === 'pending') {
          return !completedFiles.has(file.name) && !skippedFiles.has(file.name);
        }
        return true;
      });
    }

    return filtered;
  }, [audioFiles, searchQuery, filterStatus, completedFiles, skippedFiles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-8 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            화자별 음성 레이블링 도구
          </h1>
          <p className="text-gray-600 mt-1">
            동일화자 감지 모델 파인튜닝을 위한 화자별 WAV 데이터셋 생성
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
      {folderHandle && audioFiles.length === 0 && (
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-3">
              오디오 파일이 없습니다
            </h2>
            <p className="text-yellow-700 mb-4">
              선택한 폴더에서 오디오 파일을 찾을 수 없습니다.
            </p>
            <div className="bg-white rounded-lg p-4 mb-4 text-left">
              <p className="text-sm text-gray-700 mb-2">
                <strong>지원 형식:</strong> MP3, WAV, M4A, AAC, OGG, FLAC, WMA
              </p>
              <p className="text-sm text-gray-600">
                이 형식의 파일이 폴더에 있는지 확인해주세요.
              </p>
            </div>
            <button
              onClick={handleFolderSelect}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:-translate-y-0.5 transition-transform"
            >
              다른 폴더 선택
            </button>
          </div>
        </div>
      )}

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
                files={filteredFiles}
                allFiles={audioFiles}
                currentFileIndex={currentFileIndex}
                onFileSelect={handleFileSelect}
                completedFiles={completedFiles}
                skippedFiles={skippedFiles}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
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
                  onUpdateSpeakerName={updateSpeakerName}
                  onDeleteSpeaker={deleteSpeaker}
                />

                <WaveformViewer
                  ref={waveformRef}
                  audioFile={audioFile}
                  speakers={speakers}
                  savedRegions={savedRegions}
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
              regions={regions}
              speakers={speakers}
              onSave={handleSave}
              onClearAll={handleClearAll}
              onSkip={handleSkipFile}
              currentFileIndex={currentFileIndex}
              totalFiles={audioFiles.length}
              completedCount={completedFiles.size}
              skippedCount={skippedFiles.size}
              isSkipped={skippedFiles.has(fileName)}
              isSaving={isSaving}
              speakerStats={speakerStats}
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