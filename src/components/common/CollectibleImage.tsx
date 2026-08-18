import React, { useState } from 'react';
import { getCategoryMeta } from '../../utils/categoryUtils';
import {
  Sparkles,
  RotateCw,
  Anchor,
  Flame,
  Gamepad2,
  Box,
  Layers,
  Shield,
  Clock,
  Tag,
  Gem,
  Award,
} from 'lucide-react';

interface CollectibleImageProps {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
  containerClassName?: string;
  iconClassName?: string;
  showBadge?: boolean;
}

export const CollectibleImage: React.FC<CollectibleImageProps> = ({
  src,
  alt,
  category = 'custom',
  className = 'w-full h-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-105',
  containerClassName = 'w-full h-full flex items-center justify-center relative',
  iconClassName = 'w-10 h-10',
  showBadge = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Check if image is an unrelated unsplash stock placeholder or empty
  const isUnsplashPlaceholder = src && src.includes('images.unsplash.com');
  const isValidUrl = src && src.trim().length > 0 && !isUnsplashPlaceholder && !hasError;

  const meta = getCategoryMeta(category);

  // Render appropriate icon based on category meta or hobby
  const renderCategoryIcon = () => {
    const iconName = meta?.iconName || 'Box';
    const catLower = (category || '').toLowerCase();

    if (iconName === 'RotateCw' || catLower.includes('beyblade')) {
      return <RotateCw className={iconClassName} />;
    }
    if (iconName === 'Sparkles' || catLower.includes('pokemon') || catLower.includes('lorcana') || catLower.includes('yugioh')) {
      return <Sparkles className={iconClassName} />;
    }
    if (iconName === 'Anchor' || catLower.includes('onepiece')) {
      return <Anchor className={iconClassName} />;
    }
    if (iconName === 'Flame' || catLower.includes('mtg') || catLower.includes('magic')) {
      return <Flame className={iconClassName} />;
    }
    if (iconName === 'Gamepad2' || catLower.includes('game') || catLower.includes('console')) {
      return <Gamepad2 className={iconClassName} />;
    }
    if (iconName === 'Layers' || catLower.includes('card') || catLower.includes('sport')) {
      return <Layers className={iconClassName} />;
    }
    if (iconName === 'Clock' || catLower.includes('watch')) {
      return <Clock className={iconClassName} />;
    }
    if (iconName === 'Shield' || catLower.includes('warhammer')) {
      return <Shield className={iconClassName} />;
    }
    if (catLower.includes('art') || catLower.includes('coin') || catLower.includes('bullion')) {
      return <Gem className={iconClassName} />;
    }
    return <Box className={iconClassName} />;
  };

  const themeColor = meta?.defaultColor || '#007AFF';

  if (!isValidUrl) {
    return (
      <div
        className={`${containerClassName} select-none overflow-hidden`}
        style={{
          background: `radial-gradient(circle at 50% 40%, ${themeColor}12 0%, #F2F2F7 100%)`,
        }}
      >
        <div className="flex flex-col items-center justify-center text-center p-3 gap-2">
          <div
            className="p-3.5 rounded-2xl shadow-2xs border border-black/[0.06] transition-transform group-hover:scale-110 duration-200"
            style={{
              backgroundColor: '#FFFFFF',
              color: themeColor,
            }}
          >
            {renderCategoryIcon()}
          </div>
          {showBadge && (
            <div className="flex flex-col items-center gap-0.5 max-w-[85%]">
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border uppercase"
                style={{
                  backgroundColor: `${themeColor}15`,
                  color: themeColor,
                  borderColor: `${themeColor}30`,
                }}
              >
                {meta?.label || category}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
      />
    </div>
  );
};
