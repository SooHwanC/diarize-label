export const RegionsList = ({ regions, speakers, onPlayRegion, onDeleteRegion }) => {
    const sortedRegions = [...regions].sort((a, b) => a.start - b.start);
  
    return (
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          구간 목록 ({regions.length}개)
        </h2>
        
        {sortedRegions.length === 0 ? (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg border border-blue-200">
            구간을 추가하려면 웨이브폼에서 드래그하세요
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRegions.map((region, index) => {
              const speaker = speakers.find(s => s.id === region.speakerId);
              return (
                <div
                  key={region.id}
                  className="bg-gray-50 rounded-lg p-4 flex justify-between items-center border-l-4 hover:bg-gray-100 transition-colors"
                  style={{ borderLeftColor: speaker?.color }}
                >
                  <div className="flex-1">
                    <div className="font-semibold mb-1" style={{ color: speaker?.color }}>
                      {speaker?.name}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {region.start.toFixed(2)}s ~ {region.end.toFixed(2)}s
                      (길이: {(region.end - region.start).toFixed(2)}s)
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onPlayRegion(region)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      재생
                    </button>
                    <button
                      onClick={() => onDeleteRegion(region.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };