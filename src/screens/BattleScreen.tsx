import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, SafeAreaView, StatusBar, ActivityIndicator, Image } from 'react-native';
import { Sword, RotateCcw, Play, ArrowUp, Skull, Hexagon, Settings } from 'lucide-react-native';
import { useBattleLogic, PHASE, ACTOR_TYPE } from '@/hooks/useBattleLogic';
import LayeredAvatar from '@/components/LayeredAvatar';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const INITIAL_ENEMY_HP = 8000; // Fallback

export default function BattleScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { encounterId, raidId, isBoss } = route.params || {};

  const {
    loading,
    party,
    enemy,
    currentPhase,
    stance,
    activeIndex,
    setActiveIndex,
    logs,
    turnQueue,
    queueIndex,
    chainCount,
    plannedAbilities,
    selectedAbilityId,
    enemyTargetId,
    qteTargets,
    handleQteTap,
    parryTimer,
    parryPreDelay,
    parryWindowActive,
    successFlash,
    failFlash,
    shakeAnim,
    activeChar,
    isPlayerTurnPhase,
    currentAbility,
    switchStance,
    processPlannedActions,
    undoLastAction,
    handleAbilityTap,
    resolveEnemyAttack,
    getProjectedDetail,
    basicAbility,
    lastDamageEvent,
  } = useBattleLogic({ encounterId, raidId, isBoss });

  // --- Particles System ---
  const [particles, setParticles] = useState<any[]>([]);
  const [shockwaves, setShockwaves] = useState<any[]>([]); // New Shockwave State
  const prevQteTargetsRef = useRef<any[]>([]);

  // 1. Detect Hit/Miss to spawn particles
  useEffect(() => {
      qteTargets.forEach(target => {
          const prev = prevQteTargetsRef.current.find(t => t.id === target.id);
          if (!prev) return;
          
          // Detect Status Change
          if (prev.status !== 'hit' && target.status === 'hit') {
              spawnParticles(target.x, target.y, '#22d3ee');
              spawnShockwave(target.x, target.y, '#22d3ee');
          } else if (prev.status !== 'miss' && target.status === 'miss') {
              spawnParticles(target.x, target.y, '#ef4444');
              spawnShockwave(target.x, target.y, '#ef4444');
          }
      });
      prevQteTargetsRef.current = qteTargets;
  }, [qteTargets]);

  const spawnParticles = (xPct: number, yPct: number, color: string) => {
      const x = (xPct / 100) * SCREEN_WIDTH;
      const y = (yPct / 100) * SCREEN_HEIGHT;
      const newParts = [];
      for(let i=0; i<30; i++) { // Increased count
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 15 + 5; // Faster explosion
          newParts.push({
              id: Math.random().toString(),
              x,
              y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1.0,
              color,
              size: Math.random() * 12 + 6 // Larger particles
          });
      }
      setParticles(prev => [...prev, ...newParts]);
  };

  const spawnShockwave = (xPct: number, yPct: number, color: string) => {
      const x = (xPct / 100) * SCREEN_WIDTH;
      const y = (yPct / 100) * SCREEN_HEIGHT;
      setShockwaves(prev => [...prev, {
          id: Math.random().toString(),
          x,
          y,
          scale: 0.1,
          opacity: 1.0,
          color
      }]);
  };

  // 2. Animation Loop
  useEffect(() => {
      if (particles.length === 0 && shockwaves.length === 0) return;
      
      const interval = setInterval(() => {
          // Update Particles
          setParticles(prev => {
              if (prev.length === 0) return prev;
              return prev.map(p => ({
                  ...p,
                  x: p.x + p.vx,
                  y: p.y + p.vy,
                  vx: p.vx * 0.92, 
                  vy: p.vy * 0.92,
                  life: p.life - 0.04
              })).filter(p => p.life > 0);
          });

          // Update Shockwaves
          setShockwaves(prev => {
              if (prev.length === 0) return prev;
              return prev.map(s => ({
                  ...s,
                  scale: s.scale + 0.15, // Expand fast
                  opacity: s.opacity - 0.05 // Fade
              })).filter(s => s.opacity > 0);
          });

      }, 16); 
      return () => clearInterval(interval);
  }, [particles.length > 0 || shockwaves.length > 0]);

  // Damage Number Handling
  const [damageNumbers, setDamageNumbers] = useState<any[]>([]);
  
  useEffect(() => {
    if (lastDamageEvent) {
        const id = Date.now().toString() + Math.random().toString();
        // Determine Location
        let x = SCREEN_WIDTH / 2;
        let y = 200; // Default enemy y
        let color = '#fbbf24';

        if (lastDamageEvent.targetId === 'ENEMY') {
            x = SCREEN_WIDTH / 2;
            y = 120; // Approx enemy center
            color = '#fbbf24';
        } else {
            // Find player index
            const idx = party.findIndex(p => p.id === lastDamageEvent.targetId);
            if (idx >= 0) {
                // Approximate party layout: centered row with gap=20
                // Each char figure is ~90 width (scale 0.9 of 100?)
                // This is rough estimation based on PartyContainer style
                // Just hardcode based on index for now
                const totalWidth = party.length * 100 + (party.length - 1) * 20;
                const startX = (SCREEN_WIDTH - totalWidth) / 2;
                x = startX + idx * 120 + 50; 
                y = SCREEN_HEIGHT / 2 + 100; // rough y
            }
            color = '#ef4444';
        }

        const anim = new Animated.Value(0);

        const newNum = {
            id,
            value: lastDamageEvent.value,
            color,
            x,
            y,
            anim
        };
        
        setDamageNumbers(prev => [...prev, newNum]);

        Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
        }).start(() => {
            setDamageNumbers(prev => prev.filter(n => n.id !== id));
        });
    }
  }, [lastDamageEvent]);

  if (loading) {
      return (
          <View style={[styles.container, styles.loadingCentered]}>
              <ActivityIndicator size="large" color="#22d3ee" />
              <Text style={styles.loadingText}>INITIALIZING BATTLE...</Text>
          </View>
      );
  }

  if (currentPhase === PHASE.VICTORY) {
      return (
          <View style={[styles.container, {justifyContent: 'center'}]}>
              <Text style={[styles.cinematicText, {color: '#4ade80'}]}>VICTORY</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.exitBtn}>
                  <Text style={styles.exitBtnText}>RETURN TO MAP</Text>
              </TouchableOpacity>
          </View>
      );
  }

  if (currentPhase === PHASE.DEFEAT) {
      return (
          <View style={[styles.container, {justifyContent: 'center'}]}>
              <Text style={[styles.cinematicText, {color: '#ef4444'}]}>DEFEAT</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.exitBtn}>
                  <Text style={styles.exitBtnText}>RETURN TO MAP</Text>
              </TouchableOpacity>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={{ flex: 1 }}>
        {/* Main Game Frame */}
        <Animated.View style={[styles.gameFrame, { transform: [{ translateX: shakeAnim }] }]}>
          
          {/* --- TOP HUD --- */}
          <View style={styles.topHud} pointerEvents="box-none">
              {/* Turn Queue with Pictures */}
              <View style={styles.turnQueue}>
                 {turnQueue.slice(queueIndex, queueIndex + 4).map((type: string, i: number) => {
                     const isEnemy = type === ACTOR_TYPE.ENEMY;
                     return (
                         <View key={i} style={[
                             styles.queueItem, 
                             i===0 && styles.queueItemActive,
                             isEnemy ? { borderColor: '#ef4444' } : { borderColor: '#22d3ee' }
                         ]}>
                            {isEnemy ? (
                                enemy?.icon_url ? (
                                  <Image source={{ uri: enemy.icon_url }} style={styles.queueImage} />
                                ) : (
                                  <Text style={{fontSize: 20}}>👾</Text>
                                )
                            ) : (
                                activeChar?.avatar ? (
                                  <View style={styles.queueAvatarWrapper}>
                                      <LayeredAvatar user={activeChar.avatar} size={i===0 ? 44 : 28} square hideBackground style={{ backgroundColor: 'transparent' }} />
                                  </View>
                                ) : (
                                  <Text style={{fontSize: 20}}>🥷</Text>
                                )
                            )}
                         </View>
                     );
                 })}
              </View>
          </View>

          {/* --- BATTLEFIELD --- */}
          <View style={styles.battlefield}>
              {/* Enemy Block */}
              <View style={styles.enemyBlock}>
                  {enemy && (
                      <View style={styles.enemyHpStrip}>
                          <View style={styles.enemyHpStripTop}>
                              <Text style={styles.enemyHpName} numberOfLines={1}>{enemy.name}</Text>
                              {enemy.defDebuff > 0 && <Skull size={12} color="#ef4444" />}
                          </View>
                          <View style={styles.enemyHpBarTrack}>
                              <View style={[styles.enemyHpBarFill, { width: `${Math.max(0, (enemy.hp / enemy.maxHP) * 100)}%` }]} />
                          </View>
                          <Text style={styles.enemyHpNumbers}>{Math.floor(enemy.hp).toLocaleString()} / {enemy.maxHP.toLocaleString()}</Text>
                      </View>
                  )}
                  
                  <View style={[styles.enemyFigure, currentPhase === PHASE.ENEMY_STRIKE && styles.enemyAttacking]}>
                      {enemy?.icon_url ? (
                          <Image source={{ uri: enemy.icon_url }} style={styles.enemyImage} />
                      ) : (
                          <Text style={styles.enemyEmoji}>👾</Text>
                      )}
                  </View>
              </View>

              {/* Chain Counter */}
              {chainCount > 0 && isPlayerTurnPhase && (
                  <View style={styles.chainContainer}>
                      <Text style={styles.chainText}>{chainCount} CHAIN</Text>
                      <Text style={styles.chainBonus}>+{(chainCount * 10)}% BONUS</Text>
                  </View>
              )}

              {/* Player Figures */}
              <View style={styles.partyContainer}>
                  {party.map((char: any, index: number) => {
                      const isActive = index === activeIndex;
                      const isTargeted = char.id === enemyTargetId;
                      return (
                          <TouchableOpacity 
                              key={char.id} 
                              onPress={() => { if(isPlayerTurnPhase) { setActiveIndex(index); } }}
                              style={[styles.charFigure, isActive && styles.charActive, isTargeted && styles.charTargeted]}
                          >
                              {/* Layered Avatar */}
                              {char.avatar ? (
                                  <LayeredAvatar user={char.avatar} size={130} square hideBackground style={{ backgroundColor: 'transparent' }} />
                              ) : (
                                  <Text style={{fontSize: 50}}>🥷</Text>
                              )}
                              <View style={styles.charHpContainer}>
                                  <View style={styles.charHpOnly}>
                                      <View style={[styles.charHpFill, { width: `${(char.hp / char.maxHP) * 100}%` }]} />
                                  </View>
                                  <Text style={styles.charHpText}>{Math.floor(char.hp)}/{char.maxHP}</Text>
                              </View>
                              {char.atkBuff > 0 && (
                                  <View style={styles.charBuffBadge}>
                                      <ArrowUp size={10} color="#facc15" />
                                  </View>
                              )}
                          </TouchableOpacity>
                      );
                  })}
              </View>
          </View>

          {/* --- BOTTOM HUD --- */}
          <View style={styles.bottomHud}>
              {/* AP Meter */}
              {isPlayerTurnPhase && activeChar && (
                  <View style={styles.apMeterContainer}>
                      <Text style={styles.apLabel}>ACTION POINTS</Text>
                      <View style={styles.apPips}>
                          {[...Array(activeChar.maxAP)].map((_, i) => (
                              <Hexagon 
                                  key={i} 
                                  size={18} 
                                  fill={i < activeChar.ap ? "#22d3ee" : "rgba(34, 211, 238, 0.1)"} 
                                  color={i < activeChar.ap ? "#22d3ee" : "#334155"} 
                                  strokeWidth={2}
                              />
                          ))}
                      </View>
                      <Text style={styles.apValue}>{activeChar.ap} / {activeChar.maxAP}</Text>
                  </View>
              )}

              {/* Planned Sequence */}
              {isPlayerTurnPhase && plannedAbilities.length > 0 && (
                  <View style={styles.sequenceBar}>
                      {plannedAbilities.map((item: any, i: number) => (
                          <View key={i} style={styles.sequenceItem}>
                              <Text style={styles.sequenceText}>{item.ability.name}</Text>
                          </View>
                      ))}
                  </View>
              )}

              {/* Tactical Readout */}
              <View style={styles.readout}>
                  {currentAbility ? (
                      <View>
                          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                              <Text style={styles.readoutTitle}>{currentAbility.name}</Text>
                              <Text style={styles.readoutType}>{getProjectedDetail(currentAbility)?.type}</Text>
                          </View>
                          <Text style={styles.readoutDesc}>{currentAbility.description}</Text>
                          <View style={styles.readoutFooter}>
                              <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                                  <View style={{flexDirection:'row', gap: 2}}>
                                       {[...Array(currentAbility.cost)].map((_, i) => (
                                           <Hexagon key={i} size={10} fill="#22d3ee" color="#22d3ee" />
                                       ))}
                                  </View>
                                  <Text style={styles.readoutLabel}>{getProjectedDetail(currentAbility)?.hits} Hits</Text>
                              </View>
                              <Text style={styles.readoutValue}>{getProjectedDetail(currentAbility)?.final}</Text>
                          </View>
                      </View>
                  ) : (
                      <Text style={styles.logText}>{logs[0]}</Text>
                  )}
              </View>

              {/* Controls */}
              <View style={styles.controlsRow}>
                  <TouchableOpacity onPress={switchStance} disabled={!isPlayerTurnPhase} style={[styles.ctrlBtn, { borderColor: stance.color }]}>
                      <Sword size={16} color={stance.color} />
                      <Text style={[styles.ctrlText, { color: stance.color }]}>{stance.label}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={undoLastAction} disabled={!isPlayerTurnPhase} style={[styles.ctrlBtnSmall, { borderColor: '#facc15' }]}>
                      <RotateCcw size={16} color="#facc15" />
                  </TouchableOpacity>

                  <TouchableOpacity
                      onPress={processPlannedActions}
                      disabled={!isPlayerTurnPhase || plannedAbilities.length === 0}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={[styles.ctrlBtn, { borderColor: '#4ade80' }, (plannedAbilities.length === 0) && styles.ctrlBtnDisabled]}
                  >
                      <Play size={16} color={plannedAbilities.length === 0 ? '#555' : '#4ade80'} fill={plannedAbilities.length === 0 ? '#555' : '#4ade80'} />
                      <Text style={[styles.ctrlText, { color: plannedAbilities.length === 0 ? '#555' : '#4ade80' }]}>EXECUTE</Text>
                  </TouchableOpacity>
              </View>

              {/* Ability Grid - Compact */}
              <View style={styles.abilityGrid}>
                  {(isPlayerTurnPhase && activeChar ? activeChar.abilities : []).map((ability: any) => {
                      const canAfford = activeChar.ap >= ability.cost && activeChar.hp > 0;
                      const isSelected = selectedAbilityId === ability.id;
                      return (
                          <TouchableOpacity 
                              key={ability.id} 
                              onPress={() => handleAbilityTap(ability)}
                              disabled={!canAfford}
                              style={[
                                  styles.abilityBtn, 
                                  isSelected && styles.abilityBtnSelected,
                                  !canAfford && styles.abilityBtnDisabled
                              ]}
                          >
                              {isSelected && (
                                  <View style={styles.confirmBadge}>
                                      <Text style={styles.confirmText}>CONFIRM</Text>
                                  </View>
                              )}
                              <View>
                                  <Text style={[styles.abilityName, {marginBottom: 4}]} numberOfLines={1}>{ability.name}</Text>
                                  <View style={{flexDirection:'row', gap:2}}>
                                      {[...Array(ability.cost)].map((_, i) => <Hexagon key={i} size={10} fill={isSelected ? "#22d3ee" : (canAfford ? "#22d3ee" : "#555")} color={isSelected ? "#22d3ee" : (canAfford ? "#22d3ee" : "#555")} fillOpacity={isSelected || canAfford ? 0.8 : 0.2} />)}
                                  </View>
                              </View>
                          </TouchableOpacity>
                      );
                  })}
                  {!isPlayerTurnPhase && <Text style={styles.waitingText}>ENEMY TURN...</Text>}
              </View>
          </View>

        </Animated.View>
      </SafeAreaView>

      {/* Floating Damage Numbers */}
      {damageNumbers.map(num => (
          <Animated.View 
              key={num.id}
              style={{
                  position: 'absolute',
                  top: num.y,
                  left: num.x,
                  transform: [
                      { translateY: num.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -80] }) },
                      { scale: num.anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.5, 1.5, 1] }) }
                  ],
                  opacity: num.anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
                  zIndex: 2000,
                  marginLeft: -50, // Center
                  width: 100,
                  alignItems: 'center'
              }}
              pointerEvents="none"
          >
              <Text style={{
                  color: num.color,
                  fontSize: 32,
                  fontWeight: '900',
                  textShadowColor: 'black',
                  textShadowRadius: 2,
                  textShadowOffset: { width: 1, height: 1 },
                  fontStyle: 'italic'
              }}>
                  {Math.floor(num.value)}
              </Text>
          </Animated.View>
      ))}

      {/* Shockwaves Layer */}
      {shockwaves.map(s => (
          <View 
              key={s.id}
              style={{
                  position: 'absolute',
                  left: s.x - 100, 
                  top: s.y - 100,
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  borderWidth: 10,
                  borderColor: s.color,
                  opacity: s.opacity,
                  zIndex: 1450, // Below particles
                  transform: [{ scale: s.scale }]
              }}
              pointerEvents="none"
          />
      ))}

      {/* Particles Layer */}
      {particles.map(p => (
          <View 
              key={p.id}
              style={{
                  position: 'absolute',
                  left: p.x - p.size/2,
                  top: p.y - p.size/2,
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size/2,
                  backgroundColor: p.color,
                  opacity: p.life,
                  zIndex: 1500, // Below damage numbers, above QTE
                  transform: [{ scale: p.life }]
              }}
              pointerEvents="none"
          />
      ))}

      {/* Overlays centered on device screen */}
      {successFlash && (
        <View style={[styles.flashOverlay, { backgroundColor: 'rgba(34, 211, 238, 0.3)' }]}>
           <Text style={styles.cinematicText}>PERFECT</Text>
        </View>
      )}
      {failFlash && (
        <View style={[styles.flashOverlay, { backgroundColor: 'rgba(239, 68, 68, 0.3)' }]}>
           <Text style={[styles.cinematicText, { color: '#ef4444' }]}>FAILED</Text>
        </View>
      )}

          {/* --- PARRY UI LAYER --- */}
      {currentPhase === PHASE.ENEMY_STRIKE && (
          <View style={styles.parryOverlay} pointerEvents="box-none">
              <View style={styles.parryContainer} pointerEvents="box-none">
                  <View style={{ width: '100%', height: '100%', position: 'absolute' }}>
                      {qteTargets.map((target: any, index: number) => {
                          const isActive = target.status === 'pending' || target.status === 'active';
                          const isHit = target.status === 'hit';
                          const isMiss = target.status === 'miss';
                          
                          // Calculate progress for approach circle
                          const approachProgress = parryTimer - (target.hitTime - 25);
                          
                          // Visibility checks
                          if (parryTimer < target.hitTime - 25 && isActive) return null; // Too early
                          if (parryTimer > (target.hitTime + (target.duration || 0) + 10) && isActive) return null; // Missed/Gone

                          // Approach Ring Scale
                          const scaleVal = isActive ? Math.max(1, 2.5 - (Math.max(0, approachProgress) / 25 * 1.5)) : 1;
                          
                          return (
                              <View 
                                  key={target.id}
                                  style={[
                                      styles.qteContainer, 
                                      { left: `${target.x}%`, top: `${target.y}%` }
                                  ]}
                              >
                                  {/* Approach Ring (Only for initial hit) */}
                                  {isActive && target.status !== 'active' && (
                                      <View style={[
                                          styles.qteRing, 
                                          { 
                                              transform: [{ scale: scaleVal }], 
                                              borderColor: (Math.abs(parryTimer - target.hitTime) < 8) ? '#22d3ee' : '#ef4444',
                                              opacity: Math.min(1, Math.max(0, approachProgress / 5))
                                          }
                                      ]} />
                                  )}
                                  
                                  {/* Main Button */}
                                  <TouchableOpacity
                                      activeOpacity={1}
                                      onPressIn={() => handleQteTap(target.id)}
                                      disabled={!isActive && !isHit && !isMiss} 
                                      hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
                                      style={[
                                          styles.qteBtn,
                                          isHit && { backgroundColor: '#22d3ee', borderColor: '#fff', transform: [{scale: 1.1}] },
                                          isMiss && { backgroundColor: '#ef4444', borderColor: '#fff', opacity: 0.8 },
                                          target.status === 'active' && { borderColor: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.3)' }
                                      ]}
                                  >
                                      <View style={[styles.qteInner, target.status === 'active' && { backgroundColor: '#facc15' }]}>
                                          <Text style={[styles.qteText, target.status === 'active' && { color: 'black' }]}>
                                              {isHit ? "OK" : (isMiss ? "X" : index + 1)}
                                          </Text>
                                      </View>
                                  </TouchableOpacity>
                              </View>
                          );
                      })}
                  </View>
              </View>
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  loadingCentered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#22d3ee', marginTop: 10, letterSpacing: 2 },
  gameFrame: { width: '100%', height: '100%', backgroundColor: '#050b14', position: 'relative' },
  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' },
  cinematicText: { fontSize: 48, fontStyle: 'italic', fontWeight: '900', color: 'white', textTransform: 'uppercase', textShadowColor: '#22d3ee', textShadowRadius: 20 },
  
  topHud: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: 40, zIndex: 20, position: 'absolute', width: '100%', top: 0 },
  turnQueue: { gap: 8 },
  queueItem: { width: 32, height: 32, borderWidth: 1, borderColor: '#334155', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', transform: [{skewX: '-12deg'}] },
  queueItemActive: { width: 48, height: 48, borderColor: '#22d3ee', borderWidth: 2 },
  
  queueImage: { width: '100%', height: '100%', borderRadius: 4 },
  queueAvatarWrapper: { width: '100%', height: '100%', borderRadius: 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  
  settingsBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 6, borderWidth: 1, borderColor: '#334155' },

  battlefield: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingTop: 80, paddingBottom: 24 },
  enemyBlock: { alignItems: 'center', marginTop: 4 },
  enemyFigure: { width: 130, height: 130, borderRadius: 65, borderWidth: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'transparent', marginTop: 8 },
  enemyImage: { width: 110, height: 110, borderRadius: 55 },
  enemyEmoji: { fontSize: 50 },
  enemyHpStrip: { width: 160, alignItems: 'center', marginBottom: 4 },
  enemyHpStripTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, maxWidth: '100%' },
  enemyHpName: { color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  enemyHpBarTrack: { width: '100%', height: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  enemyHpBarFill: { height: '100%', backgroundColor: '#ef4444', borderRadius: 4 },
  enemyHpNumbers: { color: 'white', fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.5, textShadowColor: 'black', textShadowRadius: 1 },
  enemyAttacking: { borderColor: '#ef4444', transform: [{scale: 1.1}] },
  chainContainer: { alignItems: 'center' },
  chainText: { color: '#22d3ee', fontSize: 32, fontStyle: 'italic', fontWeight: '900' },
  chainBonus: { color: '#22d3ee', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  
  partyContainer: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  charFigure: { alignItems: 'center', opacity: 0.9, transform: [{scale: 0.9}] },
  charActive: { opacity: 1, transform: [{scale: 1.05}] },
  charTargeted: { opacity: 1, borderColor: '#ef4444', borderWidth: 1, borderRadius: 10 },
  avatarCrispWrapper: { width: 100, height: 100, overflow: 'hidden', borderRadius: 50 },
  avatarCrispInner: { width: 200, height: 200, marginLeft: -50, marginTop: -50, transform: [{ scale: 0.5 }] },
  charHpContainer: { marginTop: 8, alignItems: 'center', width: 100 },
  charHpOnly: { width: '100%', height: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden' },
  charHpFill: { height: '100%', backgroundColor: '#22d3ee', borderRadius: 3 },
  charHpText: { color: '#22d3ee', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  charBuffBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(250,204,21,0.25)', padding: 4, borderRadius: 4 },

  parryOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
  qteContainer: { position: 'absolute', width: 120, height: 120, marginLeft: -60, marginTop: -60, alignItems: 'center', justifyContent: 'center' },
  qteBtn: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(5, 11, 20, 0.8)', borderWidth: 3, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  qteRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 6, opacity: 0.8 },
  qteInner: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  qteText: { color: '#fff', fontWeight: '900', fontSize: 28 },

  parryContainer: { 
    width: '100%', 
    height: '100%',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  parryPrompt: { color: 'white', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 30, letterSpacing: 6, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
  sigilRingContainer: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  sigilRingStatic: { position: 'absolute', width: '40%', height: '40%', borderWidth: 6, borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 100 },
  sigilRingDynamic: { position: 'absolute', width: '100%', height: '100%', borderWidth: 4, borderColor: '#ef4444', borderRadius: 100 },
  sigilButtons: { flexDirection: 'row', gap: 20 },
  sigilBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  
  sliderBox: { width: SCREEN_WIDTH * 0.75, height: SCREEN_WIDTH * 0.75 },

  apMeterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: 'rgba(34, 211, 238, 0.05)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.1)' },
  apLabel: { color: '#22d3ee', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  apPips: { flexDirection: 'row', gap: 6 },
  apValue: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },

  bottomHud: { padding: 12, backgroundColor: 'rgba(5, 11, 20, 0.95)', borderTopWidth: 1, borderColor: '#1e293b' },
  sequenceBar: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  sequenceItem: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(34, 211, 238, 0.2)', borderRadius: 4 },
  sequenceText: { color: '#22d3ee', fontSize: 9, fontWeight: 'bold' },
  
  readout: { height: 60, justifyContent: 'center', padding: 8, backgroundColor: 'rgba(34, 211, 238, 0.05)', borderColor: 'rgba(34, 211, 238, 0.2)', borderWidth: 1, borderRadius: 6, marginBottom: 8 },
  readoutTitle: { color: '#22d3ee', fontWeight: '900', fontSize: 12 },
  readoutType: { color: '#22d3ee', fontSize: 9, paddingHorizontal: 4, paddingVertical: 1, backgroundColor: 'rgba(34, 211, 238, 0.2)', borderRadius: 3 },
  readoutDesc: { color: '#94a3b8', fontSize: 9, marginTop: 2 },
  readoutFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingTop: 2 },
  readoutLabel: { color: '#22d3ee', fontSize: 9, fontWeight: 'bold' },
  readoutValue: { color: '#fbbf24', fontSize: 12, fontWeight: '900' },
  logText: { color: '#64748b', textAlign: 'center', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  
  controlsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  ctrlBtn: { flex: 2, padding: 8, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
  ctrlBtnSmall: { flex: 1, padding: 8, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  ctrlBtnDisabled: { opacity: 0.5 },
  ctrlText: { fontWeight: '900', fontSize: 10 },

  attackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, marginBottom: 12, borderWidth: 2, borderColor: '#fb923c', borderRadius: 8, backgroundColor: 'rgba(251, 146, 60, 0.15)', transform: [{skewX: '-12deg'}] },
  attackBtnSelected: { borderColor: '#facc15', backgroundColor: 'rgba(251, 146, 60, 0.3)' },
  attackBtnText: { color: '#fb923c', fontWeight: '900', fontSize: 14, letterSpacing: 2, transform: [{skewX: '12deg'}] },
  attackBtnSubtext: { color: '#94a3b8', fontSize: 10, transform: [{skewX: '12deg'}] },
  
  abilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  abilityBtn: { width: '31%', padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, minHeight: 48 },
  abilityBtnSelected: { borderColor: '#facc15', backgroundColor: 'rgba(34, 211, 238, 0.2)', transform: [{scale: 1.02}] },
  abilityBtnDisabled: { opacity: 0.3 },
  abilityName: { color: 'white', fontWeight: '800', fontSize: 9 },
  confirmBadge: { position: 'absolute', top: -6, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  confirmText: { color: '#facc15', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', backgroundColor: '#000', paddingHorizontal: 4, borderRadius: 2 },
  waitingText: { color: '#64748b', width: '100%', textAlign: 'center', padding: 20, fontWeight: 'bold' },
  
  exitBtn: { marginTop: 20, padding: 15, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  exitBtnText: { color: 'white', fontWeight: 'bold' }
});