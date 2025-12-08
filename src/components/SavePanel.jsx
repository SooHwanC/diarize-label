import { useState } from 'react';

export const SavePanel = ({ 
  fileName, 
  regionCount,
  regions,
  speakers,
  onSave, 
  onClearAll,
  onSkip,
  currentFileIndex,
  totalFiles,
  completedCount,
  skippedCount,
  isSkipped,
  isSaving,
  speakerStats
}) => {
  const isLastFile = currentFileIndex !== null && currentFileIndex === totalFiles - 1;
  const [showStats, setShowStats] = useState(false);
  
  // 현재 라벨링된 화자별 구간 수 계산
  const regionsBySpeaker = {};
  regions.forEach(region => {
    const speaker = speakers.find(s => s.id === region.speakerId);
    if (speaker) {
      if (!regionsBySpeaker[speaker.name]) {
        regionsBySpeaker[speaker.name] = { count: 0, duration: 0 };
      }
      regionsBySpeaker[speaker.name].count++;
      regionsBySpeaker[speaker.name].duration += (region.end - region.start);
    }
  });

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* 현재 파일 정보 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-5 border border-blue-200">
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-900 flex items-center gap-2">
            <strong>현재 파일:</strong> 
            <span className="text-sm truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
          </div>
          {totalFiles > 0 && (
            <div className="text-blue-700 font-semibold">
              {currentFileIndex + 1} / {totalFiles}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-600">
            저장 경로: speakers/[화자이름]/*.wav
          </div>
          <div className="text-xs">
            <span className="text-green-600 font-semibold">✅ {completedCount}</span>
            <span className="text-gray-400 mx-1">·</span>
            <span className="text-orange-600 font-semibold">⏭️ {skippedCount}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-700">{totalFiles}</span>
          </div>
        </div>
      </div>

      {/* 스킵 상태 표시 */}
      {isSkipped && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-orange-700 font-semibold text-sm">
              ⏭️ 이 파일은 스킵되었습니다
            </div>
            <button
              onClick={onSkip}
              className="text-xs px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-semibold"
            >
              스킵 해제
            </button>
          </div>
        </div>
      )}

      {/* 현재 라벨링 요약 */}
      {regionCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="text-green-700 font-semibold mb-2">
            ✅ {regionCount}개 구간 레이블링 완료
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(regionsBySpeaker).map(([speakerName, data]) => {
              const speaker = speakers.find(s => s.name === speakerName);
              return (
                <div 
                  key={speakerName}
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: speaker?.color + '33' }}
                >
                  <span className="font-medium">{speakerName}</span>
                  <span className="text-gray-600 ml-1">
                    {data.count}개 ({data.duration.toFixed(1)}초)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 화자별 폴더 통계 */}
      {speakerStats && Object.keys(speakerStats).length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showStats ? '▼' : '▶'} 화자별 저장 현황
          </button>
          {showStats && (
            <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(speakerStats).map(([name, stats]) => (
                  <div key={name} className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{name}</span>
                    <span className="text-gray-500">
                      {stats.fileCount}개 ({(stats.totalSize / 1024 / 1024).toFixed(1)}MB)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            onClick={onClearAll}
            disabled={isSaving}
            className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold disabled:opacity-50"
          >
            🗑️ 초기화
          </button>
          <button
            onClick={onSkip}
            disabled={isSaving}
            className={`px-6 py-3 rounded-lg transition-colors font-semibold disabled:opacity-50 ${
              isSkipped
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            {isSkipped ? '↩️ 스킵 해제' : '⏭️ 스킵하고 다음'}
          </button>
        </div>
        <button
          onClick={onSave}
          disabled={regionCount === 0 || speakers.length === 0 || isSaving}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:-translate-y-0.5 transition-transform font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> 저장 중...
            </span>
          ) : speakers.length === 0 ? (
            '화자를 먼저 추가해주세요'
          ) : (
            isLastFile ? '💾 화자별 WAV 저장 (최종)' : '💾 화자별 WAV 저장 후 다음'
          )}
        </button>
        
        {speakers.length === 0 && (
          <div className="text-center text-sm text-red-500">
            ⚠️ 저장하려면 먼저 화자를 추가해야 합니다
          </div>
        )}
      </div>
    </div>
  );
};