import { createContext, useState, ReactNode } from "react";

interface ProfileImageContextType {
  profileImage: string;
  setProfileImage: (img: string) => void;
}

const ProfileImageContext = createContext<ProfileImageContextType | undefined>(undefined);

export const ProfileImageProvider = ({ children }: { children: ReactNode }) => {
  const [profileImage, setProfileImage] = useState<string>(() => {
    const savedData = localStorage.getItem("profileData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      return parsed.profileImage || "";
    }
    return "";
  });

  return (
    <ProfileImageContext.Provider value={{ profileImage, setProfileImage }}>
      {children}
    </ProfileImageContext.Provider>
  );
};

export { ProfileImageContext };
