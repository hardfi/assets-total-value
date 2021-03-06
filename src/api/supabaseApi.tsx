import supabase from './supabase';

import { PostgrestResponse } from '@supabase/supabase-js';
import { Item, ItemForm, Status } from './typings';

const supabaseApi = {
  async getAllItems(): Promise<PostgrestResponse<any>> {
    return supabase
      .from('shopping')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
  },
  async getItemsByStatus(status: Status): Promise<PostgrestResponse<any>> {
    return supabase
      .from('shopping')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('updated_at', { ascending: false })
  },
  // async getRandomArticle(rowNumber: number): Promise<PostgrestResponse<Article>> {
  //   return supabase.from(Tables.ARTICLES).select('*').eq('rowNumber', rowNumber);
  // },
  async createNewItem(item: ItemForm): Promise<PostgrestResponse<Item>> {
    return supabase
      .from('shopping')
      .insert([item])
  },
  async updateItemStatus(itemUuid: string, status: Status): Promise<PostgrestResponse<Item>> {
    return supabase
      .from('shopping')
      .update({ status: status })
      .eq('uuid', itemUuid)
  },
};

export default supabaseApi;
