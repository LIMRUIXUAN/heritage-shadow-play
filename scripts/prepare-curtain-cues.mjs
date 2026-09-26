import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const directory = new URL('../public/assets/cues/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', directory), 'utf8'));
const hash = (data) => createHash('sha256').update(data).digest('hex');
await mkdir(new URL('sources/', directory), { recursive: true });
for (const source of manifest.sources) {
  const destination = new URL(source.file, directory);
  const existing = await readFile(destination).catch(() => null);
  if (existing && hash(existing) === source.sha256) continue;
  const response = await fetch(source.downloadUrl, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`${source.title}: HTTP ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length !== source.bytes || hash(data) !== source.sha256) throw new Error(`${source.title}: source changed; review before updating the manifest.`);
  await writeFile(destination, data);
}
for (const cue of manifest.cues) {
  const destination = new URL(cue.file, directory);
  const existing = await readFile(destination).catch(() => null);
  if (existing && hash(existing) === cue.sha256) {
    console.log(`Verified: ${cue.title}`);
    continue;
  }
  const source = manifest.sources.find((item) => item.id === cue.sourceId);
  const temporary = new URL(`${cue.file}.part.mp3`, directory);
  try {
    const result = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', fileURLToPath(new URL(source.file, directory)), '-af', cue.filter, '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', '-map_metadata', '-1', fileURLToPath(temporary)], { encoding: 'utf8', windowsHide: true, timeout: 60000 });
    if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr);
    const data = await readFile(temporary);
    if (hash(data) !== cue.sha256) throw new Error(`${cue.title}: encoding differs; use ${manifest.processingTool} or review the new output before updating its hash.`);
    await rename(temporary, destination);
    console.log(`Prepared: ${cue.title}`);
  } finally { await rm(temporary, { force: true }) }
}
