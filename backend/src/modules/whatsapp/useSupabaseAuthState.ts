import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../shared/logger';

export const useSupabaseAuthState = async (supabase: SupabaseClient, baileys: any) => {
  const { initAuthCreds, BufferJSON, proto } = baileys;
  
  const readData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('data')
        .eq('id', id)
        .single();
        
      if (data && data.data) {
        return JSON.parse(data.data, BufferJSON.reviver);
      }
    } catch (e) {
      // It's ok if it fails (e.g. not found)
    }
    return null;
  };

  const writeData = async (data: any, id: string) => {
    try {
      const serialized = JSON.stringify(data, BufferJSON.replacer);
      await supabase
        .from('whatsapp_sessions')
        .upsert({ id, data: serialized }, { onConflict: 'id' });
    } catch (e) {
      logger.error({ id, error: e }, 'Failed to write session data to Supabase');
    }
  };

  const removeData = async (id: string) => {
    try {
      await supabase.from('whatsapp_sessions').delete().eq('id', id);
    } catch (e) {
      logger.error({ id, error: e }, 'Failed to delete session data from Supabase');
    }
  };

  const creds = await readData('creds') || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: { [key: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<any>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(value, key));
              } else {
                tasks.push(removeData(key));
              }
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => writeData(creds, 'creds')
  };
};
