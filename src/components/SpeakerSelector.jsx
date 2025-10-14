export const SpeakerSelector = ({ speakers, selectedSpeaker, onSelectSpeaker, onAddSpeaker, onDeleteSpeaker }) => {
    return (
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">화자 선택</h2>
        <div className="flex flex-wrap gap-3">
          {speakers.map(speaker => (
            <div
              key={speaker.id}
              onClick={() => onSelectSpeaker(speaker.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full cursor-pointer transition-all ${
                selectedSpeaker === speaker.id
                  ? 'border-2 border-gray-900 shadow-md'
                  : 'border-2 border-transparent hover:border-gray-300'
              }`}
              style={{ backgroundColor: speaker.color + '22' }}
            >
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: speaker.color }}
              />
              <span className="font-medium text-gray-900">{speaker.name}</span>
              {speakers.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSpeaker(speaker.id);
                  }}
                  className="ml-2 text-lg opacity-60 hover:opacity-100 hover:text-red-600 cursor-pointer"
                >
                  ×
                </span>
              )}
            </div>
          ))}
          <button
            onClick={onAddSpeaker}
            className="px-5 py-2.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors font-medium text-gray-700"
          >
            + 화자 추가
          </button>
        </div>
      </div>
    );
  };