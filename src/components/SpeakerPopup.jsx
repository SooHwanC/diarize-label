export const SpeakerPopup = ({ position, speakers, onSelect, onCancel }) => {
    if (!position) return null;
  
    return (
      <>
        <div 
          className="fixed inset-0 z-40" 
          onClick={onCancel}
        />
        <div
          className="fixed z-50 bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-4"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%) translateY(-10px)'
          }}
        >
          <div className="text-sm font-semibold text-gray-700 mb-3">화자 선택</div>
          <div className="flex flex-col gap-2 min-w-[150px]">
            {speakers.map(speaker => (
              <button
                key={speaker.id}
                onClick={() => onSelect(speaker.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: speaker.color }}
                />
                <span className="font-medium text-gray-800">{speaker.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={onCancel}
            className="w-full mt-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
          >
            취소
          </button>
        </div>
      </>
    );
  };