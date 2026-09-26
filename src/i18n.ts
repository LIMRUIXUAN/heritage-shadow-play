import type { Language } from './types';
import { musicLicense, musicTracks } from './audio/tracks';
import { curtainCues } from './audio/curtain-cues';

type Messages = Record<string, string>;
interface KnowledgeItem { title: string; body: string }

const messages: Record<Language, Messages> = {
  zh: {
    skip: '跳到戏台', title: '掌上皮影', landingStatus: '尚未入场', soundOn: '关闭声音', soundOff: '开启声音', debug: '显示摄像头调试画面', knowledge: '打开皮影小志', close: '关闭',
    roleLabel: '选择皮影角色', chooseRole: '选角', sheng: '生角', dan: '旦角', jing: '净角', stageLabel: '互动皮影戏台', makeFist: '握拳开幕', fistDetail: '握拳即响锣，保持片刻开幕', crossHands: '双手交叉成 X，保持 3 秒', crossDetail: '左右手越过身体中线后持续保持', holdingCross: '保持 X，还需 {seconds} 秒', localVision: '本机识别', workerVision: '后台识别', controlInspector: '控制检查器', mirrorView: '镜像画面', cameraView: '原始画面', showControl: '显示控制', showAll: '双手与身体', showLeft: '左臂', showRight: '右臂', armMapping: '手臂映射', naturalMapping: '自动', swappedMapping: '交换左右', waitingHands: '等待手部进入画面', leftControlsLeft: '检测左手 → 控制左臂', leftControlsRight: '检测左手 → 控制右臂', rightControlsRight: '检测右手 → 控制右臂', rightControlsLeft: '检测右手 → 控制左臂', leftRod: '左手杆', bodyRod: '身体杆', rightRod: '右手杆',
    privacy: '画面只在此设备处理，不会上传', retry: '重试摄像头', manualMode: '切换手动', cameraMode: '启用摄像头', heritage: '华县牛皮影戏 · 数字体验', landingTitle: '举手，唤醒一幕千年光影', landingIntro: '点击入场后允许使用摄像头。握拳开幕，双手操偶，双手交叉成 X 并保持 3 秒闭幕。', legendFist: '握拳开幕', legendMove: '双手操偶', legendCross: 'X 保持 3 秒', enter: '点击入场', enterNote: '启用摄像头与声音', enterManual: '无摄像头，使用操杆', archive: 'SHADOW PLAY ARCHIVE', knowledgeTitle: '皮影小志',
    initializing: '正在点亮戏台', closed: '等待握拳开幕', opening: '锣响，开幕', performing: '双手正在操偶', closing: '收势，闭幕', manual: '手动操杆模式', cameraError: '摄像头未就绪，已切换手动', loadingDetail: '正在加载本机手势模型', manualDetail: '拖动三根操杆演一出戏', noHands: '把双手举到镜头前', oneHand: '已见一只手，再举起另一只', twoHands: '双手已入镜',
  },
  en: {
    skip: 'Skip to the stage', title: 'Shadow play', landingStatus: 'Waiting at the gate', soundOn: 'Mute sound', soundOff: 'Turn sound on', debug: 'Show camera debug view', knowledge: 'Open the shadow play archive', close: 'Close',
    roleLabel: 'Choose a puppet role', chooseRole: 'Cast', sheng: 'Sheng', dan: 'Dan', jing: 'Jing', stageLabel: 'Interactive shadow theatre', makeFist: 'Make a fist to open', fistDetail: 'The gong sounds on detection; hold to open', crossHands: 'Make an X and hold for 3 seconds', crossDetail: 'Move both hands across the body centre and hold', holdingCross: 'Keep the X for {seconds} more seconds', localVision: 'On-device vision', workerVision: 'Worker vision', controlInspector: 'Control inspector', mirrorView: 'Mirror view', cameraView: 'Camera view', showControl: 'Show control', showAll: 'Both + body', showLeft: 'Left arm', showRight: 'Right arm', armMapping: 'Arm mapping', naturalMapping: 'Automatic', swappedMapping: 'Swap sides', waitingHands: 'Waiting for hands in frame', leftControlsLeft: 'Detected left → puppet left arm', leftControlsRight: 'Detected left → puppet right arm', rightControlsRight: 'Detected right → puppet right arm', rightControlsLeft: 'Detected right → puppet left arm', leftRod: 'Left rod', bodyRod: 'Body rod', rightRod: 'Right rod',
    privacy: 'Camera frames stay on this device', retry: 'Retry camera', manualMode: 'Use manual rods', cameraMode: 'Use camera', heritage: 'Huaxian leather shadow play · digital experience', landingTitle: 'Raise your hands and wake a thousand-year stage', landingIntro: 'Allow camera access after entering. Make a fist to open, move both hands to perform, then cross them into an X for 3 seconds to close.', legendFist: 'Fist to open', legendMove: 'Hands to perform', legendCross: 'Hold X for 3s', enter: 'Enter the theatre', enterNote: 'Enable camera and sound', enterManual: 'Use rods without a camera', archive: 'SHADOW PLAY ARCHIVE', knowledgeTitle: 'Notes on shadow play',
    initializing: 'Lighting the theatre', closed: 'Waiting for a fist', opening: 'The gong sounds', performing: 'Your hands lead the puppet', closing: 'Closing the curtain', manual: 'Manual rod mode', cameraError: 'Camera unavailable, manual mode is ready', loadingDetail: 'Loading the on-device gesture model', manualDetail: 'Drag the three rods to perform', noHands: 'Raise your hands into the frame', oneHand: 'One hand found, raise the other', twoHands: 'Both hands are in frame',
  },
  ms: {
    skip: 'Langkau ke pentas', title: 'Wayang bayang', landingStatus: 'Belum masuk', soundOn: 'Matikan bunyi', soundOff: 'Hidupkan bunyi', debug: 'Tunjukkan paparan kamera', knowledge: 'Buka catatan wayang bayang', close: 'Tutup',
    roleLabel: 'Pilih watak wayang', chooseRole: 'Watak', sheng: 'Sheng', dan: 'Dan', jing: 'Jing', stageLabel: 'Pentas wayang bayang interaktif', makeFist: 'Genggam untuk buka tirai', fistDetail: 'Gong berbunyi apabila genggaman dikesan; tahan untuk buka', crossHands: 'Buat bentuk X dan tahan 3 saat', crossDetail: 'Lintaskan kedua-dua tangan melepasi tengah badan', holdingCross: 'Kekalkan X selama {seconds} saat lagi', localVision: 'Pengecaman pada peranti', workerVision: 'Pengecaman latar', controlInspector: 'Pemeriksa kawalan', mirrorView: 'Paparan cermin', cameraView: 'Paparan kamera', showControl: 'Tunjuk kawalan', showAll: 'Kedua tangan + badan', showLeft: 'Lengan kiri', showRight: 'Lengan kanan', armMapping: 'Pemetaan lengan', naturalMapping: 'Automatik', swappedMapping: 'Tukar sisi', waitingHands: 'Menunggu tangan dalam bingkai', leftControlsLeft: 'Kiri dikesan → lengan kiri', leftControlsRight: 'Kiri dikesan → lengan kanan', rightControlsRight: 'Kanan dikesan → lengan kanan', rightControlsLeft: 'Kanan dikesan → lengan kiri', leftRod: 'Batang kiri', bodyRod: 'Batang badan', rightRod: 'Batang kanan',
    privacy: 'Imej kamera kekal pada peranti ini', retry: 'Cuba kamera lagi', manualMode: 'Guna batang manual', cameraMode: 'Guna kamera', heritage: 'Wayang kulit Huaxian · pengalaman digital', landingTitle: 'Angkat tangan dan hidupkan pentas seribu tahun', landingIntro: 'Benarkan kamera selepas masuk. Genggam untuk membuka, gerakkan kedua-dua tangan, kemudian bentuk X selama 3 saat untuk menutup.', legendFist: 'Genggam buka', legendMove: 'Tangan mengawal', legendCross: 'Tahan X 3 saat', enter: 'Masuk ke pentas', enterNote: 'Aktifkan kamera dan bunyi', enterManual: 'Guna batang tanpa kamera', archive: 'SHADOW PLAY ARCHIVE', knowledgeTitle: 'Catatan wayang bayang',
    initializing: 'Menyalakan pentas', closed: 'Menunggu genggaman', opening: 'Gong berbunyi', performing: 'Tangan anda mengawal wayang', closing: 'Menutup tirai', manual: 'Mod batang manual', cameraError: 'Kamera tidak tersedia, mod manual sedia', loadingDetail: 'Memuatkan model gerak isyarat pada peranti', manualDetail: 'Seret tiga batang untuk membuat persembahan', noHands: 'Angkat tangan ke dalam bingkai', oneHand: 'Satu tangan dikesan, angkat satu lagi', twoHands: 'Kedua-dua tangan dikesan',
  },
};

const knowledge: Record<Language, KnowledgeItem[]> = {
  zh: [
    { title: '一张皮，百种人', body: '传统皮影常以牛皮或驴皮雕刻、染色，再用关节铆钉连接。灯火穿过薄皮，色彩与刀痕才真正活起来。' },
    { title: '三根签，满台戏', body: '艺人通常以主杆稳定身体，再用手杆牵动双臂。这里把三根操纵杆映射为身体与双手的位置。' },
    { title: '唱念与锣鼓', body: '皮影的动作与唱腔、锣鼓密不可分。开幕锣声既是提示，也是把观众带入戏里的第一拍。' },
  ],
  en: [
    { title: 'One hide, a hundred characters', body: 'Traditional puppets are carved and dyed from prepared hide, then joined with tiny rivets. Light reveals both the colour and the knife work.' },
    { title: 'Three rods, a whole stage', body: 'A central rod steadies the body while two hand rods articulate the arms. This version maps those three controls to your body and hands.' },
    { title: 'Voice, gong and movement', body: 'Shadow play joins movement to singing and percussion. The opening gong is both a cue and the first beat of the performance.' },
  ],
  ms: [
    { title: 'Sekeping kulit, seratus watak', body: 'Wayang tradisional diukir dan diwarnakan daripada kulit yang diproses, kemudian disambung dengan rivet kecil. Cahaya menampakkan warna dan kesan ukiran.' },
    { title: 'Tiga batang, satu pentas', body: 'Batang tengah menstabilkan badan manakala dua batang tangan menggerakkan lengan. Versi ini memetakan kawalan itu kepada badan dan tangan anda.' },
    { title: 'Suara, gong dan gerakan', body: 'Wayang bayang menyatukan gerak, nyanyian dan perkusi. Gong pembukaan ialah isyarat serta rentak pertama persembahan.' },
  ],
};

const musicMessages: Record<Language, Messages> = {
  zh: { home: '回到首页', puppet: '皮影角色', musicSettings: '配乐设置', musicLabel: '配乐', musicVolume: '配乐音量', musicCredits: '音乐来源与署名', musicContext: '现代氛围配乐，用于数字体验，不是华县皮影传统唱腔录音。', musicSource: '原曲与下载', musicUse: '原始 MP3 未剪辑；播放时降低音量并重复整曲，接续处可能有停顿。', musicBlocked: '声音被浏览器拦截，请点击右上角声音按钮关闭后重新开启。', musicError: '配乐加载失败，可切换另一首或检查网络后重新开启声音。', 'guzheng-city': '古筝与打击乐：轻松操偶。', 'imperial-china-cinematic': '管弦乐与东方器乐：适合有气势的演出。', 'asian-drums': '鼓点与混响：适合武戏和紧张段落。' },
  en: { home: 'Return home', puppet: 'Shadow puppet', musicSettings: 'Music settings', musicLabel: 'Music', musicVolume: 'Music volume', musicCredits: 'Music sources & credits', musicContext: 'Modern atmosphere music for this digital experience; these are not traditional Huaxian shadow theatre recordings.', musicSource: 'Original track & download', musicUse: 'Original MP3, unedited. Playback volume is reduced and the whole track repeats; the repeat may have a pause.', musicBlocked: 'Audio was blocked. Toggle the sound button off and on to retry.', musicError: 'Music could not load. Choose another track or check your connection and toggle sound to retry.', 'guzheng-city': 'Guzheng and percussion for relaxed puppetry.', 'imperial-china-cinematic': 'Orchestral and East Asian colours for a grand performance.', 'asian-drums': 'Reverberant percussion for action and suspense.' },
  ms: { home: 'Kembali ke halaman utama', puppet: 'Watak wayang bayang', musicSettings: 'Tetapan muzik', musicLabel: 'Muzik', musicVolume: 'Kelantangan muzik', musicCredits: 'Sumber & kredit muzik', musicContext: 'Muzik suasana moden untuk pengalaman digital ini; bukan rakaman tradisional wayang kulit Huaxian.', musicSource: 'Lagu asal & muat turun', musicUse: 'MP3 asal tanpa suntingan. Kelantangan dikurangkan dan seluruh lagu diulang; mungkin ada jeda antara ulangan.', musicBlocked: 'Audio disekat. Matikan dan hidupkan semula butang bunyi untuk mencuba lagi.', musicError: 'Muzik gagal dimuatkan. Pilih lagu lain atau periksa sambungan dan cuba butang bunyi semula.', 'guzheng-city': 'Guzheng dan perkusi untuk persembahan santai.', 'imperial-china-cinematic': 'Orkestra dan warna Asia Timur untuk persembahan megah.', 'asian-drums': 'Perkusi bergema untuk aksi dan ketegangan.' },
};
for (const language of ['zh', 'en', 'ms'] as const) Object.assign(messages[language], musicMessages[language]);
Object.assign(messages.zh, { curtainCues: '幕布锣鼓', previewOpeningCue: '试听开幕', previewClosingCue: '试听闭幕', cueError: '锣鼓音效未能播放，请检查网络后重新试听。', 'curtain-opening': '开幕锣鼓 · 1004 片段', 'curtain-closing': '闭幕锣鼓 · 1031 大锣版片段', cueUse: '摘取实际演奏录音，剪辑、淡入淡出及音量处理；检测到握拳时播放开幕音效；X 保持 3 秒确认后播放闭幕音效。', cueContext: '开闭幕音效取自香港微音乐的戏曲锣鼓示范录音，包含鼓、锣和钹；此处作为数字戏台提示使用。' });
Object.assign(messages.en, { curtainCues: 'Curtain percussion', previewOpeningCue: 'Preview opening', previewClosingCue: 'Preview closing', cueError: 'The percussion cue could not play. Check your connection and preview again.', 'curtain-opening': 'Opening luogu · 1004 excerpt', 'curtain-closing': 'Closing luogu · 1031 gong excerpt', cueUse: 'Excerpts of recorded performances, edited with fades and loudness adjustment. Opening plays on fist detection; closing plays after a three-second X hold.', cueContext: 'Curtain cues use Chinese opera demonstration recordings from Hong Kong Music Miniatures, with drums, gongs and cymbals.' });
Object.assign(messages.ms, { curtainCues: 'Perkusi tirai', previewOpeningCue: 'Dengar pembukaan', previewClosingCue: 'Dengar penutupan', cueError: 'Bunyi perkusi gagal dimainkan. Periksa sambungan dan cuba dengar semula.', 'curtain-opening': 'Luogu pembukaan · petikan 1004', 'curtain-closing': 'Luogu penutupan · petikan gong 1031', cueUse: 'Petikan rakaman persembahan, disunting dengan pelarasan kelantangan. Bunyi pembukaan dimainkan apabila genggaman dikesan; penutupan selepas X ditahan 3 saat.', cueContext: 'Bunyi tirai menggunakan rakaman demonstrasi opera Cina daripada Hong Kong Music Miniatures, dengan dram, gong dan simbal.' });

export function t(language: Language, key: string): string { return messages[language][key] ?? messages.zh[key] ?? key }

export function applyLanguage(language: Language): void {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms' : 'en';
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => { element.textContent = t(language, element.dataset.i18n ?? '') });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((element) => { element.setAttribute('aria-label', t(language, element.dataset.i18nAria ?? '')) });
  document.querySelectorAll<HTMLButtonElement>('[data-language]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
  const container = document.querySelector<HTMLElement>('#knowledgeContent');
  if (container) container.replaceChildren(...knowledge[language].map((item) => {
    const article = document.createElement('article');
    const heading = document.createElement('h3');
    const body = document.createElement('p');
    heading.textContent = item.title;
    body.textContent = item.body;
    article.append(heading, body);
    return article;
  }));
  const credits = document.querySelector<HTMLElement>('#musicCreditsContent');
  const creditItems = [
    ...musicTracks.map((track) => ({ ...track, license: musicLicense.name, licenseUrl: musicLicense.url, isCue: false })),
    ...curtainCues.map((cue) => ({ ...cue, isCue: true })),
  ];
  if (credits) credits.replaceChildren(...creditItems.map((track) => {
    const article = document.createElement('article');
    const heading = document.createElement('h4');
    heading.textContent = track.isCue ? t(language, track.id) : track.title;
    const attribution = document.createElement('p');
    const artist = document.createElement('a');
    artist.href = track.artistUrl;
    artist.textContent = track.artist;
    const source = document.createElement('a');
    source.href = track.sourceUrl;
    source.textContent = t(language, 'musicSource');
    const license = document.createElement('a');
    license.href = track.licenseUrl;
    license.textContent = track.isCue ? 'Public domain / demo reuse terms' : track.license;
    for (const link of [artist, source, license]) { link.target = '_blank'; link.rel = 'noopener noreferrer' }
    attribution.append(artist, ' · ', source, ' · ', license);
    const detail = document.createElement('p');
    detail.textContent = track.isCue ? `${t(language, 'cueContext')} ${t(language, 'cueUse')}` : `${t(language, track.id)} ${t(language, 'musicUse')}`;
    article.append(heading, attribution, detail);
    return article;
  }));
}
