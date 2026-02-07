import { useState, useEffect, useRef } from 'react';
import { Animated, Vibration, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Circle, Triangle, X } from 'lucide-react-native';
import { useSkills } from '@/hooks/useSkills'; // Import the new hook

// --- Constants & Types ---

export const PHASE = {
  ACTIVE: 'ACTIVE_PHASE',
  ENEMY_WINDUP: 'ENEMY_WINDUP',
  ENEMY_STRIKE: 'ENEMY_STRIKE',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT'
};

export const ACTOR_TYPE = {
  PLAYER: 'PLAYER', 
  ENEMY: 'ENEMY'
};

export const STANCE = {
  ATTACK: { 
    id: 'attack', 
    label: 'ASSAULT', 
    color: '#fb923c', 
    bg: '#f97316', 
    borderColor: '#f97316',
    description: "Maximum offense.",
    modifiers: ["+25% Base DMG", "+50% Chain"]
  },
  DEFENSE: { 
    id: 'defense', 
    label: 'GUARD', 
    color: '#22d3ee', 
    bg: '#06b6d4', 
    borderColor: '#06b6d4',
    description: "Survival focus.",
    modifiers: ["-40% Dmg Taken", "+50% Heal"]
  }
};

export const SIGILS = {
  CIRCLE: { id: 'circle', icon: Circle, label: 'CIRCLE' },
  TRIANGLE: { id: 'triangle', icon: Triangle, label: 'TRIANGLE' },
  CROSS: { id: 'cross', icon: X, label: 'CROSS' }
};

export const SLIDER_PATHS = {
  ZIGZAG: { id: 'zigzag', path: "M 20 20 L 80 20 L 20 80 L 80 80", checkpoints: [{x:20, y:20}, {x:80, y:20}, {x:20, y:80}, {x:80, y:80}] },
  S_CURVE: { id: 'scurve', path: "M 50 10 C 90 10 90 50 50 50 C 10 50 10 90 50 90", checkpoints: [{x:50, y:10}, {x:85, y:25}, {x:50, y:50}, {x:15, y:75}, {x:50, y:90}] },
  V_SHAPE: { id: 'vshape', path: "M 10 10 L 50 90 L 90 10", checkpoints: [{x:10, y:10}, {x:50, y:90}, {x:90, y:10}] }
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const getPointOnPath = (checkpoints: {x: number, y: number}[], t: number) => {
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

const generateTurns = (count = 50) => {
    return Array.from({ length: count }, () => Math.random() > 0.6 ? ACTOR_TYPE.ENEMY : ACTOR_TYPE.PLAYER);
};

export const useBattleLogic = ({ encounterId, raidId, isBoss }: { encounterId?: string, raidId?: string, isBoss?: boolean }) => {
  const { user } = useAuth();
  const { getBattleSkills, loadout, loading: loadingSkills } = useSkills(user?.id); // Use the skills hook
  const [loading, setLoading] = useState(true);
  
  // Entities
  const [party, setParty] = useState<any[]>([]);
  const [enemy, setEnemy] = useState<any>(null);
  
  // State Machine
  const [currentPhase, setCurrentPhase] = useState(PHASE.ACTIVE);
  const [stance, setStance] = useState(STANCE.ATTACK);
  const [stanceLevel, setStanceLevel] = useState(1.0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>(['BATTLE START']);
  const [chainCount, setChainCount] = useState(0);
  const [turnQueue, setTurnQueue] = useState(generateTurns(50));
  const [queueIndex, setQueueIndex] = useState(0);

  // Planning
  const [plannedAbilities, setPlannedAbilities] = useState<any[]>([]);
  const [selectedAbilityId, setSelectedAbilityId] = useState<string | null>(null);

  // Parry State
  const [enemyTargetId, setEnemyTargetId] = useState<string | null>(null);
  const [parryTimer, setParryTimer] = useState(0);
  const [parryPreDelay, setParryPreDelay] = useState(0);
  const [parryWindowActive, setParryWindowActive] = useState(false);
  const [parryMode, setParryMode] = useState<'SIGIL' | 'SLIDER'>('SIGIL');
  const [targetSigil, setTargetSigil] = useState<any>(null);
  const [targetSlider, setTargetSlider] = useState<any>(null);
  
  // FX State
  const [successFlash, setSuccessFlash] = useState(false);
  const [failFlash, setFailFlash] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [sliderSync, setSliderSync] = useState(true);
  
  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const isProcessingActionsRef = useRef(false);

  // Constants
  const activeChar = party[activeIndex];
  const activeActorType = turnQueue[queueIndex];
  const isPlayerTurnPhase = currentPhase === PHASE.ACTIVE && activeActorType === ACTOR_TYPE.PLAYER;
  const currentAbility = activeChar?.abilities.find((a: any) => a.id === selectedAbilityId);
  const basicAbility = activeChar?.abilities?.find((a: any) => a.id.endsWith('_basic') || a.id === 'generic_attack') ?? activeChar?.abilities?.[0];

  // --- Initialization ---
  useEffect(() => {
    // Wait for loadout to be populated or confirmed empty before initializing
    if (loadingSkills) return;
    
    const initBattle = async () => {
      setLoading(true);
      try {
        // 1. Fetch Player Data & Skills (always includes Basic Attack from useSkills)
        let playerAbilities = getBattleSkills();
        if (playerAbilities.length === 0) {
            playerAbilities = [{
                id: 'generic_attack',
                name: 'Generic Attack',
                cost: 0,
                power: 50,
                type: 'damage',
                element: 'Physical',
                hits: 1,
                target: 'Single',
                description: 'Deal 100% ATK.',
                current_rank: 1,
                cooldown: 0,
            }];
        }

        const playerChar = {
            id: user?.id || 'player',
            name: user?.name || 'Hunter',
            hp: user?.current_hp ?? (user?.max_hp || 100),
            maxHP: user?.max_hp ?? 100,
            ap: 3,
            maxAP: 3,
            abilities: playerAbilities,
            type: 'player',
            atkBuff: 0,
            avatar: user // Store user object for LayeredAvatar
        };

        setParty([playerChar]);

        // 2. Fetch Enemy Data
        if (isBoss && raidId) {
            // Fetch Raid Boss
            const { data: raidData } = await supabase.from('dungeon_raids').select('*, encounter_pool(*)').eq('id', raidId).single();
            if (raidData) {
                setEnemy({
                    id: raidData.id,
                    name: raidData.encounter_pool?.name || 'Raid Boss',
                    hp: raidData.current_hp,
                    maxHP: raidData.encounter_pool?.hp_base || 100000,
                    defDebuff: 0,
                    icon_url: raidData.encounter_pool?.icon_url
                });

                // Subscribe to Raid HP
                const channel = supabase.channel(`raid-${raidId}`)
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dungeon_raids', filter: `id=eq.${raidId}` }, 
                    payload => {
                        setEnemy((prev: any) => {
                            if (!prev) return null;
                            return { ...prev, hp: payload.new.current_hp };
                        });
                    })
                    .subscribe();
                
                return () => supabase.removeChannel(channel);
            }
        } else if (encounterId) {
            // Fetch Random Encounter
            const { data: encounterData } = await supabase.from('encounter_pool').select('*').eq('id', encounterId).single();
            if (encounterData) {
                 setEnemy({
                    id: encounterData.id,
                    name: encounterData.name,
                    hp: encounterData.hp_base,
                    maxHP: encounterData.hp_base,
                    defDebuff: 0,
                    icon_url: encounterData.icon_url
                });
            }
        }
      } catch (e) {
        console.error("Battle Init Error:", e);
        Alert.alert("Error", "Failed to initialize battle sequence.");
      } finally {
        setLoading(false);
      }
    };

    initBattle();
  }, [encounterId, raidId, isBoss, user, loadingSkills]); // Added loadingSkills dependency

  // --- Helpers ---
  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 2));

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
    Vibration.vibrate(100);
  };

  const startPlayerTurn = () => {
    setCurrentPhase(PHASE.ACTIVE);
    setEnemyTargetId(null);
    setChainCount(0);
    setPlannedAbilities([]);
    setSelectedAbilityId(null);
    setParty(prev => prev.map(p => ({ ...p, ap: Math.min(p.maxAP, p.ap + 1), atkBuff: Math.max(0, p.atkBuff - 1) })));
    setEnemy((prev: any) => {
      if (!prev) return null;
      return { ...prev, defDebuff: Math.max(0, (prev.defDebuff ?? 0) - 1) };
    });
  };

  const switchStance = () => {
    setStance(prev => prev.id === 'attack' ? STANCE.DEFENSE : STANCE.ATTACK);
  };

  const processPlannedActions = async () => {
    if (!isPlayerTurnPhase || plannedAbilities.length === 0) return;
    if (isProcessingActionsRef.current) return;
    isProcessingActionsRef.current = true;

    try {
      const toProcess = [...plannedAbilities];
      setPlannedAbilities([]);
      setSelectedAbilityId(null);

      let workingParty = JSON.parse(JSON.stringify(party));
      let workingEnemy = { ...enemy };
      let c = 0;
      let totalDmg = 0;

      for (const item of toProcess) {
        const { charId, ability } = item;
        const char = workingParty.find((p: any) => p.id === charId);
        const chainMultiplier = 1.0 + (c * 0.1);

        if (ability.type === 'buff') {
          workingParty = workingParty.map((p: any) => p.id === charId ? { ...p, atkBuff: 2 } : p);
        } else if (ability.type === 'debuff') {
          workingEnemy.defDebuff = 2;
        } else if (ability.type === 'heal') {
          const healMod = stance.id === 'defense' ? 1.5 : 1.0;
          const healAmt = ability.power * healMod;
          workingParty = workingParty.map((p: any) => ({ ...p, hp: Math.min(p.maxHP, p.hp + healAmt) }));
        } else {
          let pwr = ability.power * (stance.id === 'attack' ? (1.25 * stanceLevel) : 0.6);
          if (char?.atkBuff > 0) pwr *= 1.5;
          if (workingEnemy.defDebuff > 0) pwr *= 1.5;
          pwr *= chainMultiplier;
          const dmg = Math.floor(pwr);
          workingEnemy.hp = Math.max(0, workingEnemy.hp - dmg);
          totalDmg += dmg;
        }
        c++;
      }

      setParty(workingParty);
      setEnemy(workingEnemy);

      if (workingEnemy.hp <= 0) {
        setCurrentPhase(PHASE.VICTORY);
        isProcessingActionsRef.current = false;
        return;
      }

      if (isBoss && raidId && totalDmg > 0) {
        await supabase.rpc('land_raid_hit', {
          t_raid_id: raidId,
          t_user_id: user?.id,
          t_damage: totalDmg
        });
      }

      setTimeout(() => {
        setQueueIndex(prev => prev + 1);
        startPlayerTurn();
        isProcessingActionsRef.current = false;
      }, 600);
    } catch (e) {
      console.error('processPlannedActions error:', e);
      isProcessingActionsRef.current = false;
    }
  };

  const undoLastAction = () => {
    if (plannedAbilities.length === 0) return;
    const lastAction = plannedAbilities[plannedAbilities.length - 1];
    setParty(prev => prev.map(p => p.id === lastAction.charId ? { ...p, ap: p.ap + lastAction.ability.cost } : p));
    setPlannedAbilities(prev => prev.slice(0, -1));
    setChainCount(prev => prev - 1);
    setSelectedAbilityId(null);
  };

  const handleAbilityTap = (ability: any) => {
    if (!isPlayerTurnPhase) return;
    if (selectedAbilityId === ability.id) {
        const char = party.find(p => p.id === activeChar.id);
        if (char.ap >= ability.cost) {
            setPlannedAbilities(prev => [...prev, { charId: activeChar.id, ability }]);
            setParty(prev => prev.map(p => p.id === activeChar.id ? { ...p, ap: p.ap - ability.cost } : p));
            setChainCount(prev => prev + 1);
            setSelectedAbilityId(null);
        }
    } else {
        setSelectedAbilityId(ability.id);
    }
  };

  const resolveEnemyAttack = (isParry: boolean, msg: string) => {
    if (isParry) {
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 800);
    } else {
        setFailFlash(true);
        triggerShake();
        setTimeout(() => setFailFlash(false), 800);
    }
    const dmg = isParry ? 0 : 800; // Fixed dmg for now
    const nextParty = party.map(p => p.id === enemyTargetId ? { ...p, hp: Math.max(0, p.hp - dmg) } : p);
    setParty(nextParty);
    addLog(`${msg}`);

    if (nextParty.every(p => p.hp <= 0)) {
        setCurrentPhase(PHASE.DEFEAT);
        return;
    }

    setTimeout(() => {
        setQueueIndex(prev => prev + 1);
        startPlayerTurn();
    }, 1800);
  };

  const startEnemyAttack = () => {
    setCurrentPhase(PHASE.ENEMY_STRIKE);
    setParryTimer(0);
    setParryWindowActive(true);
    setIsHolding(false);
    setSliderSync(true);
    if (Math.random() < 0.5) {
        setParryMode('SIGIL');
        setParryPreDelay(0.5); 
        setTargetSigil(SIGILS[Object.keys(SIGILS)[Math.floor(Math.random() * 3)] as keyof typeof SIGILS]);
    } else {
        setParryMode('SLIDER');
        setParryPreDelay(1.2); 
        setTargetSlider(Object.values(SLIDER_PATHS)[Math.floor(Math.random() * 3)]);
    }
  };

  const startEnemyTurn = () => {
    setCurrentPhase(PHASE.ENEMY_WINDUP);
    const living = party.filter(p => p.hp > 0);
    const target = living[Math.floor(Math.random() * living.length)];
    if (target) {
        setEnemyTargetId(target.id);
        setTimeout(() => startEnemyAttack(), 1500);
    } else {
        setQueueIndex(prev => prev + 1);
        startPlayerTurn();
    }
  };

  // --- Core Loop ---
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();

    const loop = () => {
        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        if (currentPhase === PHASE.ACTIVE && stanceLevel < 2.0) {
            setStanceLevel(prev => Math.min(2.0, prev + (0.8 * deltaTime)));
        }

        if (currentPhase === PHASE.ENEMY_STRIKE && parryWindowActive) {
            if (parryPreDelay > 0) {
                setParryPreDelay(prev => prev - deltaTime);
            } else {
                const speed = parryMode === 'SIGIL' ? 85 : 60;
                setParryTimer(prev => {
                   const next = prev + (deltaTime * speed); 
                   if (parryMode === 'SLIDER') {
                       if (next > 2 && next < 95) {
                           if (!isHolding || !sliderSync) { 
                               setParryWindowActive(false); 
                               resolveEnemyAttack(false, "BROKEN"); 
                               return 0; 
                           }
                       } else if (next >= 95) { 
                           setParryWindowActive(false); 
                           resolveEnemyAttack(true, "PERFECT"); 
                           return 0; 
                       }
                   }
                   if (next >= 100) { resolveEnemyAttack(false, "EXPIRED"); return 0; }
                   return next;
                });
            }
        }
        animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentPhase, parryMode, isHolding, sliderSync, parryWindowActive, parryPreDelay, stanceLevel]);

  // Turn Trigger
  useEffect(() => {
    if (currentPhase === PHASE.ACTIVE && activeActorType === ACTOR_TYPE.ENEMY) {
        startEnemyTurn();
    }
  }, [queueIndex, currentPhase, activeActorType]);

  const getProjectedDetail = (ability: any) => {
    if (!ability || !activeChar) return null;
    const chainMod = (1.0 + (chainCount * 0.1)).toFixed(1);
    const stanceMod = (stance.id === 'attack' ? (1.25 * stanceLevel) : 0.6).toFixed(2);
    let outcome = "";
    if (ability.type === 'damage') {
        let finalPwr = ability.power * parseFloat(stanceMod);
        if (activeChar.atkBuff > 0) finalPwr *= 1.5;
        if (enemy?.defDebuff > 0) finalPwr *= 1.5;
        finalPwr *= parseFloat(chainMod);
        outcome = Math.floor(finalPwr) + " DMG";
    } else if (ability.type === 'heal') {
        const healMod = stance.id === 'defense' ? 1.5 : 1.0;
        const healAmt = ability.power * healMod;
        outcome = "+" + Math.floor(healAmt) + " HP";
    } else outcome = "Effect / 2T";

    return { name: ability.name, type: ability.type, desc: ability.description, hits: ability.hits, target: ability.target, final: outcome };
  };

  return {
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
  };
};