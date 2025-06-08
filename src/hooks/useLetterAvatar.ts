// Hook para gerar LetterAvatar reutilizável
export const useLetterAvatar = () => {
  // Função para gerar uma cor com base no nome
  const getColorFromName = (name: string): string => {
    const colors = [
      'bg-blue-200 text-blue-800',
      'bg-green-200 text-green-800',
      'bg-purple-200 text-purple-800',
      'bg-pink-200 text-pink-800',
      'bg-yellow-200 text-yellow-800',
      'bg-indigo-200 text-indigo-800',
      'bg-red-200 text-red-800',
      'bg-teal-200 text-teal-800'
    ];
    
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Função para obter a primeira letra do nome
  const getFirstLetter = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  // Função para obter o tamanho do texto baseado no tamanho do container
  const getTextSize = (containerSize: string): string => {
    return containerSize.includes('w-40') ? 'text-6xl' :
           containerSize.includes('w-16') ? 'text-4xl' : 
           containerSize.includes('w-10') ? 'text-2xl' : 
           containerSize.includes('w-8') ? 'text-xl' : 'text-2xl';
  };

  return {
    getColorFromName,
    getFirstLetter,
    getTextSize
  };
};
