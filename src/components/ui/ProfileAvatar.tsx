import { useState } from 'react';
import { LetterAvatar } from './LetterAvatar';

interface ProfileAvatarProps {
  profileImage?: string | null;
  name: string;
  size?: string;
  className?: string;
  showHoverEffect?: boolean;
}

export const ProfileAvatar = ({ 
  profileImage, 
  name, 
  size = 'w-10 h-10', 
  className = '',
  showHoverEffect = true
}: ProfileAvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Se não há imagem ou houve erro, usar LetterAvatar
  if (!profileImage || imageError) {
    return (
      <LetterAvatar 
        name={name} 
        size={size} 
        className={className}
      />
    );
  }

  // Usar imagem de perfil
  const hoverClass = showHoverEffect ? 'transition-transform hover:scale-105 duration-200' : '';
  
  return (
    <img
      src={profileImage}
      alt={`Foto de ${name}`}
      className={`${size} rounded-full object-cover shadow ${hoverClass} ${className}`}
      onError={handleImageError}
    />
  );
};
