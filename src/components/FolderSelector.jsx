import { isFileSystemAccessSupported } from '../utils/fileSystemUtils';

export const FolderSelector = ({ onFolderSelect, folderName }) => {
  const isSupported = isFileSystemAccessSupported();

  if (!isSupported) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          ⚠️ 브라우저가 지원되지 않습니다
        </h3>
        <p className="text-red-700 mb-3">
          이 기능은 Chrome, Edge 브라우저에서만 작동합니다.
        </p>
        <p className="text-red-600 text-sm">
          현재 브라우저: {navigator.userAgent.match(/Chrome|Edge|Firefox|Safari/)?.[0] || '알 수 없음'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-8 mb-6 text-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all shadow-sm">
      <div className="mb-4">
        <div className="text-6xl mb-4">📁</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          작업 폴더 선택
        </h2>
        <p className="text-gray-600 mb-4">
          레이블링할 오디오 파일이 있는 폴더를 선택하세요
        </p>
      </div>

      {folderName ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-blue-800 font-semibold">📂 {folderName}</span>
          </div>
        </div>
      ) : null}

      <button
        onClick={onFolderSelect}
        className="inline-block px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg cursor-pointer font-semibold text-lg hover:-translate-y-0.5 transition-transform"
      >
        {folderName ? '다른 폴더 선택' : '폴더 선택'}
      </button>

      <div className="mt-6 text-sm text-gray-500">
        <p>💡 선택한 폴더에 <strong>dataset/</strong> 폴더가 자동으로 생성됩니다</p>
        <p className="mt-1">저장 구조: dataset/audio/ 및 dataset/rttm/</p>
      </div>
    </div>
  );
};

