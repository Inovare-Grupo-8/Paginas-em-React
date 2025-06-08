import { useLetterAvatar } from "@/hooks/useLetterAvatar";

interface LetterAvatarProps {
  name: string;
  size?: string;
  className?: string;
}

export const LetterAvatar = ({ name, size = 'w-10 h-10', className = '' }: LetterAvatarProps) => {
  const { getColorFromName, getFirstLetter, getTextSize } = useLetterAvatar();
  
  const firstLetter = getFirstLetter(name);
  const colorClass = getColorFromName(name);
  const textSize = getTextSize(size);
  
  return (
    <div 
      className={`${size} rounded-full flex items-center justify-center ${colorClass} font-bold ${textSize} select-none shadow transition-transform hover:scale-105 duration-200 ${className}`}
    >
      {firstLetter}
    </div>
  );
};
