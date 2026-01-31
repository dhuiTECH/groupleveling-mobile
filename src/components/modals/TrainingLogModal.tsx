import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Copy, Trash2, Plus, Star } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

// This is a large component, so I'm including placeholder components and styles.
// The full implementation will follow in the subsequent steps.

const DeployMissionForm = ({ onConfirm, onCancel, exercise }) => {
  const [name, setName] = useState(exercise?.name || '');
  const [sets, setSets] = useState(exercise?.sets || [{ weight: '', reps: '' }]);

  const handleAddSet = () => {
    setSets([...sets, { weight: '', reps: '' }]);
  };

  const handleRemoveSet = (index) => {
    const newSets = [...sets];
    newSets.splice(index, 1);
    setSets(newSets);
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Deploy Mission</Text>
      <TextInput
        style={styles.input}
        placeholder="Exercise Name"
        value={name}
        onChangeText={setName}
      />
      <ScrollView style={{ maxHeight: 200 }}>
        {sets.map((set, index) => (
          <View key={index} style={styles.setRow}>
            <TextInput
              style={styles.setInput}
              placeholder="Weight"
              keyboardType="numeric"
              value={set.weight}
              onChangeText={(text) => {
                const newSets = [...sets];
                newSets[index].weight = text;
                setSets(newSets);
              }}
            />
            <TextInput
              style={styles.setInput}
              placeholder="Reps"
              keyboardType="numeric"
              value={set.reps}
              onChangeText={(text) => {
                const newSets = [...sets];
                newSets[index].reps = text;
                setSets(newSets);
              }}
            />
            <TouchableOpacity onPress={() => handleRemoveSet(index)}>
              <Trash2 size={16} color="red" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={handleAddSet} style={styles.addButton}>
        <Plus size={16} color="white" />
        <Text style={{ color: 'white' }}>Add Set</Text>
      </TouchableOpacity>
      <View style={styles.formButtons}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={{ color: 'white' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onConfirm({ name, sets })} style={styles.confirmButton}>
          <Text style={{ color: 'white' }}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const AddFoodForm = ({ onConfirm, onCancel }) => {
  const [itemName, setItemName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Add Food Entry</Text>
      <TextInput
        style={styles.input}
        placeholder="Item Name"
        value={itemName}
        onChangeText={setItemName}
      />
      <TextInput
        style={styles.input}
        placeholder="Calories"
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
      />
      <TextInput
        style={styles.input}
        placeholder="Protein"
        keyboardType="numeric"
        value={protein}
        onChangeText={setProtein}
      />
      <TextInput
        style={styles.input}
        placeholder="Carbs"
        keyboardType="numeric"
        value={carbs}
        onChangeText={setCarbs}
      />
      <TextInput
        style={styles.input}
        placeholder="Fats"
        keyboardType="numeric"
        value={fats}
        onChangeText={setFats}
      />
      <View style={styles.formButtons}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={{ color: 'white' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onConfirm({ itemName, calories, protein, carbs, fats })} style={styles.confirmButton}>
          <Text style={{ color: 'white' }}>Log Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const WeeklyFeedbackModal = ({ onSubmit, onCancel }) => {
  const [rating, setRating] = useState(null);
  const emojis = ['😞', '😐', '😊', '😁', '🔥'];

  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <BlurView intensity={30} style={styles.backdrop}>
        <View style={styles.feedbackModalContent}>
          <HologramPet />
          <Text style={styles.feedbackTitle}>Weekly Performance Review</Text>
          <Text style={styles.feedbackSubtitle}>How did you feel about your training this week?</Text>
          <View style={styles.emojiContainer}>
            {emojis.map((emoji, index) => (
              <TouchableOpacity key={index} onPress={() => setRating(index)}>
                <Text style={[styles.emoji, rating === index && styles.selectedEmoji]}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => onSubmit(rating)} style={styles.submitButton}>
            <Text style={{ color: 'white' }}>Submit</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
};
const ExerciseItem = ({ exercise, onUpdate, onDelete, onEdit }) => {
  return (
    <View style={styles.exerciseItem}>
      <TouchableOpacity onPress={() => onUpdate({ ...exercise, is_completed: !exercise.is_completed })}>
        <View style={[styles.checkbox, exercise.is_completed && styles.checked]}>
          {exercise.is_completed && <Check size={16} color="white" />}
        </View>
      </TouchableOpacity>
      <Text style={[styles.exerciseName, exercise.is_completed && styles.completedText]}>{exercise.name}</Text>
      <TouchableOpacity onPress={onEdit}>
        <Pencil size={16} color="#94a3b8" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete}>
        <Trash2 size={16} color="red" />
      </TouchableOpacity>
    </View>
  );
};
const HologramPet = () => {
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(withTiming(10, { duration: 2000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatAnim.value }],
    };
  });

  return (
    <Animated.View style={[styles.petContainer, animatedStyle]}>
      <Image source={require('../../../assets/system.png')} style={styles.petImage} />
    </Animated.View>
  );
};

interface TrainingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  initialTab: 'training' | 'dietary';
}

export const TrainingLogModal: React.FC<TrainingLogModalProps> = ({ isOpen, onClose, user, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showDeployMissionForm, setShowDeployMissionForm] = useState(false);
  const [showAddFoodForm, setShowAddFoodForm] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // ... other state and logic

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={30} style={styles.backdrop}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Image source={require('../../../assets/journal.png')} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>TRAINING LOG</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={16} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity onPress={() => setActiveTab('training')} style={[styles.tab, activeTab === 'training' && styles.activeTab]}>
              <Text style={styles.tabText}>TRAINING</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('dietary')} style={[styles.tab, activeTab === 'dietary' && styles.activeTab]}>
              <Text style={styles.tabText}>DIET LOG</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'training' && (
            <ScrollView>
              {/* Render ExerciseItems here */}
              <TouchableOpacity onPress={() => setShowDeployMissionForm(true)} style={styles.addButton}>
                <Plus size={16} color="white" />
                <Text style={{ color: 'white' }}>Add Exercise</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {activeTab === 'dietary' && (
            <ScrollView>
              {/* Render Food logs here */}
              <TouchableOpacity onPress={() => setShowAddFoodForm(true)} style={styles.addButton}>
                <Plus size={16} color="white" />
                <Text style={{ color: 'white' }}>Add Food</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {showDeployMissionForm && <DeployMissionForm onCancel={() => setShowDeployMissionForm(false)} onConfirm={() => {}} />}
          {showAddFoodForm && <AddFoodForm onCancel={() => setShowAddFoodForm(false)} onConfirm={() => {}} />}
          {showFeedbackModal && <WeeklyFeedbackModal onCancel={() => setShowFeedbackModal(false)} onSubmit={() => {}} />}

          {/* Rest Timer */}
          <View style={styles.footer}>
            {/* ... rest timer implementation */}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
  },
  modalContent: {
    width: '95%',
    maxWidth: 600,
    height: '90%',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    marginLeft: 'auto',
    padding: 8,
  },
});
