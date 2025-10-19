export const SavePanel = ({ 
  fileName, 
  regionCount, 
  onSave, 
  onClearAll,
  currentFileIndex,
  totalFiles,
  completedCount,
  hasExistingLabel
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
          <div className="text-green-600 font-semibold">
            완료: {completedCount} / {totalFiles}
          </div>
        </div>
      </div>

      {/* 구간 카운트 표시 */}
      {regionCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="text-center text-green-700 font-semibold">
            ✅ {regionCount}개 구간 레이블링 완료
          </div>
        </div>
      )}
      
      <div className="flex gap-4">
        <button
          onClick={onClearAll}
          className="flex-1 px-6 py-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold text-lg"
        >
          🗑️ 전체 초기화
        </button>
        <button
          onClick={onSave}
          disabled={regionCount === 0}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:-translate-y-0.5 transition-transform font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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