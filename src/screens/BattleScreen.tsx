import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, PanResponder, SafeAreaView, StatusBar, ActivityIndicator, Image } from 'react-native';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { Sword, RotateCcw, Play, ArrowUp, Skull, Hexagon } from 'lucide-react-native';
import { useBattleLogic, PHASE, ACTOR_TYPE, SIGILS, getPointOnPath } from '@/hooks/useBattleLogic';
import LayeredAvatar from '@/components/LayeredAvatar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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
    parryMode,
    targetSigil,
    targetSlider,
    parryTimer,
    parryPreDelay,
    parryWindowActive,
    isHolding,
    setIsHolding,
    setSliderSync,
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
  } = useBattleLogic({ encounterId, raidId, isBoss });

  const [sliderLayout, setSliderLayout] = useState({x: 0, y: 0, width: 0, height: 0});

  // Slider Pan Responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsHolding(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!targetSlider || !sliderLayout.width) return;
        
        // Normalize touch coordinates relative to the slider view
        const touchX = evt.nativeEvent.locationX;
        const touchY = evt.nativeEvent.locationY;
        
        // Convert to 0-100 scale used by SVG logic
        const scaledX = (touchX / sliderLayout.width) * 100;
        const scaledY = (touchY / sliderLayout.height) * 100;

        // Import helper function or duplicate logic? Let's assume helper is exported or we use logic from hook if returned.
        // Since getPointOnPath is exported from hook file but not returned by hook, we import it.
        // Wait, I need to import getPointOnPath from the hook file.
        // Let's assume I updated the import above.
        
        // RE-IMPLEMENT helper here to avoid import issues for now if not exported
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const getPoint = (checkpoints: any[], t: number) => {
            if (t <= 0) return checkpoints[0];
            if (t >= 1) return checkpoints[checkpoints.length - 1];
            const segmentCount = checkpoints.length - 1;
            const scaledT = t * segmentCount;
            const index = Math.floor(scaledT);
            const localT = scaledT - index;
            const p1 = checkpoints[index];
            const p2 = checkpoints[index + 1];
            return { x: lerp(p1.x, p2.x, localT), y: lerp(p1.y, p2.y, localT) };
        };

        const ballPos = getPoint(targetSlider.checkpoints, parryTimer / 100);
        const dist = Math.sqrt(Math.pow(scaledX - ballPos.x, 2) + Math.pow(scaledY - ballPos.y, 2));
        
        // 22 is tolerance
        setSliderSync(dist < 22);
      },
      onPanResponderRelease: () => {
        setIsHolding(false);
      }
    })
  ).current;

  // Re-implement getPoint for render
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const getPoint = (checkpoints: any[], t: number) => {
      if (t <= 0) return checkpoints[0];
      if (t >= 1) return checkpoints[checkpoints.length - 1];
      const segmentCount = checkpoints.length - 1;
      const scaledT = t * segmentCount;
      const index = Math.floor(scaledT);
      const localT = scaledT - index;
      const p1 = checkpoints[index];
      const p2 = checkpoints[index + 1];
      return { x: lerp(p1.x, p2.x, localT), y: lerp(p1.y, p2.y, localT) };
  };

  if (loading) {
      return (
          <View style={[styles.container, styles.loadingCentered]}>
              <ActivityIndicator size="large" color="#22d3ee" />
              <Text style={styles.loadingText}>INITIALIZING BATTLE...</Text>
          </View>
      );
  }

  // Handle End Game
  if (currentPhase === PHASE.VICTORY) {
      return (
          <View style={[styles.container, {justifyContent: 'center'}]}>
              <Text style={[styles.cinematicText, {color: '#4ade80'}]}>VICTORY</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.exitBtn}>
                  <Text style={styles.exitBtnText}>RETURN</Text>
              </TouchableOpacity>
          </View>
      );
  }

  if (currentPhase === PHASE.DEFEAT) {
      return (
          <View style={[styles.container, {justifyContent: 'center'}]}>
              <Text style={[styles.cinematicText, {color: '#ef4444'}]}>DEFEAT</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.exitBtn}>
                  <Text style={styles.exitBtnText}>RETURN</Text>
              </TouchableOpacity>
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Cinematic Flash Overlay */}
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

        {/* --- PARRY UI LAYER --- */}
        {currentPhase === PHASE.ENEMY_STRIKE && (
            <View style={styles.parryOverlay} pointerEvents="box-none">
                <View style={styles.parryContainer}>
                    {parryMode === 'SIGIL' && targetSigil && (
                        <View style={{alignItems: 'center'}}>
                            <Text style={styles.parryPrompt}>RESONATE!</Text>
                            <View style={styles.sigilRingContainer}>
                                <View style={[styles.sigilRingStatic]} />
                                <View style={[styles.sigilRingDynamic, { transform: [{ scale: 1 - parryTimer/100 }] }]} />
                                <targetSigil.icon size={40} color="#ef4444" />
                            </View>
                            <View style={styles.sigilButtons}>
                                {Object.values(SIGILS).map((s: any) => (
                                    <TouchableOpacity key={s.id} onPressIn={() => parryWindowActive && parryPreDelay <= 0 && parryTimer > 55 && parryTimer < 95 && s.id === targetSigil.id ? resolveEnemyAttack(true, "PERFECT") : resolveEnemyAttack(false, "MISS")} style={styles.sigilBtn}>
                                        <s.icon size={24} color="white" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {parryMode === 'SLIDER' && targetSlider && (
                        <View style={{alignItems: 'center'}}>
                            <Text style={styles.parryPrompt}>{parryPreDelay > 0 ? "READY..." : "HOLD & TRACK"}</Text>
                            <View 
                                style={styles.sliderBox}
                                onLayout={(e) => setSliderLayout(e.nativeEvent.layout)}
                                {...panResponder.panHandlers}
                            >
                                <Svg height="100%" width="100%" viewBox="0 0 100 100">
                                    <Path d={targetSlider.path} stroke="#1e293b" strokeWidth="12" fill="none" strokeLinecap="round" />
                                    <Path d={targetSlider.path} stroke={isHolding ? "#22d3ee" : "#ef4444"} strokeWidth="4" fill="none" strokeDasharray="1,4" />
                                    {/* Render Ball */}
                                    {(() => {
                                         const pos = getPointOnPath(targetSlider.checkpoints, parryTimer / 100);
                                         return (
                                             <>
                                                <SvgCircle cx={pos.x} cy={pos.y} r="15" stroke={isHolding ? "#22d3ee" : "#ef4444"} strokeWidth="1" strokeDasharray="4,4" fill="none" />
                                                <SvgCircle cx={pos.x} cy={pos.y} r="6" fill={isHolding ? "#fff" : "#ef4444"} />
                                             </>
                                         );
                                    })()}
                                    {/* End Target */}
                                    {(() => {
                                        const end = getPointOnPath(targetSlider.checkpoints, 1.0);
                                        return <SvgCircle cx={end.x} cy={end.y} r="6" fill="#ef4444" />;
                                    })()}
                                </Svg>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        )}

        {/* --- BOTTOM HUD --- */}
        <View style={styles.bottomHud}>
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
                            <Text style={styles.readoutLabel}>{getProjectedDetail(currentAbility)?.hits} Hits</Text>
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
                                <Text style={styles.abilityName} numberOfLines={1}>{ability.name}</Text>
                                <View style={{flexDirection:'row', gap:2, marginTop: 4}}>
                                    {[...Array(ability.cost)].map((_, i) => <Hexagon key={i} size={6} fill={isSelected ? "#22d3ee" : "#555"} color={isSelected ? "#22d3ee" : "#555"} />)}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  loadingCentered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#22d3ee', marginTop: 10, letterSpacing: 2 },
  gameFrame: { width: '100%', height: '100%', backgroundColor: '#050b14', position: 'relative' },
  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center' },
  cinematicText: { fontSize: 48, fontStyle: 'italic', fontWeight: '900', color: 'white', textTransform: 'uppercase', textShadowColor: '#22d3ee', textShadowRadius: 20 },
  
  topHud: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: 40, zIndex: 20, position: 'absolute', width: '100%', top: 0 },
  turnQueue: { gap: 8 },
  queueItem: { width: 32, height: 32, borderWidth: 1, borderColor: '#334155', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', transform: [{skewX: '-12deg'}] },
  queueItemActive: { width: 48, height: 48, borderColor: '#22d3ee', borderWidth: 2 },
  
  queueImage: { width: '100%', height: '100%', borderRadius: 4 },
  queueAvatarWrapper: { width: '100%', height: '100%', borderRadius: 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  
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

  parryOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 50 },
  parryContainer: { width: 300, padding: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, transform: [{skewX: '-6deg'}], borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 },
  parryPrompt: { color: '#22d3ee', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: 4 },
  sigilRingContainer: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  sigilRingStatic: { position: 'absolute', width: '40%', height: '40%', borderWidth: 4, borderColor: 'rgba(34, 211, 238, 0.3)', borderRadius: 100 },
  sigilRingDynamic: { position: 'absolute', width: '100%', height: '100%', borderWidth: 4, borderColor: '#22d3ee', borderRadius: 100 },
  sigilButtons: { flexDirection: 'row', gap: 16 },
  sigilBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  
  sliderBox: { width: 200, height: 200, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 2, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12 },

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