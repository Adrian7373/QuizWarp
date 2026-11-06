"use client"

import { useState, useRef } from 'react';
import { Camera, Check, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadZoneProps {
    image: File | null,
    handleUploadImage: (file: File) => void
    handleRemoveImage: () => void
    /** 'legacy' keeps the original look for screens not yet on the arcade system. */
    variant?: 'legacy' | 'arcade'
}

export default function ImageUploadZone({ image, handleUploadImage, handleRemoveImage, variant = 'legacy' }: ImageUploadZoneProps) {
    const arcade = variant === 'arcade';
    const [isDragging, setIsDragging] = useState(false);

    const galleryInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

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
            const file = e.dataTransfer.files[0];
            // Only accept the drop if it's actually an image
            if (file.type.startsWith('image/')) {
                handleUploadImage(file);
            }
        }
    };

    const handleGalleryClick = () => {
        galleryInputRef.current?.click();
    };

    const handleCameraClick = () => {
        cameraInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploadImage(e.target.files[0]);
        }
    };

    const clearImage = () => {
        handleRemoveImage();
        if (galleryInputRef.current) galleryInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    // Success UI: Shown when an image is successfully selected
        if (image && arcade) {
        return (
            <div className="px-notch flex h-44 w-full flex-col items-center justify-center gap-3 border-4 border-frame-strong bg-screen p-4">
                <ImageIcon className="size-8 text-muted" aria-hidden />
                <div className="flex max-w-full items-center gap-2">
                    <Check className="size-5 shrink-0 text-px-lime" strokeWidth={3} aria-hidden />
                    <span className="truncate text-lg">{image.name}</span>
                </div>
                <button type="button" onClick={clearImage} className="px-btn px-btn-sm px-btn-ghost">
                    <X className="size-4" aria-hidden /> Remove
                </button>
            </div>
        );
    }

    if (image) {
        return (
            <div className="flex items-center justify-between w-full p-4 border rounded-t-xl bg-slate-50 border-slate-200">
                <div className="flex items-center gap-3 overflow-hidden max-w-54">
                    {/* Image/Photo Icon */}
                    <div className="flex-shrink-0 p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-brand">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </div>

                    {/* File Name */}
                    <span className="text-sm font-medium text-slate-700 truncate">
                        {image.name}
                    </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {/* Checkmark Icon */}
                    <svg className="text-green-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>

                    {/* Remove Button (X) */}
                    <button
                        onClick={clearImage}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remove image"
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

    // Default UI: The Dropzone with Two Buttons
    if (arcade) {
        return (
            <div
                className={`px-notch flex h-44 w-full flex-col items-center justify-center border-4 border-dashed px-6 text-center ${isDragging ? 'border-px-cyan bg-raised' : 'border-frame-strong bg-screen'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <Camera className="size-8 text-px-cyan" aria-hidden />
                <h3 className="mt-2 text-lg">Drop an image or take a photo</h3>
                <p className="text-sm text-muted">JPEG, PNG formats</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={handleGalleryClick} className="px-btn px-btn-sm px-btn-ghost">Choose image</button>
                    <button type="button" onClick={handleCameraClick} className="px-btn px-btn-sm px-btn-ghost"><Camera className="size-4" aria-hidden /> Take photo</button>
                </div>
                <input type="file" ref={galleryInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <input type="file" ref={cameraInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
            </div>
        );
    }

    return (
        <div
            className={`
        flex flex-col items-center justify-center w-full px-6 py-10
        border-2 border-dashed rounded-t-2xl transition-colors
        ${isDragging
                    ? 'border-brand bg-brand/5'
                    : 'border-slate-300 bg-white'
                }
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Camera Icon */}
            <div className="mb-4 text-slate-700">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                </svg>
            </div>

            <h3 className="text-sm font-semibold text-slate-700">
                Upload an image or take a photo
            </h3>

            <p className="mt-1.5 text-xs text-slate-400">
                JPEG, PNG formats
            </p>

            <div className="flex gap-3 mt-5">
                {/* Gallery Button */}
                <button
                    type="button"
                    onClick={handleGalleryClick}
                    className="px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors"
                >
                    Choose from Gallery
                </button>

                {/* Camera Button */}
                <button
                    type="button"
                    onClick={handleCameraClick}
                    className="px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors flex items-center gap-1.5"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Take Photo
                </button>
            </div>

            {/* Hidden Native File Input for Gallery */}
            <input
                type="file"
                ref={galleryInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />

            {/* Hidden Native File Input for Camera (capture="environment" targets mobile rear camera) */}
            <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                capture="environment"
            />
        </div>
    );
}