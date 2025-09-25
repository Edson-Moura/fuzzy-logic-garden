import React, { createContext, useContext, useState, useCallback } from 'react';
import { Badge } from '@/hooks/useAchievements';

interface CelebrationContextType {
  celebratedBadges: Set<string>;
  markAsShown: (badgeIds: string[]) => void;
  shouldShowCelebration: (badges: Badge[]) => boolean;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export const CelebrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [celebratedBadges, setCelebratedBadges] = useState<Set<string>>(new Set());

  const markAsShown = useCallback((badgeIds: string[]) => {
    setCelebratedBadges(prev => {
      const newSet = new Set(prev);
      badgeIds.forEach(id => newSet.add(id));
      return newSet;
    });
  }, []);

  const shouldShowCelebration = useCallback((badges: Badge[]) => {
    return badges.some(badge => !celebratedBadges.has(badge.id));
  }, [celebratedBadges]);

  return (
    <CelebrationContext.Provider value={{ celebratedBadges, markAsShown, shouldShowCelebration }}>
      {children}
    </CelebrationContext.Provider>
  );
};

export const useCelebrationContext = () => {
  const context = useContext(CelebrationContext);
  if (context === undefined) {
    throw new Error('useCelebrationContext must be used within a CelebrationProvider');
  }
  return context;
};