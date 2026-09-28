import React, { useState, useEffect, useRef } from 'react';
import {
  Paperclip,
  UploadCloud,
  File,
  Download,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { apiUploadFile, apiGetRoomFiles } from '../services/api';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileShare = ({ roomId, socket, currentUser, onClose }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Load existing room files
  useEffect(() => {
    if (!roomId) return;

    apiGetRoomFiles(roomId)
      .then((data) => setFiles(data))
      .catch((err) => console.error('Failed to load room files:', err));

    if (socket) {
      const handleNewFile = (file) => {
        setFiles((prev) => [file, ...prev]);
      };
      socket.on('new-file-shared', handleNewFile);

      return () => {
        socket.off('new-file-shared', handleNewFile);
      };
    }
  }, [roomId, socket]);

  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;

    setUploading(true);
    setStatusMessage(null);

    try {
      const uploadedFile = await apiUploadFile(
        roomId,
        selectedFile,
        currentUser?.name || 'Anonymous',
        currentUser?.id
      );

      setFiles((prev) => [uploadedFile, ...prev]);

      // Broadcast file metadata to all peers in room
      if (socket) {
        socket.emit('share-file-meta', {
          roomId,
          file: uploadedFile
        });
      }

      setStatusMessage({ type: 'success', text: `Shared "${selectedFile.name}" successfully!` });
    } catch (err) {
      console.error('Upload error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full sm:w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 shadow-2xl animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Paperclip className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100">Shared Files ({files.length})</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Upload Zone */}
      <div className="p-4 border-b border-slate-800">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-950/20'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-800/40 hover:bg-slate-800/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
            className="hidden"
          />
          <UploadCloud className="w-8 h-8 mx-auto text-indigo-400 mb-2 stroke-[1.5]" />
          <p className="text-xs font-semibold text-slate-200">
            {uploading ? 'Uploading to room...' : 'Click to share or drag & drop'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Images, PDFs, documents up to 50MB</p>
        </div>

        {statusMessage && (
          <div
            className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950/60 text-rose-300 border border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Files Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
            <File className="w-10 h-10 mb-2 stroke-[1.5] text-slate-600" />
            <p className="text-sm">No files shared yet</p>
            <p className="text-xs text-slate-600 mt-1">Upload files to share with attendees</p>
          </div>
        ) : (
          files.map((file, idx) => (
            <div
              key={file.id || idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 transition-colors group"
            >
              <div className="flex items-center space-x-3 overflow-hidden mr-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <File className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-slate-200 truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatFileSize(file.fileSize || 0)} • {file.senderName || 'Anonymous'}
                  </p>
                </div>
              </div>

              <a
                href={file.fileUrl}
                download={file.originalName}
                target="_blank"
                rel="noreferrer"
                title="Download file"
                className="p-2 rounded-lg bg-slate-700/60 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileShare;
