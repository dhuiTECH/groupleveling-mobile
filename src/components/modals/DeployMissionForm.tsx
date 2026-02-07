import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { X, Copy, Trash2, Plus } from 'lucide-react-native';

interface SetData {
  weight?: string;
  reps?: string;
  km?: string;
  mins?: string;
}

interface DeployMissionFormProps {
  deployPathName: string;
  initialObjectiveName?: string;
  initialSets?: SetData[];
  onCancel: () => void;
  onConfirm: (name: string, sets: SetData[]) => void;
}

export default function DeployMissionForm({ 
  deployPathName, 
  initialObjectiveName = '', 
  initialSets, 
  onCancel, 
  onConfirm 
}: DeployMissionFormProps) {
  const [name, setName] = useState(initialObjectiveName);
  const isCardio = ['RUNNING', 'CARDIO', 'CYCLING', 'SWIMMING'].includes(deployPathName) || deployPathName !== 'Strength';

  const [sets, setSets] = useState<SetData[]>(
    initialSets || (isCardio ? [{ km: '', mins: '' }] : [{ weight: '', reps: '' }])
  );

  const updateSet = (index: number, field: string, value: string) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  const addSet = () => {
    setSets([...sets, isCardio ? { km: '', mins: '' } : { weight: '', reps: '' }]);
  };

  const duplicateSet = (idx: number) => {
    const setToDuplicate = sets[idx];
    const newSets = [...sets];
    newSets.splice(idx + 1, 0, { ...setToDuplicate });
    setSets(newSets);
  };

  const removeSet = (idx: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== idx));
    }
  };

  return (
    <View className="flex-1">
      <View className="flex-row justify-between items-center mb-6 border-b border-cyan-500/30 pb-4">
        <Text className="font-black text-cyan-400 uppercase tracking-widest text-sm">MISSION NAME</Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View className="space-y-6 flex-1">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={deployPathName === 'Strength' ? "E.G. BENCH PRESS" : "E.G. CENTRAL PARK RUN"}
          placeholderTextColor="#4b5563"
          className="w-full bg-transparent border-b-2 border-cyan-500/50 text-white font-bold text-lg py-2"
          autoFocus
        />

        <View className="bg-black/40 p-4 rounded-lg border border-white/5 flex-1">
          {deployPathName === 'Strength' ? (
            <ScrollView className="flex-1 pr-1">
              <View className="flex-row gap-3 mb-2 px-2">
                <View className="w-4" />
                <Text className="flex-1 text-[10px] font-bold text-gray-500 uppercase">LBS/KG</Text>
                <Text className="flex-1 text-[10px] font-bold text-gray-500 uppercase">REPS</Text>
                <View className="w-10" />
              </View>

              {sets.map((set, idx) => (
                <View key={idx} className="flex-row gap-3 items-center bg-slate-800/30 p-2 rounded border border-white/5 mb-2">
                  <Text className="text-[10px] font-bold text-gray-500 w-4 text-center">{idx + 1}</Text>
                  
                  <TextInput
                    className="flex-1 bg-transparent border-b border-white/10 text-white font-mono text-sm py-1"
                    value={set.weight}
                    onChangeText={(val) => updateSet(idx, 'weight', val)}
                    keyboardType="numeric"
                  />
                  
                  <TextInput
                    className="flex-1 bg-transparent border-b border-white/10 text-white font-mono text-sm py-1"
                    value={set.reps}
                    onChangeText={(val) => updateSet(idx, 'reps', val)}
                    keyboardType="numeric"
                  />

                  <View className="flex-row gap-1">
                    <TouchableOpacity onPress={() => duplicateSet(idx)} className="p-1">
                      <Copy size={12} color="#9ca3af" />
                    </TouchableOpacity>
                    {sets.length > 1 && (
                      <TouchableOpacity onPress={() => removeSet(idx)} className="p-1">
                        <Trash2 size={12} color="#f87171" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              
              <TouchableOpacity 
                onPress={addSet}
                className="w-full py-3 mt-2 border border-dashed border-gray-700 rounded-lg flex-row items-center justify-center gap-1 bg-white/5"
              >
                <Plus size={12} color="#6b7280" />
                <Text className="text-[10px] font-bold text-gray-500 uppercase">Add Set</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-gray-500 uppercase mb-1">KM</Text>
                <TextInput
                  className="w-full bg-slate-800/50 border border-white/10 rounded p-2 text-cyan-400 font-mono"
                  value={sets[0].km}
                  onChangeText={(val) => updateSet(0, 'km', val)}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-gray-500 uppercase mb-1">MINS</Text>
                <TextInput
                  className="w-full bg-slate-800/50 border border-white/10 rounded p-2 text-cyan-400 font-mono"
                  value={sets[0].mins}
                  onChangeText={(val) => updateSet(0, 'mins', val)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </View>
      </View>

      <View className="mt-8 flex-row gap-3">
        <TouchableOpacity 
          onPress={onCancel}
          className="flex-1 py-3 rounded-lg border border-slate-700 items-center justify-center"
        >
          <Text className="text-gray-400 font-bold uppercase text-xs">Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => onConfirm(name, sets)}
          className="flex-[2] py-3 rounded-lg bg-cyan-600 items-center justify-center shadow-lg shadow-cyan-900/20"
        >
          <Text className="text-white font-bold uppercase text-xs">Confirm Deployment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
