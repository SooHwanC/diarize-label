export const SavePanel = ({ 
  fileName, 
  regionCount, 
  onSave, 
  onClearAll,
  onSkip,
  currentFileIndex,
  totalFiles,
  completedCount,
  skippedCount,
  hasExistingLabel,
  isSkipped
}) => {
  const isLastFile = currentFileIndex !== null && currentFileIndex === totalFiles - 1;
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* 현재 파일 정보 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-5 border border-blue-200">
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-900 flex items-center gap-2">
            <strong>현재 파일:</strong> {fileName}
            {hasExistingLabel && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-semibold">
                📝 수정 중
              </span>
            )}
          </div>
          {totalFiles > 0 && (
            <div className="text-blue-700 font-semibold">
              {currentFileIndex + 1} / {totalFiles}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-600">
            저장 경로: dataset/audio/ 및 dataset/rttm/
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

      {/* 구간 카운트 표시 */}
      {regionCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="text-center text-green-700 font-semibold">
            ✅ {regionCount}개 구간 레이블링 완료
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            onClick={onClearAll}
            className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold"
          >
            🗑️ 초기화
          </button>
          <button
            onClick={onSkip}
            className={`px-6 py-3 rounded-lg transition-colors font-semibold ${
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
          disabled={regionCount === 0}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:-translate-y-0.5 transition-transform font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {hasExistingLabel 
            ? (isLastFile ? '💾 수정 저장 (덮어쓰기)' : '💾 수정 저장 후 다음')
            : (isLastFile ? '💾 최종 저장' : '💾 저장 후 다음 파일')
          }
        </button>
      </div>
    </div>
  );
};