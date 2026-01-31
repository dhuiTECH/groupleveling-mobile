import { supabase } from '../lib/supabase';
import { User, UserCosmetic, ShopItem } from '../types/user';

export const api = {
  // Get all friends-related data
  getFriendsData: async (userId: string) => {
    try {
      // Fetch friends (accepted status)
      const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          user_id_1,
          user_id_2,
          requester:profiles!friendships_user_id_1_fkey(*),
          recipient:profiles!friendships_user_id_2_fkey(*)
        `)
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      if (friendsError) throw friendsError;

      const friends = friendships
        .filter(f => f.status === 'accepted')
        .map(f => f.user_id_1 === userId ? f.recipient : f.requester);

      const friendRequests = friendships
        .filter(f => f.status === 'pending' && f.user_id_2 === userId);

      const outgoingRequests = friendships
        .filter(f => f.status === 'pending' && f.user_id_1 === userId);

      return {
        friends,
        friendRequests,
        outgoingRequests,
      };
    } catch (error) {
      console.error('Error fetching friends data:', error);
      throw error;
    }
  },

  // Get showcase hunters
  getShowcaseHunters: async (userId: string) => {
    try {
      // In a real app, this might be a more complex query or an RPC
      // For now, fetching profiles with highest showcase_score
      const { data: hunters, error } = await supabase
        .from('profiles')
        .select(`
          *,
          cosmetics:user_cosmetics(
            *,
            shop_items:shop_item_id(*)
          )
        `)
        .order('showcase_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Check if current user has voted this month
      // This is simplified; real logic would involve checking showcase_votes table
      const { data: votes, error: voteError } = await supabase
        .from('showcase_votes')
        .select('*')
        .eq('voter_id', userId);

      if (voteError) throw voteError;

      return {
        hunters: hunters || [],
        userHasVoted: (votes || []).length > 0,
        daysUntilReset: 7, // Mocked value
      };
    } catch (error) {
      console.error('Error fetching showcase hunters:', error);
      throw error;
    }
  },

  // Get associations
  getAssociations: async () => {
    try {
      const { data, error } = await supabase
        .from('associations')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching associations:', error);
      throw error;
    }
  },

  // Get leaderboard
  getLeaderboard: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          cosmetics:user_cosmetics(
            *,
            shop_items:shop_item_id(*)
          )
        `)
        .order('exp', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },

  // Friend actions
  sendFriendRequest: async (userId1: string, userId2: string) => {
    const { error } = await supabase
      .from('friendships')
      .insert({ user_id_1: userId1, user_id_2: userId2, status: 'pending' });
    if (error) throw error;
  },

  acceptFriendRequest: async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);
    if (error) throw error;
  },

  rejectFriendRequest: async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    if (error) throw error;
  },

  cancelFriendRequest: async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    if (error) throw error;
  },

  // Association actions
  applyToAssociation: async (userId: string, associationId: string) => {
    // In this simplified version, we just update the user's association_id
    // Real logic might involve an 'applications' table
    const { error } = await supabase
      .from('profiles')
      .update({ association_id: associationId })
      .eq('id', userId);
    if (error) throw error;
  },

  handleApplicantDecision: async (applicantId: string, action: 'accept' | 'reject') => {
    // Logic for accepting/rejecting applicants would go here
    // For now, placeholder
  },

  createAssociation: async (userId: string, name: string, emblemUrl: string) => {
    try {
      // 1. Create association
      const { data: association, error: createError } = await supabase
        .from('associations')
        .insert({ name, emblem_url: emblemUrl })
        .select()
        .single();

      if (createError) throw createError;

      // 2. Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ association_id: association.id })
        .eq('id', userId);

      if (updateError) throw updateError;

      return association;
    } catch (error) {
      console.error('Error creating association:', error);
      throw error;
    }
  },

  voteShowcase: async (voterId: string, targetId: string, voteType: 'resonate' | 'interfere') => {
    const value = voteType === 'resonate' ? 1 : -1;
    const { error } = await supabase
      .from('showcase_votes')
      .insert({ voterId, targetId, voteType, voteValue: value });
    if (error) throw error;

    // Trigger score update (usually handled by a DB trigger or separate update)
    const { error: scoreError } = await supabase.rpc('update_showcase_score', { 
      target_hunter_id: targetId, 
      score_delta: value 
    });
    // Fallback if RPC doesn't exist (not ideal but for safety)
    if (scoreError) console.warn('RPC update_showcase_score failed, check if it exists');
  },

  searchHunters: async (query: string, excludeUserId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('hunter_name', `%${query}%`)
      .neq('id', excludeUserId)
      .limit(10);
    
    if (error) throw error;
    return data || [];
  },

  getSuggestions: async (excludeUserId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', excludeUserId)
      .limit(5); // In real app, maybe random or based on level
    
    if (error) throw error;
    return data || [];
  }
};
