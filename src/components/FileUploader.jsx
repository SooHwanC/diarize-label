import { useState } from 'react';

export const FileUploader = ({ onFileLoad, fileName }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      onFileLoad(file);
    } else if (file) {
      alert('오디오 파일만 업로드 가능합니다.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      onFileLoad(file);
    } else if (file) {
      alert('오디오 파일만 업로드 가능합니다.');
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white rounded-xl p-8 mb-6 text-center border-2 border-dashed transition-all shadow-sm ${
        isDragging 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-blue-400'
      }`}
    >
      <input
        type="file"
        id="audioFile"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <label
        htmlFor="audioFile"
        className="inline-block px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg cursor-pointer font-semibold text-lg hover:-translate-y-0.5 transition-transform"
      >
        오디오 파일 선택
      </label>
      <div className="mt-3 text-gray-500 text-sm">
        또는 파일을 드래그 앤 드롭하세요
      </div>
      {fileName && (
        <div className="mt-4 text-gray-700 font-medium">{fileName}</div>
      )}
    </div>
  );
};