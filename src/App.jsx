import { useState, useCallback, useRef } from 'react';
import { FileUploader } from './components/FileUploader';
import { SpeakerSelector } from './components/SpeakerSelector';
import { WaveformViewer } from './components/WaveformViewer';
import { RegionsList } from './components/RegionsList';
import { SavePanel } from './components/SavePanel';
import { useSpeakers } from './hooks/useSpeakers';
import { generateRTTM, downloadFile, downloadWAV } from './utils/rttmExporter';

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileIndex, setFileIndex] = useState(1);
  const [regions, setRegions] = useState([]);
  const waveformRef = useRef(null);
  
  const { speakers, selectedSpeaker, setSelectedSpeaker, addSpeaker, deleteSpeaker } = useSpeakers();

  const handleFileLoad = (file) => {
    setAudioFile(file);
    setFileName(file.name);
    setRegions([]);
  };

  const handleRegionsChange = useCallback(() => {
    console.log('[App] handleRegionsChange called');
    
    if (waveformRef.current && waveformRef.current.getRegions) {
      const allRegions = waveformRef.current.getRegions();
      console.log('[App] Got regions from waveform:', allRegions.length);
      
      const currentRegions = allRegions
        .filter(region => !!region.speakerId)
        .map(region => ({
          id: region.id,
          start: region.start,
          end: region.end,
          speakerId: region.speakerId,
          speakerName: region.speakerName
        }));
      
      console.log('[App] Filtered regions:', currentRegions.length);
      console.log('[App] Setting regions state:', currentRegions);
      setRegions([...currentRegions]);
    }
  }, []);

  const handlePlayRegion = (region) => {
    if (waveformRef.current && waveformRef.current.getRegionById) {
      const wavesurferRegion = waveformRef.current.getRegionById(region.id);
      if (wavesurferRegion) {
        wavesurferRegion.play();
      }
    }
  };

  const handleDeleteRegion = (regionId) => {
    if (waveformRef.current && waveformRef.current.getRegionById) {
      const wavesurferRegion = waveformRef.current.getRegionById(regionId);
      if (wavesurferRegion) {
        wavesurferRegion.remove();
      }
    }
  };

  const handleSave = () => {
    if (regions.length === 0) {
      alert('저장할 구간이 없습니다.');
      return;
    }

    const filename = `sample${fileIndex}`;
    
    const rttmContent = generateRTTM(filename, regions, speakers);
    downloadFile(rttmContent, `${filename}.rttm`);
    
    downloadWAV(audioFile, `${filename}.wav`);
    
    alert(`저장 완료: ${filename}\n\nWAV와 RTTM 파일이 다운로드되었습니다.`);
    
    setFileIndex(fileIndex + 1);
    setRegions([]);
    if (waveformRef.current && waveformRef.current.clearAllRegions) {
      waveformRef.current.clearAllRegions();
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
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            RTTM 레이블링 도구
          </h1>
          <p className="text-gray-600 text-lg">
            pyannote 학습용 화자 다이어리제이션 데이터셋 생성
          </p>
        </header>

        <FileUploader onFileLoad={handleFileLoad} fileName={fileName} />

        {audioFile && (
          <>
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
            />

            <RegionsList
              regions={regions}
              speakers={speakers}
              onPlayRegion={handlePlayRegion}
              onDeleteRegion={handleDeleteRegion}
            />

            <SavePanel
              fileIndex={fileIndex}
              regionCount={regions.length}
              onSave={handleSave}
              onClearAll={handleClearAll}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;