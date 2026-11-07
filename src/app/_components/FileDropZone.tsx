"use client"

import { CloudUpload, FileText, Check, X } from 'lucide-react';
import { useState, useRef } from 'react';

interface FileDropZoneProps {
    file: File | null,
    handleUploadFile: (file: File) => void
    handleRemoveFile: () => void
    /** 'legacy' keeps the original look for screens not yet on the arcade system. */
    variant?: 'legacy' | 'arcade'
}

export default function FileDropzone({ file, handleUploadFile, handleRemoveFile, variant = 'legacy' }: FileDropZoneProps) {
    const arcade = variant === 'arcade';
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Drag and Drop Event Handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFile(e.dataTransfer.files[0]);
        }
    };

    // Button Click Handler
    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploadFile(e.target.files[0]);
        }
    };

    const clearFile = () => {
        handleRemoveFile();
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset the hidden input
        }
    };

        if (file && arcade) {
        return (
            <div className="px-notch flex h-44 w-full flex-col items-center justify-center gap-3 border-4 border-frame-strong bg-screen p-4">
                <FileText className="size-8 text-muted" aria-hidden />
                <div className="flex max-w-full items-center gap-2">
                    <Check className="size-5 shrink-0 text-px-lime" strokeWidth={3} aria-hidden />
                    <span className="truncate text-lg">{file.name}</span>
                </div>
                <button type="button" onClick={clearFile} className="px-btn px-btn-sm px-btn-ghost">
                    <X className="size-4" aria-hidden /> Remove
                </button>
            </div>
        );
    }

    if (file) {
        return (
            <div className="flex items-center justify-between w-full p-4 border rounded-t-xl bg-slate-50 border-slate-200 font-inter">
                <div className="flex items-center gap-3 overflow-hidden max-w-54">
                    {/* Document Icon */}
                    <div className="flex-shrink-0 p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-brand">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>

                    {/* File Name */}
                    <span className="text-sm font-medium text-slate-700 truncate">
                        {file.name}
                    </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {/* Checkmark Icon */}
                    <svg className="text-green-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>

                    {/* Remove Button (X) */}
                    <button
                        onClick={clearFile}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remove file"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    if (arcade) {
        return (
            <div
                className={`px-notch flex h-44 w-full flex-col items-center justify-center border-4 border-dashed px-6 text-center ${isDragging ? 'border-px-cyan bg-raised' : 'border-frame-strong bg-screen'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CloudUpload className="size-8 text-px-cyan" aria-hidden />
                <h3 className="mt-2 text-lg">Drop a file here</h3>
                <p className="text-sm text-muted">PDF, TXT and DOCX formats, up to 5MB</p>
                <button type="button" onClick={handleBrowseClick} className="px-btn px-btn-sm px-btn-ghost mt-3">Browse files</button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".jpeg,.jpg,.png,.pdf,.mp4" />
            </div>
        );
    }

    return (
        <div
            className={`
        flex flex-col items-center justify-center w-full px-12 py-6
        border-2 border-dashed rounded-t-2xl transition-colors font-inter
        ${isDragging
                    ? 'border-brand bg-brand/5'
                    : 'border-slate-300 bg-white'
                }
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <CloudUpload className='w-10 h-10' />

            {/* Main Text */}
            <h3 className="text-sm font-semibold text-slate-700 text-center">
                Choose a file or drag & drop it here
            </h3>

            {/* Sub Text */}
            <p className="mt-1.5 text-xs text-slate-400 text-center">
                PDF, TXT and DOCX formats, up to 5MB
            </p>

            {/* Browse Button */}
            <button
                type="button"
                onClick={handleBrowseClick}
                className="mt-5 px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors"
            >
                Browse File
            </button>

            {/* Hidden Native File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".jpeg,.jpg,.png,.pdf,.mp4"
            />
        </div>
    );
}