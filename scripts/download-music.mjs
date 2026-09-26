import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';

const directory = new URL('../public/assets/music/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', directory), 'utf8'));
const hash = (data) => createHash('sha256').update(data).digest('hex');
await mkdir(directory, { recursive: true });

for (const track of manifest.tracks) {
  const destination = new URL(track.file, directory);
  const existing = await readFile(destination).catch(() => null);
  if (existing && hash(existing) === track.sha256) {
    console.log(`Verified: ${track.title}`);
    continue;
  }
  const response = await fetch(track.downloadUrl, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`${track.title}: HTTP ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length !== track.bytes || hash(data) !== track.sha256) {
    throw new Error(`${track.title}: source changed; review the new file and licence before updating the manifest.`);
  }
  const temporary = new URL(`${track.file}.part`, directory);
  try {
    await writeFile(temporary, data);
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
  console.log(`Downloaded: ${track.title}`);
}
