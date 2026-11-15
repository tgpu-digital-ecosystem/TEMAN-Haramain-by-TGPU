import{mkdirSync,copyFileSync,readdirSync}from'node:fs';
const target='.integration/supabase';mkdirSync(target+'/migrations',{recursive:true});
copyFileSync('tests/integration/config.toml',target+'/config.toml');
// Ordered test prerequisite, never copied into production migration history.
copyFileSync('tests/integration/prerequisites.sql',target+'/migrations/00000000000000_test_prerequisites.sql');
for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')))copyFileSync('supabase/migrations/'+file,target+'/migrations/'+file);
