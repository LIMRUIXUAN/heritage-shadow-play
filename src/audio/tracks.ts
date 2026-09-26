import manifest from '../../public/assets/music/manifest.json';

export const musicTracks = manifest.tracks;
export const musicLicense = { name: manifest.license, url: manifest.licenseUrl };
export type MusicTrack = typeof musicTracks[number];

export function musicTrack(id: string): MusicTrack {
  return musicTracks.find((track) => track.id === id) ?? musicTracks[0];
}

export function musicUrl(track: MusicTrack): string {
  return `${import.meta.env.BASE_URL}assets/music/${track.file}`;
}
