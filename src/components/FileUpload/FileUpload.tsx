/**
 * 文件上传组件
 * 支持拖拽上传和点击上传
 */

import React, { useState, useCallback, useRef } from 'react';
import { fileParserService, type UploadedFile } from '@/services/file-parser-service';

interface FileUploadProps {
  /** 文件上传成功回调 */
  onFileUploaded: (file: UploadedFile) => void;
  /** 文件移除回调 */
  onFileRemoved?: () => void;
  /** 当前上传的文件 */
  currentFile?: UploadedFile | null;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  onFileRemoved,
  currentFile,
  disabled = false,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理文件
   */
  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setError(null);

      const uploadedFile: UploadedFile = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'parsing',
      };

      try {
        // 验证文件
        const validation = fileParserService.validateFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // 解析文件
        const parsedData = await fileParserService.parseFile(file);

        uploadedFile.parsedData = parsedData;
        uploadedFile.status = 'success';

        onFileUploaded(uploadedFile);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '文件解析失败';
        uploadedFile.status = 'error';
        uploadedFile.error = errorMessage;
        setError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileUploaded]
  );

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * 处理文件放置
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [disabled, processFile]
  );

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
      // 重置 input 以允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFile]
  );

  /**
   * 点击上传区域
   */
  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  }, [disabled, isProcessing]);

  /**
   * 移除文件
   */
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setError(null);
      onFileRemoved?.();
    },
    [onFileRemoved]
  );

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // 紧凑模式 - 显示为与输入框等高的按钮
  if (compact) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <button
          onClick={currentFile?.status === 'success' ? handleRemove : handleClick}
          disabled={disabled || isProcessing}
          className={`
            flex items-center justify-center w-12 h-12 rounded-xl border transition-all
            ${
              currentFile?.status === 'success'
                ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300'
                : error
                  ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={
            currentFile?.status === 'success'
              ? `已上传: ${currentFile.name}（点击移除）`
              : error
                ? `上传失败: ${error}`
                : '上传文件 (CSV, JSON, Excel)'
          }
        >
          {isProcessing ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : currentFile?.status === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : error ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          )}
        </button>
      </>
    );
  }

  // 完整模式 - 拖拽区域
  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {currentFile?.status === 'success' && currentFile.parsedData ? (
        /* 已上传文件预览 */
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg text-xl">
                {currentFile.parsedData.fileType === 'csv'
                  ? '📊'
                  : currentFile.parsedData.fileType === 'json'
                    ? '📋'
                    : '📑'}
              </div>
              <div>
                <div className="font-medium text-gray-800">{currentFile.name}</div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(currentFile.size)} • {currentFile.parsedData.totalRows} 行 •{' '}
                  {currentFile.parsedData.columns.length} 列
                </div>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="移除文件"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 列信息预览 */}
          <div className="text-xs text-gray-600 mb-2">
            <span className="font-medium">列:</span>{' '}
            {currentFile.parsedData.columns
              .slice(0, 5)
              .map(c => c.title)
              .join(', ')}
            {currentFile.parsedData.columns.length > 5 &&
              ` 等 ${currentFile.parsedData.columns.length} 列`}
          </div>

          {/* 警告信息 */}
          {currentFile.parsedData.warnings && currentFile.parsedData.warnings.length > 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              ⚠️ {currentFile.parsedData.warnings[0]}
            </div>
          )}
        </div>
      ) : (
        /* 上传区域 */
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all
            ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isProcessing ? 'pointer-events-none' : ''}
          `}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">正在解析文件...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">{isDragging ? '📥' : '📁'}</div>
              <div className="text-sm text-gray-600 mb-1">
                {isDragging ? '松开以上传文件' : '拖拽文件到此处，或点击选择'}
              </div>
              <div className="text-xs text-gray-400">支持 CSV, JSON, Excel 文件 (最大 5MB)</div>
            </>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
