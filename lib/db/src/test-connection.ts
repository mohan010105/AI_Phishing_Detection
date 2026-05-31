import pg from 'pg';

const regions = ['us-east-2', 'us-west-2', 'eu-west-1', 'eu-west-2', 'ca-central-1'];
const urls = regions.map(r => `postgresql://postgres.syirwdbfikklfpgwtffk:Mohan@05@aws-0-${r}.pooler.supabase.com:6543/postgres`);

async function test() {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const region = regions[i];
    console.log(`Testing region ${region} pooler:`, url.replace(/:[^:@/]+@/, ':****@'));
    const client = new pg.Client({ 
      connectionString: url,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log(`✓ Successfully connected to ${region} pooler!`);
      const res = await client.query('SELECT NOW()');
      console.log('Server time:', res.rows[0]);
      await client.end();
      return;
    } catch (err: any) {
      console.error(`✗ Failed for ${region}:`, err.message);
    }
  }
}

test();
