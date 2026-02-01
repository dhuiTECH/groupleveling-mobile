import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { X } from 'lucide-react-native';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onHide: () => void;
  duration?: number;
}

const Notification = ({ message, type, onHide, duration = 3000 }: NotificationProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onHide();
    }, duration);

    return () => clearTimeout(timer);
  }, [onHide, duration]);

  const bgColor = type === 'success' ? 'bg-cyan-900/90' : 'bg-red-950/90';
  const borderColor = type === 'success' ? 'border-cyan-500/50' : 'border-red-500/50';
  const dotColor = type === 'success' ? 'bg-cyan-400' : 'bg-red-400';
  const textColor = type === 'success' ? 'text-cyan-100' : 'text-red-100';
  const labelText = type === 'success' ? 'SYSTEM UPDATE' : 'SYSTEM ERROR';
  const labelTextColor = type === 'success' ? 'text-cyan-400' : 'text-red-400';

  return (
    <Modal
      transparent
      visible={true}
      animationType="none"
      pointerEvents="box-none"
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <MotiView
          from={{ opacity: 0, translateY: -20, scale: 0.95 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          exit={{ opacity: 0, translateY: -20, scale: 0.95 }}
          transition={{ type: 'timing', duration: 300 }}
          className={`absolute top-12 right-4 z-[999] min-w-[240px] max-w-[320px] ${bgColor} border ${borderColor} p-4 rounded-xl shadow-2xl shadow-black`}
        >
          <View className="flex-row items-start gap-3">
            {/* Pulsing Dot */}
            <View className="mt-1">
              <MotiView
                from={{ opacity: 0.3, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                transition={{
                  type: 'timing',
                  duration: 1000,
                  loop: true,
                  repeatReverse: true,
                }}
                className={`w-2 h-2 rounded-full ${dotColor} shadow-sm shadow-white`}
              />
            </View>

            <View className="flex-1">
              <Text className={`font-black text-[10px] tracking-widest mb-1 ${labelTextColor}`}>
                {labelText}
              </Text>
              <Text className={`text-xs font-bold leading-relaxed ${textColor}`}>
                {message}
              </Text>
            </View>

            <TouchableOpacity onPress={onHide} className="p-1 -mr-1 -mt-1">
              <X size={14} color={type === 'success' ? '#22d3ee' : '#f87171'} />
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

export default Notification;
