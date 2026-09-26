# 配乐收集与使用记录

核对与收集日期：**2026-09-26**。三首音频来自作者官网的免费下载版本，已随项目保存，可在戏台下方试听和切换。用途判断依据作者公布的乐器、情绪说明及数字皮影演出的需要；不把它们当作某个传统皮影流派的音乐史料。

## 已收集曲目

| 曲目 / 文件 | 作者 | 原文件实测时长 | 选择理由与建议 |
| --- | --- | --- | --- |
| Guzheng City / `guzheng-city.mp3` | Kevin MacLeod | 1:54 | 官网标注古筝、Dhol 打击乐，情绪明亮、放松；作为默认曲目，适合自由操偶与教学体验 |
| Imperial China Cinematic / `imperial-china-cinematic.mp3` | Shane Ivers | 3:22 | 官网描述古筝、二胡、尺八、打击乐与管弦乐；用于开场展示或较有气势的叙事段落 |
| Asian Drums / `asian-drums.mp3` | Kevin MacLeod | 2:19 | 官网描述打击乐、混响与紧张感；用于武戏、动作或戏剧冲突，避免作为所有场景的默认背景 |

官网显示的时长可能四舍五入或略有差异（如 Guzheng City 标注 1:53）；清单使用下载文件的实测时长。音乐不会自动随角色切换，选曲由观众决定。

## 来源与许可

- [Guzheng City 官方曲目页](https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN2100001)，ISRC USUAN2100001；[原始 MP3](https://incompetech.com/music/royalty-free/mp3-royaltyfree/Guzheng%20City.mp3)。
- [Imperial China Cinematic 官方曲目页](https://www.silvermansound.com/free-music/imperial-china-cinematic)，ISRC UKEZT1600019；[原始 MP3](https://www.silvermansound.com/wp-content/uploads/imperial-china-cinematic.mp3)。
- [Asian Drums 官方曲目页](https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100396)，ISRC USUAN1100396；[原始 MP3](https://incompetech.com/music/royalty-free/mp3-royaltyfree/Asian%20Drums.mp3)。

三首均按作者官网标注的 **[Creative Commons Attribution 4.0 International（CC BY 4.0）](https://creativecommons.org/licenses/by/4.0/)** 使用。许可允许分享、改编和商业使用；使用者须适当署名，提供许可链接并说明修改，不能暗示作者为项目背书。[Incompetech 授权说明](https://incompetech.com/music/royalty-free/licenses/) 和 Shane Ivers 曲目页提供了作者要求的署名信息。

收集过程未购买无署名授权，未抓取付费曲目或试听水印版。MP3 未剪辑、转码或改编；页面降低播放音量并启用整曲重复播放。循环接续不保证无缝。页面「音乐来源与署名」公开展示曲名、作者、原曲链接、许可和播放改动说明，部署时请保留。

## 可复制的项目署名

以下文字结合作者提供的署名格式，补充原曲与许可链接。用于 README、演示说明、录屏或视频片尾时保留使用到的曲目段落：

```text
Guzheng City — Kevin MacLeod (incompetech.com)
Source: https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN2100001
Licensed under Creative Commons: By Attribution 4.0 License
https://creativecommons.org/licenses/by/4.0/

Music: Imperial China Cinematic by Shane Ivers — https://www.silvermansound.com
Source: https://www.silvermansound.com/free-music/imperial-china-cinematic
Licensed under Creative Commons Attribution 4.0 International
https://creativecommons.org/licenses/by/4.0/

Asian Drums — Kevin MacLeod (incompetech.com)
Source: https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100396
Licensed under Creative Commons: By Attribution 4.0 License
https://creativecommons.org/licenses/by/4.0/

Modifications: Original MP3 files, unedited. Playback volume reduced and whole tracks repeated in the app.
```

## 获取、复核与换曲

`public/assets/music/manifest.json` 保存作者、来源、下载地址、许可、收集日期、大小、时长及 SHA-256。`npm run music:fetch` 验证本地音频，缺失或损坏时从记录地址下载；内容不匹配时停止，不会静默更新来源。三个本地文件合计 17,388,199 字节。

增换曲目时：先确认作者提供的可用许可，再保存音频；同步清单、`src/i18n.ts` 中的三语用途文案及本文。第一首是默认曲目。不要只替换一个同名 MP3 却继续沿用旧作者署名或校验值。

旧文件 `public/assets/theatre-music.wav` 已停用，保留原文件，其来源和许可尚未核实。音频清单的许可仅适用于这里记录的三首 MP3。

## 开幕与闭幕锣鼓音效

使用两段实际演奏的戏曲锣鼓，收集日期为 2026-09-26。开幕锣鼓在闭幕状态且手势冷却结束后，首次有效检测到握拳时立即播放；幕布仍需连续 8 帧握拳确认才打开。持续握拳不会重复播放，识别短暂丢失也不会重播，松开至少 500 ms 后可再次触发。闭幕锣鼓维持原时机：X 手势保持 3 秒确认后，随幕布开始合拢播放一次。音效尾音可以延续到幕布动作完成后。背景配乐在音效期间降低到设定音量的 20%，音效完成或停止时恢复。

| 用途 / 文件 | 原曲 | 截取区间 | 成品时长 |
| --- | --- | --- | --- |
| 开幕 / `curtain-opening.mp3` | 香港微音乐 1004「（仿）入场锣鼓」 | 0.78–4.78 秒 | 4 秒 |
| 闭幕 / `curtain-closing.mp3` | 香港微音乐 1031 大锣版，网站归类为下场音乐 | 24.10–28.55 秒 | 4.45 秒 |

来源：[1004 曲目与演奏者](https://hkmusicminiatures.com/2025/03/06/mm1004/)、[1031 大锣版曲目与演奏者](https://hkmusicminiatures.com/2025/03/06/mm1031/)。两首均由「一才鑼鼓 The Gong Strikes One」示范演奏：单皮鼓、小锣由林叶（LAM Yip）演奏，高音虎锣由龙乐欣（LUNG Lok Yun）演奏，中京钹由戴日辉（DAI Rihui）演奏。

该项目的[公眾領域聲明及版權指引](https://hkmusicminiatures.com/public-domain-dedication-statement-with-copyright-guidelines/) 将音乐作品按 CC0 献给公众领域，并单独明确允许示范录音的重混、转换、取样与商业使用，无需事先许可或署名。项目仍公开保留来源和演奏者记录。这两段属于戏曲锣鼓的数字戏台提示用法，不声称它们是华县皮影的专属开闭幕规程。

原录音保存在 `public/assets/cues/sources/`；成品位于 `public/assets/cues/`。处理包括截取、8 ms 淡入、结尾淡出、响度标准化至目标 -18 LUFS / 真峰值 -2 dB，以及 128 kbps / 44.1 kHz MP3 编码。完整源地址、演奏者、剪辑参数和校验值保存在该目录的 `manifest.json`。

```bash
npm run cues:prepare
```

成品已存在时该命令只验证，不需要 FFmpeg；成品缺失时先获取并校验原录音，再调用 FFmpeg 重建。交付文件使用 FFmpeg 8.1.2，其他编码器版本可能产生不同字节；脚本遇到校验差异会停止，不会静默替换成品。

两段成品合计 137,596 字节，会预加载以减少手势触发时的等待。静音、隐藏页面或回首页时立即中止；连续试听或触发另一段时停止前一段，不叠加播放。页面提供「试听开幕」「试听闭幕」按钮和加载失败提示。
