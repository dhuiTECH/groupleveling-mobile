import { supabase } from '../lib/supabase';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export class ApiClient {
  /**
   * General purpose GET request using Supabase
   * If endpoint starts with '/', it assumes a REST-like call to a table or function
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const parts = endpoint.replace(/^\//, '').split('/');
    const table = parts[0];
    const id = parts[1];

    try {
      let query = supabase.from(table).select('*');
      if (id) {
        query = query.eq('id', id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { 
        data: (id ? data[0] : data) as T, 
        success: true 
      };
    } catch (error: any) {
      return {
        data: {} as T,
        success: false,
        message: error.message,
      };
    }
  }

  async post<T>(endpoint: string, payload?: any): Promise<ApiResponse<T>> {
    const table = endpoint.replace(/^\//, '');
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      return { data: data as T, success: true };
    } catch (error: any) {
      return {
        data: {} as T,
        success: false,
        message: error.message,
      };
    }
  }

  async put<T>(endpoint: string, payload?: any): Promise<ApiResponse<T>> {
    const parts = endpoint.replace(/^\//, '').split('/');
    const table = parts[0];
    const id = parts[1];

    try {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: data as T, success: true };
    } catch (error: any) {
      return {
        data: {} as T,
        success: false,
        message: error.message,
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const parts = endpoint.replace(/^\//, '').split('/');
    const table = parts[0];
    const id = parts[1];

    try {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: data as T, success: true };
    } catch (error: any) {
      return {
        data: {} as T,
        success: false,
        message: error.message,
      };
    }
  }
}

export const apiClient = new ApiClient();
