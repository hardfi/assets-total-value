import supabase from './supabase';
import { Item, ItemForm, LiabilityItem, Status } from './typings';

import { PostgrestResponse } from '@supabase/supabase-js';

const supabaseApi = {
  async getAllItems(): Promise<PostgrestResponse<any>> {
    return supabase
      .from('shopping')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false });
  },
  async getShoppingList(listNumber: number): Promise<PostgrestResponse<any>> {
    return supabase
      .from('shopping')
      .select('*', { count: 'exact' })
      .eq('list', listNumber)
      .order('name', { ascending: true });
  },
  async getItemsByStatus(status: Status): Promise<PostgrestResponse<any>> {
    return supabase
      .from('shopping')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('updated_at', { ascending: false });
  },
  // async getRandomArticle(rowNumber: number): Promise<PostgrestResponse<Article>> {
  //   return supabase.from(Tables.ARTICLES).select('*').eq('rowNumber', rowNumber);
  // },
  async createNewItem(item: ItemForm): Promise<PostgrestResponse<Item>> {
    return supabase.from('shopping').insert([item]);
  },
  async updateItemStatus(
    itemUuid: string,
    status: Status,
    list: number,
  ): Promise<PostgrestResponse<Item>> {
    return supabase.from('shopping').update({ status, list }).eq('uuid', itemUuid);
  },
  async addNewLiabilityItem(item: LiabilityItem): Promise<PostgrestResponse<any>> {
    return supabase.from('liabilities').insert([item]);
  },
  async getLiabilitiesList(): Promise<PostgrestResponse<any>> {
    return supabase.from('liabilities').select('*', { count: 'exact' });
  },
  // async removeLiabilityItem(item: LiabilityForm): Promise<PostgrestResponse<any>> {
  //   return supabase
  //       .from('liabilities')
  //       .delete([item])
  // }
};

export default supabaseApi;
