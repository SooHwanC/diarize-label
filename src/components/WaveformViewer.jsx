// WaveformViewer.jsx
import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useWaveSurfer } from '../hooks/useWaveSurfer';
import { formatTime } from '../utils/audioUtils';
import { SpeakerPopup } from './SpeakerPopup';

export const WaveformViewer = forwardRef(({ audioFile, speakers, onRegionsChange }, ref) => {
  const containerRef = useRef(null);
  const [popupPosition, setPopupPosition] = useState(null);
  const [pendingRegion, setPendingRegion] = useState(null);

  const handleRegionCreated = (region, position) => {
    setPendingRegion(region);
    setPopupPosition(position);
  };

  const { 
    isPlaying, 
    currentTime, 
    duration, 
    playPause, 
    stop, 
    zoom,
    getRegions,
    clearAllRegions,
    getRegionById,
    confirmRegion,
    cancelRegion,
    regionsPlugin
  } = useWaveSurfer(
    containerRef,
    audioFile,
    handleRegionCreated
  );

  const handleSpeakerSelect = (speakerId) => {
    const speaker = speakers.find(s => s.id === speakerId);
    if (speaker && pendingRegion) {
      const success = confirmRegion(speakerId, speaker.name, speaker.color);
      
      setPopupPosition(null);
      setPendingRegion(null);
      
      if (onRegionsChange && success) {
        onRegionsChange();
      }
    }
  };

  const handleCancelPopup = () => {
    cancelRegion();
    setPopupPosition(null);
    setPendingRegion(null);
  };

  useImperativeHandle(ref, () => ({
    getRegions,
    clearAllRegions,
    getRegionById
  }));

  useEffect(() => {
    if (!regionsPlugin) return;

    const handleUpdate = () => {
      if (onRegionsChange) {
        onRegionsChange();
      }
    };

    const handleRemoved = (region) => {
      if (region.speakerId && onRegionsChange) {
        onRegionsChange();
      }
    };

    regionsPlugin.on('region-updated', handleUpdate);
    regionsPlugin.on('region-removed', handleRemoved);

    return () => {
      regionsPlugin.un('region-updated', handleUpdate);
      regionsPlugin.un('region-removed', handleRemoved);
    };
  }, [regionsPlugin, onRegionsChange]);

  // 겹치는 구간 찾기
  const findOverlaps = (regions) => {
    const overlaps = [];
    
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const r1 = regions[i];
        const r2 = regions[j];
        
        // 두 구간이 겹치는지 확인
        const overlapStart = Math.max(r1.start, r2.start);
        const overlapEnd = Math.min(r1.end, r2.end);
        
        if (overlapStart < overlapEnd) {
          overlaps.push({
            start: overlapStart,
            end: overlapEnd,
            regions: [r1, r2]
          });
        }
      }
    }
    
    return overlaps;
  };

  const confirmedRegions = getRegions();
  const overlaps = findOverlaps(confirmedRegions);

  if (!audioFile) return null;

  return (
    <>
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">웨이브폼</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-5 border border-blue-200">
          <strong className="text-gray-900">사용 방법:</strong>
          <ul className="mt-2 space-y-1 text-gray-700 text-sm">
            <li>• <strong>드래그</strong>: 웨이브폼에서 드래그하면 화자 선택 팝업이 나타납니다</li>
            <li>• <strong>클릭</strong>: 재생 위치 이동</li>
            <li>• <strong>구간 가장자리 드래그</strong>: 구간 크기 조절</li>
            <li>• <strong>구간 드래그</strong>: 구간 위치 이동</li>
            <li>• <strong>구간 더블클릭</strong>: 구간 삭제</li>
            <li>• <strong>스페이스바</strong>: 재생/정지</li>
          </ul>
        </div>

        {/* 타임라인 바 with 스트라이프 패턴 */}
        {duration > 0 && confirmedRegions.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-1 font-semibold">
              화자 구간 ({confirmedRegions.length}개)
              {overlaps.length > 0 && (
                <span className="ml-2 text-orange-600">⚠ {overlaps.length}개 겹침</span>
              )}
            </div>
            <div className="relative w-full h-8 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
              {/* 일반 구간들 */}
              {confirmedRegions.map((region) => {
                const speaker = speakers.find(s => s.id === region.speakerId);
                const startPercent = (region.start / duration) * 100;
                const widthPercent = ((region.end - region.start) / duration) * 100;
                
                return (
                  <div
                    key={region.id}
                    className="absolute top-0 h-full transition-all hover:opacity-80"
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: speaker?.color || '#888',
                    }}
                    title={`${speaker?.name}: ${region.start.toFixed(2)}s - ${region.end.toFixed(2)}s`}
                  >
                    <div className="h-full flex items-center justify-center">
                      <span className="text-xs text-white font-semibold drop-shadow-md truncate px-1">
                        {widthPercent > 5 ? speaker?.name : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* 겹치는 구간들 - 스트라이프 패턴 */}
              {overlaps.map((overlap, index) => {
                const startPercent = (overlap.start / duration) * 100;
                const widthPercent = ((overlap.end - overlap.start) / duration) * 100;
                const speakers1 = speakers.find(s => s.id === overlap.regions[0].speakerId);
                const speakers2 = speakers.find(s => s.id === overlap.regions[1].speakerId);
                
                return (
                  <div
                    key={`overlap-${index}`}
                    className="absolute top-0 h-full pointer-events-none"
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                      background: `repeating-linear-gradient(
                        45deg,
                        ${speakers1?.color || '#888'}CC,
                        ${speakers1?.color || '#888'}CC 4px,
                        ${speakers2?.color || '#666'}CC 4px,
                        ${speakers2?.color || '#666'}CC 8px
                      )`,
                      zIndex: 10,
                    }}
                    title={`겹침: ${speakers1?.name} & ${speakers2?.name}\n${overlap.start.toFixed(2)}s - ${overlap.end.toFixed(2)}s`}
                  >
                    <div className="h-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold drop-shadow-md">
                        {widthPercent > 3 ? '⚠' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div ref={containerRef} className="mb-5" />

        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={playPause}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:-translate-y-0.5 transition-transform font-semibold"
          >
            {isPlaying ? '정지' : '재생'}
          </button>
          <button
            onClick={stop}
            className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            정지
          </button>
          <div className="font-mono text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <label className="text-gray-600">줌:</label>
            <input
              type="range"
              min="10"
              max="500"
              defaultValue="50"
              onChange={(e) => zoom(e.target.value)}
              className="w-32"
            />
          </div>
        </div>
      </div>

      <SpeakerPopup
        position={popupPosition}
        speakers={speakers}
        onSelect={handleSpeakerSelect}
        onCancel={handleCancelPopup}
      />
    </>
  );
});

WaveformViewer.displayName = 'WaveformViewer';