"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";

type ImageItem = {
  imageUrl: string;
  isCover: boolean;
  id?: string;
  order?: number;
};

type ImageGalleryProps = {
  images: ImageItem[];
  title: string;
};

function Placeholder() {
  return (
    <div className="relative h-[260px] w-full bg-gray-100 lg:h-[480px]">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mb-3"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span className="text-sm font-medium">Sin fotografías disponibles</span>
      </div>
    </div>
  );
}

function Lightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
}: {
  images: ImageItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [prevInitialIndex, setPrevInitialIndex] = useState(initialIndex);

  if (initialIndex !== prevInitialIndex) {
    setPrevInitialIndex(initialIndex);
    setCurrentIndex(initialIndex);
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") onClose();
    },
    [isOpen, goToPrevious, goToNext, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrevious();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Counter */}
      <div className="absolute right-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        aria-label="Cerrar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        aria-label="Anterior"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        aria-label="Siguiente"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Image */}
      <div className="relative h-full w-full max-w-5xl px-4 py-16">
        <Image
          src={images[currentIndex]?.imageUrl ?? ""}
          alt={`Imagen ${currentIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const sortedImages = [...images].sort((a, b) => {
    if (a.isCover && !b.isCover) return -1;
    if (!a.isCover && b.isCover) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (images.length === 0) {
    return <Placeholder />;
  }

  // Mobile: single image with view all button
  const mobileView = (
    <div className="relative h-[56vw] max-h-[420px] w-full overflow-hidden lg:hidden">
      <Image
        src={sortedImages[0].imageUrl}
        alt={title}
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      {images.length > 1 && (
        <button
          onClick={() => openLightbox(0)}
          className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-md transition hover:bg-gray-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          Ver fotos ({images.length})
        </button>
      )}
    </div>
  );

  // Desktop layouts
  const renderDesktopGallery = () => {
    // 1 image
    if (sortedImages.length === 1) {
      return (
        <div className="hidden h-[480px] w-full overflow-hidden lg:block">
          <Image
            src={sortedImages[0].imageUrl}
            alt={title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
      );
    }

    // 2 images - 60% left, 40% right
    if (sortedImages.length === 2) {
      return (
        <div className="hidden h-[480px] w-full gap-1 overflow-hidden lg:grid lg:grid-cols-[60%_40%]">
          <button
            onClick={() => openLightbox(0)}
            className="relative h-full w-full overflow-hidden"
          >
            <Image
              src={sortedImages[0].imageUrl}
              alt={`${title} - 1`}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition hover:scale-105"
            />
          </button>
          <button
            onClick={() => openLightbox(1)}
            className="relative h-full w-full overflow-hidden"
          >
            <Image
              src={sortedImages[1].imageUrl}
              alt={`${title} - 2`}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover transition hover:scale-105"
            />
          </button>
        </div>
      );
    }

    // 3+ images - Airbnb style grid
    const hasMoreThan5 = sortedImages.length > 5;
    const displayImages = sortedImages.slice(0, 5);

    return (
      <div className="hidden h-[480px] w-full gap-1 overflow-hidden rounded-xl lg:grid lg:grid-cols-2">
        {/* Main large image - left side */}
        <button
          onClick={() => openLightbox(0)}
          className="relative h-full w-full overflow-hidden"
        >
          <Image
            src={displayImages[0].imageUrl}
            alt={`${title} - principal`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition duration-300 hover:scale-105"
          />
        </button>

        {/* Right side - 2x2 grid */}
        <div className="grid h-full grid-cols-2 grid-rows-2 gap-1">
          {displayImages.slice(1, 4).map((image, index) => (
            <button
              key={image.imageUrl || index}
              onClick={() => openLightbox(index + 1)}
              className="relative h-full w-full overflow-hidden"
            >
              <Image
                src={image.imageUrl}
                alt={`${title} - ${index + 2}`}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-300 hover:scale-105"
              />
            </button>
          ))}
          {/* Last cell - 4th image or view all button */}
          {displayImages.length >= 5 ? (
            <button
              onClick={() => openLightbox(4)}
              className="relative h-full w-full overflow-hidden"
            >
              <Image
                src={displayImages[4].imageUrl}
                alt={`${title} - 5`}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-300 hover:scale-105"
              />
              {hasMoreThan5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/90 px-4 py-2 text-sm font-medium text-gray-900">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Ver todas las fotos
                  </span>
                </div>
              )}
            </button>
          ) : (
            // If less than 5 images, fill with placeholder or show view all if applicable
            <div className="relative h-full w-full bg-gray-100">
              {hasMoreThan5 && (
                <button
                  onClick={() => openLightbox(0)}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-md">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Ver todas las fotos
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {mobileView}
      {renderDesktopGallery()}
      <Lightbox
        images={sortedImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
