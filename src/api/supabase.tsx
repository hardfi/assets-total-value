import getConfig from 'next/config';

import { createClient } from '@supabase/supabase-js';

const {REACT_APP_SUPABASE_KEY, REACT_APP_SUPABASE_URL} = process.env;

const supabase = createClient(REACT_APP_SUPABASE_URL || '', REACT_APP_SUPABASE_KEY || '');

export default supabase;
