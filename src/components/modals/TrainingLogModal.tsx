import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, TextInput, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import { X, Check, Plus, Flame, Utensils, Activity } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import { api as trainingApi } from '@/api/training';
import { api as nutritionApi } from '@/api/nutrition';
import { supabase } from '@/lib/supabase';

import ExerciseItem from '../ExerciseItem';
import DeployMissionForm from './DeployMissionForm';
import AddFoodForm from './AddFoodForm';
import WeeklyFeedbackModal from './WeeklyFeedbackModal';
import HologramPet from '@/components/HologramPet';

interface TrainingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  initialTab?: 'training' | 'nutrition';
  onUpdate?: () => void; // Callback to refresh parent data
  handleClaimReward?: (type: string, size: string) => Promise<void>;
  setUser?: (user: any) => void;
}

import { useNotification } from '@/contexts/NotificationContext';

export default function TrainingLogModal({ 
  isOpen, 
  onClose, 
  user, 
  initialTab = 'training',
  onUpdate,
  handleClaimReward,
  setUser
}: TrainingLogModalProps) {
  const { showNotification } = useNotification();
  // State
  const [activeTab, setActiveTab] = useState<'training' | 'nutrition'>(initialTab);
  const [selectedJournalDay, setSelectedJournalDay] = useState<string>('Monday');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [localProtocol, setLocalProtocol] = useState<any[]>([]);
  const [localNutritionLogs, setLocalNutritionLogs] = useState<any[]>([]);
  const [userTargets, setUserTargets] = useState<any>(null);
  const [rewardedPathsToday, setRewardedPathsToday] = useState<Set<string>>(new Set());

  // Modals
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployPathName, setDeployPathName] = useState<string | null>(null);
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [deployFormData, setDeployFormData] = useState<{ name: string; sets: any[] }>({ name: '', sets: [] });
  
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isInitializingCategory, setIsInitializingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [firstExerciseName, setFirstExerciseName] = useState('');

  // Timers
  const [restTimer, setRestTimer] = useState(0);
  const [restTimerInitial, setRestTimerInitial] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  
  const todayName = useMemo(() => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  }, []);

  const isTodaySelected = selectedJournalDay === todayName;

  // Sound Effect
  const playSound = async (soundFile: any) => {
    try {
      const { sound } = await Audio.Sound.createAsync(soundFile);
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };

  // --- Data Fetching ---

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [protocolRes, nutritionRes, targetsRes, rewardedRes] = await Promise.all([
        trainingApi.getTrainingProtocol(user.id),
        nutritionApi.getNutritionLogs(user.id),
        supabase.from('profiles').select('target_calories, target_protein, target_carbs, target_fats').eq('id', user.id).maybeSingle(),
        supabase.from('activities').select('type').eq('hunter_id', user.id).eq('name', 'Training Reward').gte('created_at', new Date().toISOString().split('T')[0])
      ]);

      if (protocolRes.success) setLocalProtocol(protocolRes.data || []);
      if (nutritionRes.success) setLocalNutritionLogs(nutritionRes.data || []);
      if (targetsRes.data) setUserTargets(targetsRes.data);
      if (rewardedRes.data) setRewardedPathsToday(new Set(rewardedRes.data.map(r => r.type)));

    } catch (error) {
      console.error(error);
      showNotification("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen) {
      setSelectedJournalDay(todayName);
      fetchData();
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab, todayName, fetchData]);

  // --- Weekly Reset Logic ---
  useEffect(() => {
      if (!isOpen || !user?.id) return;
      const checkReset = () => {
          const lastReset = user.last_reset ? new Date(user.last_reset) : new Date(0); 
          const now = new Date();
          const day = now.getDay() || 7; 
          const thisMonday = new Date(now);
          thisMonday.setHours(0, 0, 0, 0);
          thisMonday.setDate(now.getDate() - day + 1);
          
          if (lastReset < thisMonday) {
              setShowFeedbackModal(true);
          }
      };
      checkReset();
  }, [isOpen, user?.id, user?.last_reset]);

  const handleWeeklyReset = async (rating: number) => {
      const res = await trainingApi.resetWeeklyTraining(user.id, rating);
      if (res.success) {
          setShowFeedbackModal(false);
          if (setUser) setUser({ ...user, last_reset: new Date().toISOString() });
          fetchData();
          showNotification("SYSTEM RESET COMPLETE", "success");
      } else {
          showNotification("RESET FAILED", "error");
      }
  };

  // --- Computed ---

  const sectorsInDatabase = useMemo(() => {
    const baseSectors = ['Strength'];
    if (!localProtocol) return baseSectors;
    const dynamicSectors = Array.from(new Set(
      localProtocol
        .filter(ex => ex.day_of_week === selectedJournalDay && !['System', 'Recovery', 'Strength'].includes(ex.activity_type))
        .map(ex => ex.category || ex.activity_type)
    )).sort();
    return [...baseSectors, ...dynamicSectors];
  }, [localProtocol, selectedJournalDay]);

  const dayExercisesBySector = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    sectorsInDatabase.forEach(sector => {
      grouped[sector] = (localProtocol || []).filter(ex => ex.day_of_week === selectedJournalDay && (ex.category === sector || ex.activity_type === sector));
    });
    return grouped;
  }, [localProtocol, selectedJournalDay, sectorsInDatabase]);

  const getDayCompletionStatus = (day: string) => {
      if (activeTab === 'training') {
          const dayExercises = localProtocol.filter(ex => ex.day_of_week === day);
          const completedCategories = new Set(dayExercises.filter(ex => ex.is_completed).map(ex => ex.category || ex.activity_type)).size;
          return completedCategories >= 1;
      } else {
          return localNutritionLogs.filter(log => log.day_of_week === day).length >= 3;
      }
  };

  const nutritionTotals = useMemo(() => {
    const dayLogs = localNutritionLogs.filter(log => log.day_of_week === selectedJournalDay);
    return dayLogs.reduce((acc, curr) => ({
      cals: acc.cals + (curr.calories || 0),
      prot: acc.prot + (curr.protein || 0),
      carbs: acc.carbs + (curr.carbs || 0),
      fats: acc.fats + (curr.fats || 0)
    }), { cals: 0, prot: 0, carbs: 0, fats: 0 });
  }, [localNutritionLogs, selectedJournalDay]);

  // --- Handlers: Training ---

  const handleToggleComplete = async (missionId: string, currentStatus: boolean, category: string) => {
      if (!isTodaySelected) return showNotification("Can only complete missions today", "error");
      
      const newStatus = !currentStatus;
      
      // Optimistic update
      setLocalProtocol(prev => prev.map(ex => ex.id === missionId ? { ...ex, is_completed: newStatus } : ex));

      const res = await trainingApi.updateTrainingProtocol(missionId, { is_completed: newStatus });
      if (!res.success) {
          showNotification("Sync Failed", "error");
          fetchData(); // Revert
          return;
      }

      if (newStatus) {
          playSound(require('../../../assets/sounds/complete.mp3'));
          
          if (!rewardedPathsToday.has(category)) {
             // Logic for rewards... simplified for RN: Just claim if it's the first time
             // Check standard path completion
             let shouldReward = false;
             let xp = 0, coins = 0;

             if (category === 'Strength') {
                 const strengthCompleted = localProtocol.filter(ex => ex.category === 'Strength' && ex.day_of_week === todayName && (ex.id === missionId ? true : ex.is_completed)).length;
                 if (strengthCompleted >= 5) {
                     shouldReward = true; xp = 15; coins = 5;
                 }
             } else {
                 shouldReward = true; xp = 7; coins = 3;
             }

             if (shouldReward) {
                 const claimRes = await trainingApi.claimTrainingReward(user.id, category, xp, coins, 0, true);
                 if (claimRes.success) {
                     showNotification(`+${xp} XP | +${coins} COINS`, 'success');
                     setRewardedPathsToday(prev => new Set([...prev, category]));
                     if (setUser) setUser({ ...user, exp: claimRes.newExp, coins: claimRes.newCoins });
                 }
             }
          }
      }
  };

  const handleUpdateSet = async (id: string, idx: number, field: string, val: any) => {
      const ex = localProtocol.find(e => e.id === id);
      if (!ex) return;
      
      const newSets = [...(ex.sets_data || [])];
      if (newSets[idx]) {
          newSets[idx] = { ...newSets[idx], [field]: val };
      }

      setLocalProtocol(prev => prev.map(e => e.id === id ? { ...e, sets_data: newSets } : e));
      await trainingApi.updateTrainingProtocol(id, { sets_data: newSets });
  };

  const handleAddSet = async (id: string) => {
      const ex = localProtocol.find(e => e.id === id);
      if (!ex) return;
      const newSet = ex.category === 'Strength' ? { weight: '', reps: '' } : { km: 0, mins: 0 };
      const newSets = [...(ex.sets_data || []), newSet];
      setLocalProtocol(prev => prev.map(e => e.id === id ? { ...e, sets_data: newSets } : e));
      await trainingApi.updateTrainingProtocol(id, { sets_data: newSets });
  };

  const handleRemoveSet = async (id: string, idx: number) => {
      const ex = localProtocol.find(e => e.id === id);
      if (!ex) return;
      const newSets = ex.sets_data.filter((_: any, i: number) => i !== idx);
      setLocalProtocol(prev => prev.map(e => e.id === id ? { ...e, sets_data: newSets } : e));
      await trainingApi.updateTrainingProtocol(id, { sets_data: newSets });
  };

  const handleDuplicateSet = async (id: string, idx: number) => {
      const ex = localProtocol.find(e => e.id === id);
      if (!ex) return;
      const newSets = [...(ex.sets_data || [])];
      newSets.splice(idx + 1, 0, { ...ex.sets_data[idx], completed: false });
      setLocalProtocol(prev => prev.map(e => e.id === id ? { ...e, sets_data: newSets } : e));
      await trainingApi.updateTrainingProtocol(id, { sets_data: newSets });
  };

  const handleTerminateObjective = async (id: string) => {
      const res = await trainingApi.deleteTrainingProtocol(id);
      if (res.success) {
          setLocalProtocol(prev => prev.filter(e => e.id !== id));
          showNotification("Terminated", "success");
      }
  };

  const handleSaveMission = async (name: string, sets: any[]) => {
      if (!deployPathName) return;
      
      const payload = {
          hunter_id: user.id,
          day_of_week: selectedJournalDay,
          activity_type: deployPathName,
          category: deployPathName,
          exercise_name: name.toUpperCase(),
          sets_data: sets,
          is_completed: false
      };

      let res;
      if (editingMissionId) {
          res = await trainingApi.updateTrainingProtocol(editingMissionId, { exercise_name: name.toUpperCase(), sets_data: sets });
      } else {
          res = await trainingApi.createTrainingProtocol(payload);
      }

      if (res.success) {
          showNotification(editingMissionId ? "Mission Updated" : "Mission Deployed", "success");
          fetchData();
          setIsDeployModalOpen(false);
          setEditingMissionId(null);
      } else {
          showNotification("Failed to save", "error");
      }
  };

  const handleCreateCategory = async () => {
      if (!newCategoryName.trim() || !firstExerciseName.trim()) return showNotification("Fields required", "error");
      const payload = {
          hunter_id: user.id,
          day_of_week: selectedJournalDay,
          activity_type: newCategoryName.toUpperCase(),
          category: newCategoryName.toUpperCase(),
          exercise_name: firstExerciseName.toUpperCase(),
          sets_data: [{ weight: '', reps: '' }],
          is_completed: false
      };
      
      const res = await trainingApi.createTrainingProtocol(payload);
      if (res.success) {
          showNotification("Path Initialized", "success");
          fetchData();
          setIsInitializingCategory(false);
          setNewCategoryName(''); setFirstExerciseName('');
      }
  };

  // --- Handlers: Nutrition ---

  const handleSaveFood = async (foodData: any) => {
      const payload = Array.isArray(foodData) ? foodData.map((f: any) => ({ ...f, hunter_id: user.id, day_of_week: selectedJournalDay })) : [{ ...foodData, hunter_id: user.id, day_of_week: selectedJournalDay }];
      
      const res = await nutritionApi.createNutritionLog(payload);
      if (res.success) {
          showNotification("Nutrition Logged", "success");
          setIsFoodModalOpen(false);
          fetchData();
          
          // Check 3/3 Reward
          const todayLogs = localNutritionLogs.filter(log => log.day_of_week === todayName).length + payload.length;
          if (isTodaySelected && todayLogs >= 3 && user.last_nutrition_reward_at !== new Date().toISOString().split('T')[0]) {
             if (handleClaimReward) {
                 await handleClaimReward('special', 'small');
                 supabase.from('profiles').update({ last_nutrition_reward_at: new Date().toISOString().split('T')[0] }).eq('id', user.id);
             }
          }
      } else {
          showNotification("Failed to log", "error");
      }
  };

  const handleDeleteFood = async (id: string) => {
      const res = await nutritionApi.deleteNutritionLog(id);
      if (res.success) {
          setLocalNutritionLogs(prev => prev.filter(l => l.id !== id));
          showNotification("Entry Deleted", "success");
      }
  };

  // --- Timer ---
  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isRestTimerActive && restTimer > 0) {
          interval = setInterval(() => {
              setRestTimer(prev => {
                  if (prev <= 1) {
                      setIsRestTimerActive(false);
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isRestTimerActive, restTimer]);

  // Blue pulse animation when timer is active
  useEffect(() => {
      if (!isRestTimerActive || restTimer <= 0) {
          timerPulseAnim.setValue(1);
          return;
      }
      const pulse = Animated.loop(
          Animated.sequence([
              Animated.timing(timerPulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
              Animated.timing(timerPulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          ])
      );
      pulse.start();
      return () => pulse.stop();
  }, [isRestTimerActive, restTimer]);

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <BlurView intensity={40} tint="dark" style={{ flex: 1 }}>
        <View className="flex-1 bg-black/90">
            {/* Header */}
            <View style={styles.headerBlock}>
                <View style={styles.headerRow}>
                    <View style={styles.titleBadge}>
                        <Text style={styles.titleText}>Hunter's Training Log</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                        <X size={20} color="#22d3ee" />
                    </TouchableOpacity>
                </View>

                {/* Days Grid */}
                <View style={styles.daysRow}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                        const isCompleted = getDayCompletionStatus(day);
                        const isSelected = selectedJournalDay === day;
                        return (
                            <TouchableOpacity 
                                key={day} 
                                onPress={() => setSelectedJournalDay(day)}
                                style={[
                                    styles.dayPill,
                                    isSelected && (activeTab === 'training' ? styles.dayPillTraining : styles.dayPillNutrition),
                                    !isSelected && styles.dayPillInactive
                                ]}
                            >
                                <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]} numberOfLines={1}>{day.substring(0, 3)}</Text>
                                {isCompleted && (
                                    <View style={styles.dayCheck}>
                                        <Check size={8} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Tabs */}
                <View style={styles.tabsRow}>
                    <TouchableOpacity 
                        onPress={() => setActiveTab('training')} 
                        style={[styles.tab, activeTab === 'training' && styles.tabTraining]}
                    >
                        <Text style={[styles.tabText, activeTab === 'training' && styles.tabTextTraining]}>[ TRAINING ]</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setActiveTab('nutrition')} 
                        style={[styles.tab, activeTab === 'nutrition' && styles.tabNutrition]}
                    >
                        <Text style={[styles.tabText, activeTab === 'nutrition' && styles.tabTextNutrition]}>[ DIET LOG ]</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
                {loading && <ActivityIndicator size="large" color={activeTab === 'training' ? '#22d3ee' : '#f59e0b'} />}

                {!loading && activeTab === 'training' && (
                    <View className="space-y-6">
                        {sectorsInDatabase.map(pathName => {
                             const exercises = dayExercisesBySector[pathName] || [];
                             const isStrength = pathName === 'Strength';
                             return (
                                 <View key={pathName}>
                                     <View className="flex-row items-center gap-2 mb-3">
                                         <View className={`w-2 h-2 rounded-full ${isStrength ? 'bg-green-500' : 'bg-cyan-500'}`} />
                                         <Text className={`font-black uppercase tracking-wider text-xs ${isStrength ? 'text-green-500' : 'text-cyan-500'}`}>{pathName} PATH</Text>
                                     </View>

                                     {exercises.length === 0 ? (
                                         <View className="p-6 bg-slate-900/40 rounded-lg border border-white/5 items-center">
                                             <Text className="text-gray-600 text-xs italic">No missions deployed</Text>
                                         </View>
                                     ) : (
                                         exercises.map(ex => (
                                             <ExerciseItem 
                                                key={ex.id} exercise={ex} isToday={isTodaySelected}
                                                onTerminate={handleTerminateObjective}
                                                onEdit={(e) => {
                                                    setDeployPathName(pathName);
                                                    setEditingMissionId(e.id);
                                                    setDeployFormData({ name: e.exercise_name, sets: e.sets_data || [] });
                                                    setIsDeployModalOpen(true);
                                                }}
                                                onToggleComplete={handleToggleComplete}
                                                onUpdateSet={handleUpdateSet}
                                                onRemoveSet={handleRemoveSet}
                                                onDuplicateSet={handleDuplicateSet}
                                             />
                                         ))
                                     )}
                                     
                                     {exercises.length > 0 && (
                                         <TouchableOpacity 
                                            onPress={() => handleAddSet(exercises[exercises.length-1].id)}
                                            className="items-end mb-2"
                                         >
                                             <Text className="text-[10px] text-gray-500 font-bold uppercase">+ Add Set</Text>
                                         </TouchableOpacity>
                                     )}

                                     <TouchableOpacity 
                                        onPress={() => {
                                            setDeployPathName(pathName);
                                            setDeployFormData({ name: '', sets: isStrength ? [{weight:'', reps:''}] : [{km:'', mins:''}] });
                                            setEditingMissionId(null);
                                            setIsDeployModalOpen(true);
                                        }}
                                        style={styles.primaryButton}
                                     >
                                         <Plus size={14} color="#22d3ee" />
                                         <Text style={styles.primaryButtonText}>Deploy Mission</Text>
                                     </TouchableOpacity>
                                 </View>
                             );
                        })}

                        {!isInitializingCategory ? (
                            <TouchableOpacity onPress={() => setIsInitializingCategory(true)} style={styles.secondaryButton}>
                                <Text style={styles.secondaryButtonText}>Initialize New Path</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.initForm}>
                                <TextInput 
                                    placeholder="PATH NAME" 
                                    placeholderTextColor="#475569"
                                    style={styles.initInput}
                                    value={newCategoryName} 
                                    onChangeText={setNewCategoryName}
                                />
                                <TextInput 
                                    placeholder="FIRST MISSION" 
                                    placeholderTextColor="#475569"
                                    style={[styles.initInput, styles.initInputLast]}
                                    value={firstExerciseName} 
                                    onChangeText={setFirstExerciseName}
                                />
                                <View style={styles.initActions}>
                                    <TouchableOpacity onPress={handleCreateCategory} style={styles.confirmBtn}><Text style={styles.confirmBtnText}>CONFIRM</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => setIsInitializingCategory(false)} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>CANCEL</Text></TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {!loading && activeTab === 'nutrition' && (
                    <View className="space-y-6">
                        {/* Macro Dashboard */}
                        <View style={styles.macroRow}>
                             <View style={styles.macroCircle}>
                                 <Flame size={20} color="#f59e0b" />
                                 <Text style={styles.macroCals}>{nutritionTotals.cals}</Text>
                                 <Text style={styles.macroTarget}>/ {userTargets?.target_calories || 2000}</Text>
                             </View>
                             <View style={styles.macroBars}>
                                 {['prot', 'carbs', 'fats'].map(macro => {
                                     const val = nutritionTotals[macro as keyof typeof nutritionTotals];
                                     const target = userTargets?.[`target_${macro}`] || (macro === 'fats' ? 65 : macro === 'carbs' ? 200 : 150);
                                     const color = macro === 'prot' ? 'text-blue-400' : macro === 'carbs' ? 'text-green-400' : 'text-yellow-400';
                                     const bg = macro === 'prot' ? 'bg-blue-500' : macro === 'carbs' ? 'bg-green-500' : 'bg-yellow-500';
                                     return (
                                         <View key={macro} className="bg-slate-900 border border-white/5 rounded p-2 flex-row justify-between items-center">
                                             <Text className={`text-[10px] font-bold uppercase ${color}`}>{macro}</Text>
                                             <View className="flex-1 mx-3 h-1 bg-white/10 rounded overflow-hidden">
                                                 <View className={`h-full ${bg}`} style={{ width: `${Math.min((val/target)*100, 100)}%` }} />
                                             </View>
                                             <Text className="text-xs font-mono text-white">{val}g</Text>
                                         </View>
                                     )
                                 })}
                             </View>
                        </View>

                        {/* List */}
                        <View>
                            <View className="flex-row justify-between items-center mb-4 pl-2 border-l-2 border-amber-500">
                                <Text className="text-xs font-black text-amber-500 uppercase tracking-widest">INTAKE LOG</Text>
                                <Text className="text-[10px] text-gray-500 font-bold uppercase">{localNutritionLogs.filter(l => l.day_of_week === selectedJournalDay).length} ENTRIES</Text>
                            </View>

                            {localNutritionLogs.filter(l => l.day_of_week === selectedJournalDay).map(item => (
                                <View key={item.id} className="flex-row justify-between items-center bg-slate-900/50 p-3 rounded-lg mb-2 border border-white/5">
                                    <View>
                                        <Text className="text-white font-bold uppercase text-xs">{item.name}</Text>
                                        <Text className="text-[9px] text-gray-400 mt-1">{item.calories} CALS | P:{item.protein} C:{item.carbs} F:{item.fats}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteFood(item.id)}>
                                        <X size={14} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity 
                            onPress={() => setIsFoodModalOpen(true)}
                            style={styles.nutritionCta}
                        >
                            <Plus size={16} color="#f59e0b" />
                            <Text style={styles.nutritionCtaText}>LOG NEW ENTRY</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Footer Timer */}
            <View style={styles.footer}>
                <View style={styles.footerRow}>
                    <View style={styles.timerCircle}>
                        {(() => {
                            const size = 64;
                            const stroke = 4;
                            const r = (size - stroke) / 2;
                            const circumference = 2 * Math.PI * r;
                            const progress = restTimerInitial > 0 ? Math.max(0, restTimer / restTimerInitial) : 0;
                            const strokeDash = circumference * progress;
                            return (
                                <>
                                    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                                        <Circle
                                            cx={size / 2}
                                            cy={size / 2}
                                            r={r}
                                            stroke="rgba(255,255,255,0.08)"
                                            strokeWidth={stroke}
                                            fill="none"
                                        />
                                        {restTimerInitial > 0 && (
                                            <Circle
                                                cx={size / 2}
                                                cy={size / 2}
                                                r={r}
                                                stroke="#22d3ee"
                                                strokeWidth={stroke}
                                                fill="none"
                                                strokeDasharray={`${strokeDash} ${circumference}`}
                                                strokeLinecap="round"
                                                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                            />
                                        )}
                                    </Svg>
                                    {isRestTimerActive && (
                                        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', transform: [{ scale: timerPulseAnim }] }]}>
                                            <View style={styles.timerPulseGlow} />
                                        </Animated.View>
                                    )}
                                    <View style={styles.timerTextWrap} pointerEvents="none">
                                        <Text style={styles.timerText}>{Math.floor(restTimer/60)}:{(restTimer%60).toString().padStart(2,'0')}</Text>
                                    </View>
                                </>
                            );
                        })()}
                    </View>
                    <View style={styles.timerControls}>
                        <View style={styles.timerLabelRow}>
                            <Text style={styles.timerLabel}>Recovery Timer</Text>
                            {isRestTimerActive && (
                                <TouchableOpacity onPress={() => { setIsRestTimerActive(false); setRestTimer(0); setRestTimerInitial(0); }} hitSlop={8}>
                                    <Text style={styles.timerStop}>STOP</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timerPresets}>
                            {[30, 60, 90, 180, 300].map(s => (
                                <TouchableOpacity
                                    key={s}
                                    onPress={() => { setRestTimer(s); setRestTimerInitial(s); setIsRestTimerActive(true); }}
                                    style={styles.timerPresetPill}
                                >
                                    <Text style={styles.timerPresetText}>{s}s</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </View>

            {/* Modals */}
            <Modal visible={isDeployModalOpen} transparent animationType="slide">
                <BlurView intensity={20} tint="dark" style={{flex:1, justifyContent:'center', padding:20}}>
                     <View className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 h-[500px]">
                         <DeployMissionForm 
                            deployPathName={deployPathName!}
                            initialObjectiveName={deployFormData.name}
                            initialSets={deployFormData.sets}
                            onCancel={() => setIsDeployModalOpen(false)}
                            onConfirm={handleSaveMission}
                         />
                     </View>
                </BlurView>
            </Modal>

            <Modal visible={isFoodModalOpen} transparent animationType="slide">
                 <BlurView intensity={20} tint="dark" style={{flex:1, justifyContent:'center', padding:20}}>
                     <View className="bg-slate-900 border border-amber-500/30 rounded-2xl h-[600px]">
                         <AddFoodForm 
                            day={selectedJournalDay}
                            user={user}
                            isToday={isTodaySelected}
                            onCancel={() => setIsFoodModalOpen(false)}
                            onConfirm={handleSaveFood}
                         />
                     </View>
                 </BlurView>
            </Modal>
            
            <WeeklyFeedbackModal 
                visible={showFeedbackModal} 
                onConfirm={handleWeeklyReset} 
            />

        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#121214',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  titleText: {
    color: '#22d3ee',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
  },
  closeBtn: {
    padding: 10,
    backgroundColor: '#334155',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(15, 23, 41, 0.5)',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 4,
  },
  dayPill: {
    flex: 1,
    minWidth: 36,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillTraining: { backgroundColor: '#0891b2' },
  dayPillNutrition: { backgroundColor: '#d97706' },
  dayPillInactive: { backgroundColor: '#334155' },
  dayPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  dayPillTextActive: { color: '#fff' },
  dayCheck: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#000',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabTraining: { borderBottomColor: '#22d3ee' },
  tabNutrition: { borderBottomColor: '#f59e0b' },
  tabText: {
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 11,
    color: '#6b7280',
  },
  tabTextTraining: { color: '#22d3ee' },
  tabTextNutrition: { color: '#f59e0b' },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#22d3ee',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  secondaryButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#0e7490',
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  initForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 14,
  },
  initInput: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.5)',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  initInputLast: { marginBottom: 16 },
  initActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#0891b2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#475569',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 12,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  macroCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  macroCals: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fbbf24',
  },
  macroTarget: {
    fontSize: 9,
    color: 'rgba(245, 158, 11, 0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  macroBars: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  nutritionCta: {
    width: '100%',
    paddingVertical: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  nutritionCtaText: {
    color: '#f59e0b',
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  footer: {
    backgroundColor: '#0f0f11',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 41, 0.6)',
    overflow: 'hidden',
  },
  timerTextWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPulseGlow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(34, 211, 238, 0.25)',
  },
  timerText: {
    color: '#22d3ee',
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    fontSize: 16,
  },
  timerControls: { flex: 1 },
  timerLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  timerStop: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
    textTransform: 'uppercase',
  },
  timerPresets: {
    flexDirection: 'row',
    gap: 8,
  },
  timerPresetPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  timerPresetText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
