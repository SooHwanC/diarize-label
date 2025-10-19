import { formatFileSize } from '../utils/fileSystemUtils';

export const FileList = ({ files, currentFileIndex, onFileSelect, completedFiles }) => {
  if (!files || files.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">파일이 없습니다</p>
      </div>
    );
  }

  const completedCount = completedFiles?.size || 0;
  const totalCount = files.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div>
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
          <span className="text-green-600 font-bold">{completedCount}</span> / {totalCount} 완료
        </div>
      </div>

      {/* 파일 목록 */}
      <div className="divide-y divide-gray-100">
        {files.map((fileInfo, index) => {
          const isActive = currentFileIndex === index;
          const isCompleted = completedFiles?.has(fileInfo.name);
          
          return (
            <div
              key={fileInfo.name}
              onClick={() => onFileSelect(index)}
              className={`
                px-4 py-3 cursor-pointer transition-all
                ${isActive 
                  ? 'bg-blue-100 border-l-4 border-l-blue-600' 
                  : isCompleted
                    ? 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500'
                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                }
              `}
            >
              <div className="flex items-start gap-2">
                {/* 상태 아이콘 */}
                <div className="flex-shrink-0 text-lg pt-0.5">
                  {isCompleted ? '✅' : isActive ? '▶️' : '🎵'}
                </div>
                
                {/* 파일 정보 */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate leading-tight ${
                    isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-800'
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
                </div>

                {/* 인덱스 번호 */}
                <div className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }
                `}>
                  {index + 1}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

