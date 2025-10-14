export const SavePanel = ({ fileIndex, regionCount, onSave, onClearAll }) => {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="bg-gray-50 p-4 rounded-lg mb-5 flex justify-between items-center border border-gray-200">
          <div className="text-gray-900">
            <strong>다음 파일명:</strong> sample{fileIndex}
          </div>
          <div className="text-gray-600 text-sm">
            저장 경로: ./dataset/audio/train, ./dataset/rttm
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onClearAll}
            className="flex-1 px-6 py-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold text-lg"
          >
            전체 초기화
          </button>
          <button
            onClick={onSave}
            disabled={regionCount === 0}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:-translate-y-0.5 transition-transform font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            최종 저장 (WAV + RTTM)
          </button>
        </div>
      </div>
    );
  };