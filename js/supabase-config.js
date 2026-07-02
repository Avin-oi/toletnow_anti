const supabaseUrl = 'https://saoqryectqrnuhoskvwc.supabase.co';
const supabaseKey = 'sb_publishable_fF1xDCsZC44Z9suBK7aJmA_GbYmvgVH';

// Initialize Supabase Client when the browser SDK has loaded.
window.supabaseClient = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}
