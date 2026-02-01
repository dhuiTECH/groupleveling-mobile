import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Check, Plus, Flame, Utensils, Activity } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import { api as trainingApi } from '../../api/training';
import { api as nutritionApi } from '../../api/nutrition';
import { supabase } from '../../lib/supabase';

import ExerciseItem from '../ExerciseItem';
import DeployMissionForm from './DeployMissionForm';
import AddFoodForm from './AddFoodForm';
import WeeklyFeedbackModal from './WeeklyFeedbackModal';
import HologramPet from '../HologramPet';

interface TrainingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  initialTab?: 'training' | 'nutrition';
  onUpdate?: () => void; // Callback to refresh parent data
  handleClaimReward?: (type: string, size: string) => Promise<void>;
  setUser?: (user: any) => void;
}

import { useNotification } from '../../contexts/NotificationContext';

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
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  
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
        supabase.from('profiles').select('target_calories, target_protein, target_carbs, target_fats').eq('id', user.id).single(),
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

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <BlurView intensity={40} tint="dark" style={{ flex: 1 }}>
        <View className="flex-1 bg-black/90">
            {/* Header */}
            <View className="p-4 pt-12 bg-[#121214] border-b border-white/10">
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2 border border-cyan-500/30 px-3 py-1.5 rounded-lg bg-cyan-950/20">
                         {/* Would put journal icon here */}
                         <Text className="text-cyan-400 font-black uppercase tracking-widest text-xs">Hunter's Training Log</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} className="p-2 bg-slate-800 rounded-lg">
                        <X size={20} color="#22d3ee" />
                    </TouchableOpacity>
                </View>

                {/* Days Grid */}
                <View className="flex-row justify-between mb-4 bg-slate-900/50 p-2 rounded-xl border border-white/5">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                        const isCompleted = getDayCompletionStatus(day);
                        return (
                            <TouchableOpacity 
                                key={day} 
                                onPress={() => setSelectedJournalDay(day)}
                                className={`items-center justify-center w-10 h-10 rounded-lg relative ${selectedJournalDay === day ? (activeTab === 'training' ? 'bg-cyan-600' : 'bg-amber-600') : 'bg-slate-800'}`}
                            >
                                <Text className={`text-[10px] font-bold uppercase ${selectedJournalDay === day ? 'text-white' : 'text-gray-500'}`}>{day.substring(0,3)}</Text>
                                {isCompleted && (
                                    <View className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border border-black">
                                        <Check size={8} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Tabs */}
                <View className="flex-row border-b border-white/10">
                    <TouchableOpacity 
                        onPress={() => setActiveTab('training')} 
                        className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'training' ? 'border-cyan-500' : 'border-transparent'}`}
                    >
                        <Text className={`font-black uppercase tracking-widest text-xs ${activeTab === 'training' ? 'text-cyan-400' : 'text-gray-500'}`}>[ TRAINING ]</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setActiveTab('nutrition')} 
                        className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'nutrition' ? 'border-amber-500' : 'border-transparent'}`}
                    >
                        <Text className={`font-black uppercase tracking-widest text-xs ${activeTab === 'nutrition' ? 'text-amber-400' : 'text-gray-500'}`}>[ DIET LOG ]</Text>
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
                                        className="w-full py-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg flex-row items-center justify-center gap-2"
                                     >
                                         <Plus size={14} color="#22d3ee" />
                                         <Text className="text-cyan-400 font-bold uppercase text-xs">Deploy Mission</Text>
                                     </TouchableOpacity>
                                 </View>
                             );
                        })}

                        {!isInitializingCategory ? (
                            <TouchableOpacity onPress={() => setIsInitializingCategory(true)} className="mt-8 py-4 border-2 border-dashed border-cyan-900/50 rounded-xl items-center justify-center">
                                <Text className="text-cyan-700 font-black uppercase text-xs">Initialize New Path</Text>
                            </TouchableOpacity>
                        ) : (
                            <View className="mt-4 p-4 bg-black/40 border border-cyan-500/30 rounded-xl">
                                <TextInput 
                                    placeholder="PATH NAME" placeholderTextColor="#475569"
                                    className="border-b border-cyan-500/50 text-white p-2 mb-2"
                                    value={newCategoryName} onChangeText={setNewCategoryName}
                                />
                                <TextInput 
                                    placeholder="FIRST MISSION" placeholderTextColor="#475569"
                                    className="border-b border-cyan-500/50 text-white p-2 mb-4"
                                    value={firstExerciseName} onChangeText={setFirstExerciseName}
                                />
                                <View className="flex-row gap-2">
                                    <TouchableOpacity onPress={handleCreateCategory} className="flex-1 bg-cyan-600 py-2 rounded items-center"><Text className="text-white font-bold text-xs">CONFIRM</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => setIsInitializingCategory(false)} className="flex-1 bg-slate-700 py-2 rounded items-center"><Text className="text-gray-300 font-bold text-xs">CANCEL</Text></TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {!loading && activeTab === 'nutrition' && (
                    <View className="space-y-6">
                        {/* Macro Dashboard */}
                        <View className="flex-row gap-4 mb-4">
                             <View className="w-24 h-24 rounded-full border-2 border-amber-500/30 items-center justify-center bg-[#0f172a]">
                                 <Flame size={20} color="#f59e0b" />
                                 <Text className="text-2xl font-black text-amber-400">{nutritionTotals.cals}</Text>
                                 <Text className="text-[8px] text-amber-500/60 font-bold uppercase">/ {userTargets?.target_calories || 2000}</Text>
                             </View>
                             <View className="flex-1 justify-center gap-2">
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
                            className="w-full py-4 border-2 border-dashed border-amber-500/30 rounded-xl items-center justify-center flex-row gap-2"
                        >
                            <Plus size={16} color="#f59e0b" />
                            <Text className="text-amber-500 font-black uppercase text-xs">LOG NEW ENTRY</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Footer Timer */}
            <View className="bg-[#0f0f11] border-t border-white/5 p-4 pb-8">
                <View className="flex-row items-center gap-4">
                    <View className="w-16 h-16 rounded-full border-4 border-white/5 items-center justify-center relative">
                        {isRestTimerActive && (
                             <Activity size={24} color="#22d3ee" className="absolute opacity-20" />
                        )}
                        <Text className="text-cyan-400 font-mono font-bold">{Math.floor(restTimer/60)}:{(restTimer%60).toString().padStart(2,'0')}</Text>
                    </View>
                    <View className="flex-1">
                        <View className="flex-row justify-between mb-2">
                             <Text className="text-[10px] font-black text-gray-500 uppercase">Recovery Timer</Text>
                             {isRestTimerActive && (
                                 <TouchableOpacity onPress={() => { setIsRestTimerActive(false); setRestTimer(0); }}>
                                     <Text className="text-[10px] font-bold text-red-500 uppercase">STOP</Text>
                                 </TouchableOpacity>
                             )}
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                            {[30, 60, 90, 180, 300].map(s => (
                                <TouchableOpacity key={s} onPress={() => { setRestTimer(s); setIsRestTimerActive(true); }} className="bg-white/10 px-3 py-2 rounded">
                                    <Text className="text-white text-[10px] font-bold">{s}s</Text>
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
