import manifest from '../../public/assets/cues/manifest.json';

export type CurtainCueKind = 'opening' | 'closing';
export const curtainCues = manifest.cues.map((cue) => ({
  ...cue,
  artist: manifest.artist,
  artistUrl: manifest.artistUrl,
  sourceUrl: manifest.sources.find((source) => source.id === cue.sourceId)!.sourceUrl,
  license: manifest.license,
  licenseUrl: manifest.licenseUrl,
}));

export const curtainCueUrl = (file: string): string => `${import.meta.env.BASE_URL}assets/cues/${file}`;
