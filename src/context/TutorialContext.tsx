import React, { createContext, useContext, useState, useEffect } from 'react';
import { LayoutRectangle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { navigationRef } from '@/navigation/navigationRef';

export type TutorialStep = 
  | 'IDLE'            
  | 'INTRO_HOME'      
  | 'TRAINING_CARD'   
  | 'TRAINING_LOG_MODAL'
  | 'NAV_SHOP'        
  | 'NAV_INVENTORY'   
  | 'NAV_STATS'
  | 'NAV_SOCIAL'
  | 'NAV_MAP'         
  | 'COMPLETED';

interface TutorialContextType {
  step: TutorialStep;
  nextStep: () => void;
  setStep: (step: TutorialStep) => void;
  targetRef: (node: any) => void; 
  position: LayoutRectangle | null;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const TutorialProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<TutorialStep>('IDLE');
  const [position, setPosition] = useState<LayoutRectangle | null>(null);

  useEffect(() => {
    // Reset state when user changes (e.g. logout/login)
    setStep('IDLE');
    setPosition(null);
  }, [user?.id]);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      // Check for user existence and onboarding completion
      if (user?.onboarding_completed && user?.id) {
        const key = `tutorial_completed_v1_${user.id}`;
        try {
          const hasSeen = await AsyncStorage.getItem(key);
          
          // Debugging log
          console.log(`[Tutorial] User: ${user.id}, Completed: ${user.onboarding_completed}, Seen: ${hasSeen}`);

          if (!hasSeen && step === 'IDLE') {
            console.log('[Tutorial] Starting intro sequence...');
            // Add a small delay to ensure we are on the Home screen
            setTimeout(() => {
              setStep('INTRO_HOME');
            }, 1000);
          }
        } catch (err) {
          console.error('[Tutorial] Storage Error:', err);
        }
      }
    };
    checkTutorialStatus();
  }, [user?.onboarding_completed, user?.id, step]);

  // Auto-Navigator logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (navigationRef.isReady()) {
        // INTRO_HOME and TRAINING_CARD are on 'System' (Home) tab
        // We need to navigate to 'Home' stack first, then the specific tab
        if (step === 'INTRO_HOME') {
          navigationRef.navigate('Home', { screen: 'System' } as never);
        }
        if (step === 'TRAINING_CARD') {
          navigationRef.navigate('Home', { screen: 'System' } as never);
        }
        
        // Auto-switch tabs based on step
        if (step === 'NAV_SHOP') {
          navigationRef.navigate('Home', { screen: 'Shop' } as never);
        }
        if (step === 'NAV_INVENTORY' || step === 'NAV_STATS') {
          navigationRef.navigate('Home', { screen: 'Hunter' } as never); // 'Hunter' is Inventory screen
        }
        if (step === 'NAV_SOCIAL') {
          navigationRef.navigate('Home', { screen: 'Social' } as never);
        }
        if (step === 'NAV_MAP') {
          // WorldMap is in the Tab Navigator (Home -> WorldMap) AND in the Stack (WorldMap)
          // Prefer navigating to the Stack version if available, or Tab
          navigationRef.navigate('WorldMap' as never); 
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [step]);

  const targetRef = (node: any) => {
    if (node) {
      // 300ms delay ensures the UI is fully laid out/transitioned before measuring
      setTimeout(() => {
        node.measure((fx: number, fy: number, w: number, h: number, px: number, py: number) => {
          setPosition({ x: px, y: py, width: w, height: h });
        });
      }, 300);
    }
  };

  const nextStep = () => {
    setPosition(null); // Clear highlight during transition
    
    if (step === 'INTRO_HOME') setStep('TRAINING_CARD');
    else if (step === 'TRAINING_CARD') setStep('TRAINING_LOG_MODAL');
    else if (step === 'TRAINING_LOG_MODAL') setStep('NAV_SHOP');
    else if (step === 'NAV_SHOP') setStep('NAV_INVENTORY');
    else if (step === 'NAV_INVENTORY') setStep('NAV_STATS');
    else if (step === 'NAV_STATS') setStep('NAV_SOCIAL');
    else if (step === 'NAV_SOCIAL') setStep('NAV_MAP');
    else if (step === 'NAV_MAP') {
      setStep('COMPLETED');
      if (user?.id) {
        AsyncStorage.setItem(`tutorial_completed_v1_${user.id}`, 'true');
      }
    }
  };

  return (
    <TutorialContext.Provider value={{ step, nextStep, setStep, targetRef, position }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) throw new Error("useTutorial must be used within a TutorialProvider");
  return context;
};
