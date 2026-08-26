import supabase from './supabase';
import { BabyEvent, BabyEventForm, Item, ItemForm, LiabilityItem, Status } from './typings';

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
  async removeLiabilityItem(uuid: string): Promise<PostgrestResponse<any>> {
    return supabase.from('liabilities').delete().eq('uuid', uuid);
  },
  async getBabyEvents(limit = 200): Promise<PostgrestResponse<any>> {
    return supabase
      .from('baby_events')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .limit(limit);
  },
  async createBabyEvent(event: BabyEventForm): Promise<PostgrestResponse<BabyEvent>> {
    return supabase.from('baby_events').insert([event]);
  },
  async finishBabyEvent(uuid: string, endedAt: string): Promise<PostgrestResponse<BabyEvent>> {
    return supabase.from('baby_events').update({ ended_at: endedAt }).eq('uuid', uuid);
  },
  async setBabyEventAmount(
    uuid: string,
    amountMl: number | null,
  ): Promise<PostgrestResponse<BabyEvent>> {
    return supabase.from('baby_events').update({ amount_ml: amountMl }).eq('uuid', uuid);
  },
  async removeBabyEvent(uuid: string): Promise<PostgrestResponse<any>> {
    return supabase.from('baby_events').delete().eq('uuid', uuid);
  },
};

export default supabaseApi;
