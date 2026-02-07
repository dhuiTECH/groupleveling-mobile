import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import { SKILL_DATA, normalizeClassKey, SkillNode } from '@/utils/skillTreeData';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useSkills } from '@/hooks/useSkills';
import { useSkillTreeData, DbSkill } from '@/hooks/useSkillTreeData';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const NODE_SIZE = 48;
const TREE_HEIGHT = 800;

/** Map a DB skill row to SkillNode for rendering and unlock/upgrade logic. */
function dbSkillToNode(row: DbSkill): SkillNode {
  const typeRaw = String(row.skill_type ?? 'active').toLowerCase();
  return {
    id: row.id,
    name: row.name ?? row.id,
    type: typeRaw === 'passive' ? 'passive' : 'active',
    x: Number(row.x_pos ?? 50),
    y: Number(row.y_pos ?? 0),
    maxRank: Number(row.max_rank ?? 1),
    requiredLevel: Number(row.required_level ?? 1),
    requiredTitle: String(row.required_title ?? 'Novice'),
    cooldown: Number(row.cooldown_ms ?? 0),
    connectedTo:
      row.required_skill_id != null && row.required_skill_id !== ''
        ? [row.required_skill_id]
        : undefined,
    getDescription: () => String(row.description_template ?? ''),
  };
}

export const SkillTreeTab = () => {
  const { user } = useAuth();
  const {
    loadout,
    unlockedSkills,
    unlockSkill,
    upgradeSkill,
    updateLoadout,
    loading: loadingSkills,
  } = useSkills();
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);

  const userClass = useMemo(
    () => normalizeClassKey(user?.current_class || 'Fighter'),
    [user?.current_class]
  );

  const { skills: dbSkills, loading: loadingTree } = useSkillTreeData(userClass);

  // Use layout from Supabase (useSkillTreeData); fallback to static SKILL_DATA only when DB returns empty
  const skills = useMemo(() => {
    if (dbSkills.length > 0) {
      return dbSkills.map(dbSkillToNode).sort((a, b) => a.y - b.y || a.x - b.x);
    }
    return SKILL_DATA[userClass] || [];
  }, [dbSkills, userClass]);
  const loading = loadingSkills || loadingTree;

  const getUserSkill = (skillId: string) =>
    unlockedSkills.find((s) => s.skill_id === skillId);
  const isSkillUnlocked = (skillId: string) => !!getUserSkill(skillId);
  const isSkillEquipped = (skillId: string) => loadout.includes(skillId);

  const canUnlockSkill = (skill: SkillNode) => {
    if (isSkillUnlocked(skill.id)) return false;
    if ((user?.level || 0) < skill.requiredLevel) return false;
    if (skill.connectedTo?.length) {
      return skill.connectedTo.every((parentId) => isSkillUnlocked(parentId));
    }
    return true;
  };

  const pointsSpent = unlockedSkills.length;
  const availableSP = (user?.level ?? 1) - pointsSpent;

  const getPos = (skill: SkillNode) => ({
    left: (skill.x / 100) * width,
    top: (skill.y / 100) * TREE_HEIGHT,
  });

  const renderConnections = () => {
    return skills.map((skill) => {
      if (!skill.connectedTo) return null;
      return skill.connectedTo.map((parentId) => {
        const parent = skills.find((s) => s.id === parentId);
        if (!parent) return null;
        const start = getPos(parent);
        const end = getPos(skill);
        const bothUnlocked =
          isSkillUnlocked(parentId) && isSkillUnlocked(skill.id);
        return (
          <Line
            key={`${parent.id}-${skill.id}`}
            x1={start.left}
            y1={start.top}
            x2={end.left}
            y2={end.top}
            stroke={bothUnlocked ? theme.colors.cyan : theme.colors.gray}
            strokeWidth="2"
            strokeOpacity={bothUnlocked ? '0.9' : '0.5'}
          />
        );
      });
    });
  };

  const handleLearn = async () => {
    if (!selectedSkill) return;
    if (availableSP < 1) {
      Alert.alert('Not enough SP', 'You need 1 Skill Point to learn this.');
      return;
    }
    if (!canUnlockSkill(selectedSkill)) {
      Alert.alert(
        'Requirements Not Met',
        'Check level or prerequisite skills.'
      );
      return;
    }
    const res = await unlockSkill(selectedSkill.id);
    if (res?.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Error', 'Failed to unlock skill.');
    }
  };

  const handleUpgrade = async () => {
    if (!selectedSkill) return;
    const userSkill = getUserSkill(selectedSkill.id);
    if (userSkill && userSkill.current_rank < selectedSkill.maxRank) {
      const res = await upgradeSkill(selectedSkill.id);
      if (res?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Error', 'Failed to upgrade skill.');
      }
    }
  };

  const handleToggleEquip = () => {
    if (!selectedSkill) return;
    let newLoadout = loadout.filter((id): id is string => Boolean(id));
    if (isSkillEquipped(selectedSkill.id)) {
      newLoadout = newLoadout.filter((id) => id !== selectedSkill.id);
    } else {
      if (newLoadout.length >= 4) {
        Alert.alert('Loadout Full', 'You can only equip up to 4 skills.');
        return;
      }
      newLoadout.push(selectedSkill.id);
    }
    updateLoadout(newLoadout);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Syncing...</Text>
      </View>
    );
  }

  if (!skills.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.classTitle}>{userClass} Class</Text>
          <Text style={styles.points}>SP: {availableSP}</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tree for this class.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.classTitle}>{userClass} Class</Text>
        <Text style={styles.points}>SP: {availableSP}</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        overScrollMode="always"
      >
        <View style={styles.treeWrapper}>
          <Svg style={StyleSheet.absoluteFill} width={width} height={TREE_HEIGHT}>
            {renderConnections()}
          </Svg>
          {skills.map((skill) => {
          const pos = getPos(skill);
          const isUnlocked = isSkillUnlocked(skill.id);
          const canUnlock = canUnlockSkill(skill);
          const userSkill = getUserSkill(skill.id);
          const rank = userSkill?.current_rank ?? 0;
          return (
            <TouchableOpacity
              key={skill.id}
              style={[
                styles.node,
                {
                  left: pos.left - NODE_SIZE / 2,
                  top: pos.top - NODE_SIZE / 2,
                  borderColor: isUnlocked
                    ? theme.colors.cyan
                    : canUnlock
                    ? theme.colors.yellow
                    : theme.colors.gray,
                  backgroundColor: isUnlocked
                    ? 'rgba(6,182,212,0.2)'
                    : '#000',
                },
              ]}
              onPress={() => setSelectedSkill(skill)}
            >
              <Ionicons
                name={skill.type === 'active' ? 'flash' : 'shield'}
                size={20}
                color={
                  isUnlocked
                    ? theme.colors.cyan
                    : canUnlock
                    ? '#fff'
                    : '#555'
                }
              />
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>
                  {rank}/{skill.maxRank}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        </View>
      </ScrollView>

      {selectedSkill && (
        <View style={styles.footer}>
          <View style={styles.footerHeader}>
            <Text style={styles.skillName}>{selectedSkill.name}</Text>
            <TouchableOpacity onPress={() => setSelectedSkill(null)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.skillType}>
            {selectedSkill.type.toUpperCase()} • Req Lvl {selectedSkill.requiredLevel}
          </Text>
          <Text style={styles.description}>
            {selectedSkill.getDescription(
              getUserSkill(selectedSkill.id)?.current_rank ?? 1
            )}
          </Text>

          {!isSkillUnlocked(selectedSkill.id) ? (
            <TouchableOpacity
              style={[
                styles.learnBtn,
                (availableSP < 1 || !canUnlockSkill(selectedSkill)) &&
                  styles.learnBtnDisabled,
              ]}
              onPress={handleLearn}
              disabled={availableSP < 1 || !canUnlockSkill(selectedSkill)}
            >
              <Text style={styles.learnBtnText}>Learn (1 SP)</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.footerActions}>
              {getUserSkill(selectedSkill.id)!.current_rank <
                selectedSkill.maxRank && (
                <TouchableOpacity
                  style={styles.upgradeBtn}
                  onPress={handleUpgrade}
                >
                  <Text style={styles.upgradeBtnText}>Upgrade</Text>
                </TouchableOpacity>
              )}
              {selectedSkill.type === 'active' && (
                <TouchableOpacity
                  style={[
                    styles.equipBtn,
                    isSkillEquipped(selectedSkill.id) && styles.equipBtnActive,
                  ]}
                  onPress={handleToggleEquip}
                >
                  <Text
                    style={[
                      styles.equipBtnText,
                      isSkillEquipped(selectedSkill.id) && styles.equipBtnTextActive,
                    ]}
                  >
                    {isSkillEquipped(selectedSkill.id) ? 'Unequip' : 'Equip'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!canUnlockSkill(selectedSkill) &&
            !isSkillUnlocked(selectedSkill.id) && (
              <Text style={styles.reqHint}>
                Requires: Level {selectedSkill.requiredLevel}
                {selectedSkill.connectedTo?.length
                  ? ' • Prerequisite skills'
                  : ''}
              </Text>
            )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: theme.colors.cyan,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.gray,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#111',
  },
  classTitle: {
    color: theme.colors.cyan,
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  points: {
    color: theme.colors.yellow,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 220,
  },
  treeWrapper: {
    width,
    height: TREE_HEIGHT,
    position: 'relative',
  },
  node: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#222',
    paddingHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#444',
  },
  rankText: {
    color: '#888',
    fontSize: 8,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  skillType: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  description: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  learnBtn: {
    backgroundColor: theme.colors.cyan,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  learnBtnDisabled: {
    backgroundColor: theme.colors.gray,
    opacity: 0.6,
  },
  learnBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  upgradeBtn: {
    flex: 1,
    backgroundColor: '#4ade80',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  equipBtn: {
    flex: 1,
    backgroundColor: theme.colors.yellow,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  equipBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.yellow,
  },
  equipBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  equipBtnTextActive: {
    color: theme.colors.yellow,
  },
  reqHint: {
    marginTop: 12,
    fontSize: 11,
    color: '#ef4444',
    textAlign: 'center',
  },
});
