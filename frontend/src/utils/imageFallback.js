/**
 * Standard high quality fallback travel photography
 */
export const FALLBACK_IMAGES = {
  destination: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  place: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  package: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  room: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
};

export const getFallbackImage = (type = 'destination') => {
  return FALLBACK_IMAGES[type] || FALLBACK_IMAGES.destination;
};

export const handleImageError = (e, type = 'destination') => {
  if (e.target.src !== FALLBACK_IMAGES[type]) {
    e.target.src = getFallbackImage(type);
  }
};
