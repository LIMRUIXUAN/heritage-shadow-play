# 掌上皮影 · Gesture Shadow Play

用双手在浏览器里演一出皮影戏。项目以传统皮影的幕布、透光皮偶和三根操杆为视觉与交互灵感，使用本机手势识别控制生、旦、净三种角色；也可以直接用鼠标、触屏或键盘操杆。

这是面向文化展示、课堂体验和交互演示的数字作品。角色、动作和配乐属于数字化表达，未复刻某一流派的完整唱腔、剧目或演出技法。

## 功能一览

- **手势戏台**：握拳开幕，双手操偶，双手交叉成 X 并保持 3 秒闭幕。
- **三种角色**：生角、旦角、净角，可在演出中切换。
- **手动操杆**：摄像头或模型不可用时仍可演出；支持拖动及键盘控制。
- **三语界面**：中文、English、Bahasa Melayu，保存语言偏好。
- **音乐设置**：三首网络收集的背景配乐，以及开幕、闭幕两段实际演奏的锣鼓点；支持选曲、音量、静音、试听及公开来源说明。
- **控制检查器**：查看手部关键点、镜像画面、左右映射、UI FPS、AI FPS 和推理耗时。
- **设备端处理**：摄像头帧和手部关键点在浏览器处理，不上传、不录制，不申请麦克风。

## 快速开始

使用 **Node.js 22.12+（22.x）或 24.x LTS** 和 npm。版本要求来自本项目锁定的 Vite / Vitest 依赖，不需要后端、数据库或 API key。

在含有 `package.json` 的项目目录执行：

```bash
npm ci
npm run dev
```

打开 [http://localhost:5173](http://localhost:5173)。端口固定为 5173，已被占用时会报错，可以改用 `npm run dev -- --port 5174`。默认开发服务器监听局域网；只在本机使用时执行 `npm run dev -- --host 127.0.0.1`。

当前工作区根目录和 `heritage-shadow-play/` 各有一份可运行项目；后者含独立 Git 仓库。修改时确认所在目录，避免同时启动两份服务。本文、源码、音乐与配置已同步到两份目录。

## 怎么演一出戏

1. 点击「点击入场」，在浏览器提示中允许摄像头。首次手势模式需要联网下载模型与 WASM，初始化时会显示「正在点亮戏台」。
2. 把手举到镜头前，握拳保持片刻。首次有效识别到握拳就响起开幕锣鼓，连续 8 次识别后幕布打开；实际等待时间受识别速度影响。
3. 举起双手，缓慢移动控制左右臂；双手的中心位置与间距共同影响皮偶身体位置及大小。无需使用身体姿态识别。
4. 双手交叉成 X，保持两只手都在画面里，并持续 3 秒。进度条填满后，闭幕锣鼓响起、幕布合拢，松开再握拳可重新开幕。
5. 点击左上角品牌回到首页，会停止摄像头与配乐。开闭幕后有 1.2 秒的手势冷却，避免立刻重复触发。

保持正面光照、背景简洁，让手掌和手腕完整入镜；两只手短暂遮挡可能让闭幕计时重新开始。交叉判断依据手腕位置关系，不是对整条手臂或肘部的识别。

### 手动与键盘

首页点击「无摄像头，使用操杆」，或在戏台下方切换手动模式。三根操杆分别控制左臂、身体和右臂。手动模式直接开幕，不需要做开闭幕手势。

| 操作 | 作用 |
| --- | --- |
| 鼠标或手指拖动圆形操杆 | 调整对应部位的位置 |
| `Tab` 聚焦一根操杆，再按方向键 | 小幅移动该操杆 |
| `Shift` + 方向键 | 加大移动步幅 |
| `Home` | 将当前聚焦的操杆回中 |
| `Esc` | 关闭「皮影小志」弹窗 |

系统设置了减少动态效果时，幕布和闪光动画会缩短。手动模式提供摄像头之外的完整操作入口；画布目前不提供皮偶动作的文字描述。

### 声音与配乐

戏台下方可切换曲目、调节配乐音量；右上角「声 / 默」控制背景配乐和幕布锣鼓。初始配乐音量为 28%，滑杆只控制背景配乐。浏览器要求用户操作后才能播放声音。

开幕使用约 **4 秒**的入场锣鼓片段，闭幕使用约 **4.45 秒**的收场片段，取自香港微音乐「一才鑼鼓」实际演奏的单皮鼓、小锣、虎锣和钹。开幕锣鼓在首次有效检测到拳头时播放，幕布仍等连续 8 次识别后打开；闭幕保持 X 手势满 3 秒后，随幕布开始合拢播放。持续握拳只响一次，短暂识别丢失不会重播；松开至少半秒后可再次触发。若握拳未保持到确认门限，锣鼓已响，但幕布不会打开。播放完自动结束，其间背景配乐音量降至所设音量的 20%，结束后恢复。在手动或摄像头戏台中点击「试听开幕」「试听闭幕」即可试听，不会改变幕布状态。

音效采用该网站允许取样、改编及商业使用的示范录音，已剪辑并做淡入淡出、音量处理。[原始录音与处理记录](docs/MUSIC.md#开幕与闭幕锣鼓音效) 和 [网站使用声明](https://hkmusicminiatures.com/public-domain-dedication-statement-with-copyright-guidelines/) 说明了来源；它们不属于下表背景配乐的 CC BY 4.0 授权。

| 曲目 | 作者 | 建议场景 | 来源 |
| --- | --- | --- | --- |
| **Guzheng City**（默认） | Kevin MacLeod | 古筝与打击乐，适合轻松操偶 | [原曲 / 下载](https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN2100001) |
| **Imperial China Cinematic** | Shane Ivers | 东方器乐与管弦乐，适合较有气势的演出 | [原曲 / 下载](https://www.silvermansound.com/free-music/imperial-china-cinematic) |
| **Asian Drums** | Kevin MacLeod | 鼓点、混响与紧张氛围，适合武戏段落 | [原曲 / 下载](https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100396) |

以上是对作者所述乐器、情绪与项目用途的选曲判断，均为现代氛围配乐，不是华县皮影传统录音。三首均使用作者官网提供的 **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)** 版本：可用于包括商业项目在内的使用，但须保留作者、来源、许可链接和改动说明。完整署名见 [音乐说明](docs/MUSIC.md) 及网页「音乐来源与署名」。

音频为随项目部署的原始 MP3，合计约 17.4 MB；页面只设置当前曲目的元数据预加载，不同时请求三首完整音频。整曲重复播放，未制作无缝循环，因此曲尾与曲首可能有停顿。页面隐藏时暂停配乐，再次可见且仍在体验中时恢复。

音频已经收集到 `public/assets/music/`。验证本地文件或重新获取缺失文件：

```bash
npm run music:fetch
npm run cues:prepare   # 校验幕布音效；缺失时下载原录音并用 FFmpeg 重建
```

下载脚本依据清单中的字节数和 SHA-256 校验，已存在且正确的文件不会重复下载。上游文件发生变化时会停止并要求人工复核。旧 `theatre-music.wav` 保留在素材目录，当前页面不使用；其来源、许可未核实。

幕布音效已随项目保存，正常运行和构建不需要 FFmpeg；重建缺失音效需要 FFmpeg（本次使用 8.1.2）。隐藏页面、静音或返回首页会立即停止锣鼓，返回页面不会重播刚才的锣鼓片段。

## 开发、验证与部署

```bash
npm test              # 手势、动作、状态机、音频、摄像头生命周期
npm run build         # TypeScript 检查 + Vite 生产构建
npm run preview       # 本地预览 dist，通常为 http://localhost:4173
```

将完整的 `dist/` 部署到支持 **HTTPS** 的静态托管服务。构建输出包含图片、MP3 和识别 Worker；不需要 Node.js 生产服务器。不要只上传 `index.html`。`preview` 用于本地验收，不是生产服务。

部署到子路径，例如 `/shadow-art/`：

```bash
npm run build -- --base=/shadow-art/
```

图片与音乐使用 Vite 的 `BASE_URL`，托管端也必须把产物放在相应子路径。首次手势初始化仍需访问 jsDelivr 和 Google 模型存储，因此生产构建不等于完全离线应用。

使用当前 Chromium 系浏览器进行演示（如 Chrome / Edge）；项目需要 Web Worker、WebAssembly、OffscreenCanvas、createImageBitmap 和 Canvas 2D。其他浏览器或移动设备请按 [验收清单](docs/TESTING.md) 实测，无法加载识别能力时使用手动模式。[摄像头访问需要安全上下文](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)：本机 localhost 可以使用，手机通过普通局域网 HTTP 地址访问通常不能启用摄像头。

## 常见问题

| 现象 | 处理方式 |
| --- | --- |
| 摄像头不可用 | 确认网页权限、操作系统权限、设备是否被其他软件占用，以及是否使用 localhost / HTTPS；也可直接手动操杆 |
| 初始化失败或很久没有完成 | 检查到 jsDelivr / Google 存储的网络连接；模型加载超过 30 秒会进入手动回退；恢复网络后点击「重试摄像头」 |
| 一直停留在摄像头权限提示 | 浏览器可能一直等待你的选择；允许、拒绝或关闭提示后再操作，不要只等待模型加载 |
| 握拳或 X 没有触发 | 查看「瞳」控制检查器，确认双手关键点稳定入镜；让手腕分开，避免遮挡，等待手势冷却结束 |
| 左右手感觉反了 | 打开「瞳」，在「手臂映射」选择「交换左右」；「镜像画面」只改变预览，不改变控制映射 |
| 配乐没有声音 | 检查系统输出、页面音量及静音状态；点击声音按钮关闭后重新开启；若显示加载失败，检查 MP3 是否部署完整或切换曲目 |
| 触屏拖杆时页面滚动 | 操杆按钮已禁用原生触摸滚动；从圆形按钮上开始拖动 |
| 图片或音乐 404 | 检查 `dist/assets/` 是否完整；子路径部署须设置正确的 `--base` 并与托管路径保持一致 |

## 文件与实现

```text
index.html                     页面结构与入口
src/main.ts                    交互、渲染循环、手动控制与状态协调
src/i18n.ts                    中文 / 英语 / 马来语文案及音乐署名
src/experience/machine.ts      入场、开闭幕、演出和错误恢复状态
src/vision/adapter.ts           摄像头获取、Worker 通信与生命周期
src/vision/recognizer.worker.ts MediaPipe 手部推理
src/vision/gestures.ts          握拳稳定门限与 X 手势计时
src/puppet/pose-controller.ts   手部输入到动作、平滑与丢失手部处理
src/puppet/rig.ts               角色纹理、关节与 Canvas 绘制
src/audio/audio-engine.ts      背景配乐、幕布锣鼓、偏好与音量协调
src/audio/curtain-cues.ts      开闭幕音效清单与部署路径
src/audio/tracks.ts             音乐清单与部署路径
public/assets/                 三种皮偶纹理、旧音频
public/assets/music/           三首 MP3 与来源 / 校验清单
public/assets/cues/            开闭幕锣鼓、原始录音与剪辑清单
scripts/download-music.mjs     可复现的音乐获取与校验
scripts/prepare-curtain-cues.mjs 锣鼓源文件校验与音效重建
docs/MUSIC.md                  配乐选择、授权与署名
docs/TESTING.md                手动验收与验证记录
```

渲染采用 `requestAnimationFrame`，识别由 Worker 执行；主线程每隔至少 66 ms 请求一次推理，且不叠加未完成请求。AI FPS 会随设备性能变化，不保证固定 15 FPS。握拳置信度门限为 0.65、连续 8 帧，X 保持时间为 3000 ms；参数位于 `src/vision/gestures.ts`。

## 隐私、素材与许可边界

摄像头申请使用 `audio: false`。摄像头帧只在本地转换成 ImageBitmap，传给本地 Worker；没有上传帧、关键点或录制的代码，也未集成分析 SDK。切换手动、回首页或初始化失败会停止摄像头轨道；页面隐藏时停止发起推理，但摄像头仍保持连接，要释放设备请切换手动或回首页。

联网加载的外部资源是 MediaPipe WASM（`cdn.jsdelivr.net`）与手势模型（`storage.googleapis.com`）；它们用于下载识别能力。语言、选曲、音量和静音状态只保存到本站 `localStorage`，不可用时不影响基本体验。署名外链仅在点击后打开。

音乐和音效的许可分别记录，不自动覆盖代码、图片或模型。现有三张角色图集和旧 WAV 缺少可追溯的作者、生成或授权记录，本项目未对它们声明开源许可。若对外再分发，请为这些既有素材补齐实际来源信息。项目目前也没有整体代码 LICENSE；不要把第三方音乐的 CC BY 4.0 理解成整个项目的许可。

相关资料：[MediaPipe Gesture Recognizer](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js)、[Vite](https://vite.dev/guide/)、[Vitest](https://vitest.dev/guide/)。
