import { useState } from 'react';

export const SpeakerSelector = ({ 
  speakers, 
  selectedSpeaker, 
  onSelectSpeaker, 
  onAddSpeaker, 
  onUpdateSpeakerName,
  onDeleteSpeaker 
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState('');

  const handleStartEdit = (e, speaker) => {
    e.stopPropagation();
    setEditingId(speaker.id);
    setEditName(speaker.name);
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (editName.trim()) {
      onUpdateSpeakerName(editingId, editName);
    }
    setEditingId(null);
    setEditName('');
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditName('');
  };

  const handleAddSpeaker = () => {
    if (newSpeakerName.trim()) {
      onAddSpeaker(newSpeakerName.trim());
      setNewSpeakerName('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">화자 관리</h2>
        <div className="text-sm text-gray-500">
          {speakers.length}명의 화자 등록됨
        </div>
      </div>

      {speakers.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            등록된 화자가 없습니다. 화자를 추가해주세요.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 mb-4">
          {speakers.map(speaker => (
            <div
              key={speaker.id}
              onClick={() => onSelectSpeaker(speaker.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all ${
                selectedSpeaker === speaker.id
                  ? 'ring-2 ring-gray-900 shadow-md'
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
              style={{ backgroundColor: speaker.color + '22' }}
            >
              <div
                className="w-5 h-5 rounded-full flex-shrink-0"
                style={{ backgroundColor: speaker.color }}
              />
              
              {editingId === speaker.id ? (
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(e);
                      if (e.key === 'Escape') handleCancelEdit(e);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="text-green-600 hover:text-green-700 text-sm font-bold"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-gray-900">{speaker.name}</span>
                  <button
                    onClick={(e) => handleStartEdit(e, speaker)}
                    className="ml-1 text-gray-400 hover:text-blue-600 text-xs"
                    title="이름 편집"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`"${speaker.name}" 화자를 삭제하시겠습니까?`)) {
                        onDeleteSpeaker(speaker.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-600 text-sm"
                    title="화자 삭제"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:-translate-y-0.5 transition-transform font-medium"
      >
        + 새 화자 추가
      </button>

      {/* 화자 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">새 화자 추가</h3>
            <input
              type="text"
              value={newSpeakerName}
              onChange={(e) => setNewSpeakerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSpeaker();
                if (e.key === 'Escape') setShowAddModal(false);
              }}
              placeholder="화자 이름 입력 (예: 홍길동, 상담원 A)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleAddSpeaker}
                disabled={!newSpeakerName.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:-translate-y-0.5 transition-transform font-medium disabled:opacity-50 disabled:transform-none"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};