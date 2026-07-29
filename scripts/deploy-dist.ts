import fs from 'fs';
import path from 'path';
import admZip from 'adm-zip';

async function deployDist() {
  const token = 'nfc_Eq8LnKAj5JdRvoViPRCSf4kyd1unZ5Yt2ac0';
  const distPath = path.resolve('dist');

  console.log('[deploy-dist] Creating cross-platform zip archive with forward slashes...');
  const zip = new admZip();
  zip.addLocalFolder(distPath);

  const zipBuffer = zip.toBuffer();
  console.log(`[deploy-dist] Zip created. Size: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`);

  // Step 1: Rename old site so haftora.netlify.app domain is freed
  console.log('[deploy-dist] Freeing haftora.netlify.app domain...');
  const sitesRes = await fetch('https://api.netlify.com/api/v1/sites', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const sites = await sitesRes.json() as any[];
  const existingHaftora = sites.find(s => s.name === 'haftora');
  if (existingHaftora) {
    await fetch(`https://api.netlify.com/api/v1/sites/${existingHaftora.id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `haftora-prev-${Date.now()}` }),
    });
  }

  // Step 2: Create new site with zip file
  console.log('[deploy-dist] Deploying zip archive to Netlify REST API...');
  const res = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/zip' },
    body: zipBuffer,
  });

  const site = await res.json() as any;
  console.log('[deploy-dist] New Site Created:', site.id);

  // Step 3: Rename to haftora & set public access
  const patchRes = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'haftora', password: '', password_context: 'all', sso_login: false }),
  });

  const finalSite = await patchRes.json() as any;
  console.log(`[deploy-dist] ✅ SUCCESS! Deployed live to: ${finalSite.ssl_url}`);
}

deployDist().catch(err => {
  console.error('[deploy-dist] ❌ Error:', err);
  process.exit(1);
});
