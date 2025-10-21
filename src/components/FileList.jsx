import { formatFileSize } from '../utils/fileSystemUtils';
import { useState, useEffect, useRef } from 'react';

export const FileList = ({ 
  files, 
  allFiles,
  currentFileIndex, 
  onFileSelect, 
  completedFiles, 
  skippedFiles,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange
}) => {
  const completedCount = completedFiles?.size || 0;
  const skippedCount = skippedFiles?.size || 0;
  const totalCount = allFiles?.length || files.length;
  const pendingCount = totalCount - completedCount - skippedCount;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // 가상 스크롤 상태
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const ITEM_HEIGHT = 90; // 각 아이템 높이
  const CONTAINER_HEIGHT = typeof window !== 'undefined' ? window.innerHeight - 400 : 600;
  const BUFFER_SIZE = 5; // 위아래 버퍼 아이템 수

  // 보이는 영역의 아이템 계산
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    files.length,
    Math.ceil((scrollTop + CONTAINER_HEIGHT) / ITEM_HEIGHT) + BUFFER_SIZE
  );
  const visibleFiles = files.slice(startIndex, endIndex);

  // 스크롤 핸들러
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // 파일 아이템 렌더링
  const renderFileItem = (fileInfo, index) => {
    const actualIndex = allFiles.findIndex(f => f.name === fileInfo.name);
    const isActive = currentFileIndex === actualIndex;
    const isCompleted = completedFiles?.has(fileInfo.name);
    const isSkipped = skippedFiles?.has(fileInfo.name);

    return (
      <div
        key={fileInfo.name}
        style={{
          position: 'absolute',
          top: `${index * ITEM_HEIGHT}px`,
          left: 0,
          right: 0,
          height: `${ITEM_HEIGHT}px`
        }}
        onClick={() => onFileSelect(actualIndex)}
        className={`
          px-4 py-3 cursor-pointer transition-all border-b border-gray-100
          ${isActive 
            ? 'bg-blue-100 border-l-4 border-l-blue-600' 
            : isSkipped
              ? 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-500'
              : isCompleted
                ? 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500'
                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
          }
        `}
      >
        <div className="flex items-start gap-2">
          {/* 상태 아이콘 */}
          <div className="flex-shrink-0 text-lg pt-0.5">
            {isSkipped ? '⏭️' : isCompleted ? '✅' : isActive ? '▶️' : '🎵'}
          </div>
          
          {/* 파일 정보 */}
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold truncate leading-tight ${
              isActive ? 'text-blue-700' 
              : isSkipped ? 'text-orange-700 line-through'
              : isCompleted ? 'text-green-700' 
              : 'text-gray-800'
            }`}>
              {fileInfo.name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatFileSize(fileInfo.size)}
            </div>
            {isActive && (
              <div className="text-xs text-blue-600 font-semibold mt-1">
                작업 중
              </div>
            )}
            {isSkipped && !isActive && (
              <div className="text-xs text-orange-600 font-semibold mt-1">
                스킵됨
              </div>
            )}
          </div>

          {/* 인덱스 번호 */}
          <div className={`
            flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${isActive 
              ? 'bg-blue-600 text-white' 
              : isSkipped
                ? 'bg-orange-600 text-white'
                : isCompleted
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-600'
            }
          `}>
            {actualIndex + 1}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 검색 바 */}
      <div className="p-3 bg-white border-b border-gray-200">
        <input
          type="text"
          placeholder="🔍 파일명 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 필터 버튼 */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-1 text-xs">
          <button
            onClick={() => onFilterChange('all')}
            className={`flex-1 px-2 py-1.5 rounded transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            전체 ({totalCount})
          </button>
          <button
            onClick={() => onFilterChange('pending')}
            className={`flex-1 px-2 py-1.5 rounded transition-colors ${
              filterStatus === 'pending'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            미완료 ({pendingCount})
          </button>
          <button
            onClick={() => onFilterChange('completed')}
            className={`flex-1 px-2 py-1.5 rounded transition-colors ${
              filterStatus === 'completed'
                ? 'bg-green-600 text-white font-semibold'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            완료 ({completedCount})
          </button>
          <button
            onClick={() => onFilterChange('skipped')}
            className={`flex-1 px-2 py-1.5 rounded transition-colors ${
              filterStatus === 'skipped'
                ? 'bg-orange-600 text-white font-semibold'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            스킵 ({skippedCount})
          </button>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-700 w-10 text-right">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="text-xs text-gray-600 text-center">
          <span className="text-green-600 font-bold">{completedCount}</span> 완료 · 
          <span className="text-gray-700 font-bold ml-1">{pendingCount}</span> 대기 · 
          <span className="text-orange-600 font-bold ml-1">{skippedCount}</span> 스킵
        </div>
      </div>

      {/* 검색 결과 없음 */}
      {files.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm">검색 결과가 없습니다</p>
        </div>
      ) : (
        /* 가상 스크롤 파일 목록 */
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{
            height: `${CONTAINER_HEIGHT}px`,
            overflowY: 'auto',
            position: 'relative'
          }}
        >
          {/* 전체 높이를 위한 스페이서 */}
          <div style={{ height: `${files.length * ITEM_HEIGHT}px`, position: 'relative' }}>
            {/* 보이는 아이템만 렌더링 */}
            {visibleFiles.map((fileInfo, idx) => 
              renderFileItem(fileInfo, startIndex + idx)
            )}
          </div>
        </div>
      )}
    </div>
  );
};


