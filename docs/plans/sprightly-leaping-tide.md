# FlowTime — 心流守护者（PWA 实施计划）

## Context（背景与目标）

**问题**：番茄钟以"25+5"硬性切片训练专注力，却以"强制打断"为代价——而心流（Flow）恰恰最怕被打断。Csikszentmihalyi 的心流九特征中，"行动-意识融合""时间感异常""自成目标"都要求一段不被打扰的连续体验；Sophie Leroy（2009）关于 *Attention Residue* 的研究则证实：每次任务切换都会留下"认知残渣"，恢复专注的成本远高于直觉。Flowtime 技术的核心是**正计时**——让用户跟随自身节奏工作到自然停止，从而保护心流的连续性。

**目标**：构建一个 Web PWA 形态的 FlowTime 工具，把"心流保护"作为一等公民来设计——默认正计时、专注期零通知、可暂停不打扰、状态在浏览器休眠后仍能恢复。

**范围（MVP）**：计时器 + 状态机 + 本地存储。不包含云同步、统计图表、番茄/正计时切换、HRV 接入（这些作为后续迭代）。

---

## 1. 学术与产品研究结论（指导设计的硬约束）

| 研究 / 来源 | 关键结论 | 对设计的指引 |
|---|---|---|
| Csikszentmihalyi, *Flow* (1990) | 心流九特征：清晰目标、即时反馈、挑战-技能平衡、行动-意识融合、专注当下、掌控感、自我意识丧失、时间感异常、自成目标 | 专注期界面要**极度简洁**（只显示任务+已用时间），避免抢走"意识-行动融合" |
| Sophie Leroy, *Attention Residue* (2009) | 任务切换后认知资源部分残留在前任务上，显著降低后续表现 | 专注期**禁止**任何弹窗/声音/视觉跳动；暂停是"用户主动"动作，不视为中断 |
| Mark Weiser, *Calm Technology* (1995) | 最深刻的技术是消失的；技术应处于环境而非中心 | 计时器是"环境"，不主动求关注；用 Notification API 而非 alert/modal |
| Flowtime vs Pomodoro | Flowtime 更利于深度工作与创造力，但更依赖自律；自主感不可缺 | MVP 之后要提供"模式选择"作为长期路线图 |
| HRV/可穿戴 心流检测 | 学术可行，商业产品未成熟 | **不在 MVP 范围**，仅在路线图中标注 |

---

## 2. 技术栈（已确认）

- **构建**：Vite 5+
- **框架**：React 18 + TypeScript
- **样式**：Tailwind CSS v3
- **状态机**：`useReducer` + `Context`（MVP 不引入 XState，避免依赖膨胀；状态机逻辑封装在 `lib/fsm.ts`，便于未来替换为 XState）
- **PWA**：`vite-plugin-pwa`（Workbox 底层）
- **持久化**：`localStorage`（MVP，单次会话的 5KB 内完全够用；后续统计图表迭代时再换 IndexedDB）
- **通知**：浏览器 `Notification` API
- **图标**：`lucide-react`（轻量、按需 tree-shake）

**为什么不用 XState（v5）**：MVP 状态机只有 4 状态、5 事件，`useReducer` 完全够用；引入 XState 反而需要 `xstate` + `@xstate/react` 两个包。`lib/fsm.ts` 把 reducer 设计成"接受纯事件、返回新状态"，未来替换为 XState 只需改 1 个文件。

---

## 3. 项目结构

```
D:\Code\Study\FlowTime\
├── public/
│   ├── favicon.svg
│   ├── pwa-192x192.png        # PWA 图标
│   └── pwa-512x512.png
├── src/
│   ├── main.tsx                # 入口
│   ├── App.tsx                 # 顶层布局
│   ├── index.css               # Tailwind 指令 + 全局样式
│   ├── components/
│   │   ├── TimerDisplay.tsx    # 大字号时间显示 + 圆环进度
│   │   ├── TaskInput.tsx       # 任务名输入（idle 状态）
│   │   ├── Controls.tsx        # 开始/暂停/结束 按钮组
│   │   ├── BreakPanel.tsx      # 休息面板
│   │   └── DoNotDisturbToggle.tsx
│   ├── hooks/
│   │   ├── useTimerMachine.ts  # 状态机 hook（封装 reducer + 副作用）
│   │   ├── useElapsed.ts       # 订阅状态机的"已用秒数"
│   │   └── useRecovery.ts      # 启动时从 localStorage 恢复未完成会话
│   ├── lib/
│   │   ├── fsm.ts              # 纯函数：状态机 reducer + 类型
│   │   ├── time.ts             # 时间格式化 (mm:ss / hh:mm:ss)、推荐休息时长
│   │   ├── storage.ts          # localStorage 读写包装（带时间戳、版本号）
│   │   └── notify.ts           # Notification API 封装（带权限请求、降级到无操作）
│   ├── types.ts                # 全局类型：Session, AppState, AppEvent
│   └── vite-env.d.ts
├── index.html
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts              # vite + vite-plugin-pwa 配置
└── package.json
```

---

## 4. 核心：状态机设计

### 4.1 类型定义（`src/types.ts`）

```typescript
export type AppState =
  | { status: 'idle'; draftTask: string }
  | { status: 'flow'; task: string; startedAt: number; elapsedBeforePause: number }
  | { status: 'paused'; task: string; elapsedAtPause: number }
  | { status: 'break'; task: string; flowDuration: number; breakEndsAt: number };

export type AppEvent =
  | { type: 'SET_DRAFT'; text: string }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'FINISH' }                 // flow → break
  | { type: 'SKIP_BREAK' }             // break → idle
  | { type: 'BREAK_DONE' };            // 由 setTimeout 派发

// 持久化只存最小信息，状态机启动时再组装
export interface PersistedSession {
  version: 1;
  status: 'flow' | 'paused';
  task: string;
  startedAt: number;                   // wall-clock 时间戳
  elapsedBeforePause: number;          // 累计已专注秒数（暂停前的）
}
```

### 4.2 reducer（`src/lib/fsm.ts`）

事件矩阵：

| 当前状态 \ 事件 | START | PAUSE | RESUME | FINISH | BREAK_DONE | SKIP_BREAK |
|---|---|---|---|---|---|---|
| idle | → flow | — | — | — | — | — |
| flow | — | → paused | — | → break | — | — |
| paused | — | — | → flow | — | — | — |
| break | — | — | — | — | → idle | → idle |

**关键不变量**：
- `flow` 状态下 `startedAt` 与 `elapsedBeforePause` 共同决定当前已用时间
- `paused` 状态下 `elapsedAtPause = elapsedBeforePause`，恢复时迁移到 `flow` 并保留 `elapsedBeforePause`
- `break` 状态下 `breakEndsAt` 来自 wall-clock，避免 setInterval 漂移

### 4.3 时间计算（关键）

```typescript
// 当前已用秒数（不依赖 setInterval 状态）
export function elapsedSec(s: Extract<AppState, { status: 'flow' }>): number {
  return s.elapsedBeforePause + (Date.now() - s.startedAt) / 1000;
}
```

**为什么用时间戳而非累加**：浏览器后台标签页 throttle / 设备休眠会导致 `setInterval` 漂移数十秒甚至数分钟；用 `Date.now()` 算差值 + 启动时从 localStorage 恢复，可实现"几乎不漂移"。

### 4.4 推荐休息时长（`src/lib/time.ts`）

```typescript
export function recommendBreakSec(flowSec: number): number {
  if (flowSec < 25 * 60) return 5 * 60;          // < 25min → 5min
  if (flowSec < 50 * 60) return 8 * 60;          // 25-50min → 8min
  if (flowSec < 90 * 60) return 12 * 60;         // 50-90min → 12min
  return 15 * 60;                                  // ≥ 90min → 15min (上限)
}
```

依据：番茄钟 5min 基线 + Flowtime 用户普遍反映 50min 区间后疲劳感上升的经验区间。

---

## 5. 计时器实现细节

### 5.1 单一全局 Interval（避免并发错误）

`useTimerMachine` 中维护一个 `useRef<NodeJS.Timeout | null>`；在状态进入 `flow` 时**先 `clearInterval` 再 setInterval**；进入 `paused` / `break` / `idle` 时 `clearInterval`；组件 unmount 时也 `clearInterval`。

`setInterval` 回调**只做一件事**：dispatch `TICK` 事件（仅当 status === 'flow' 时接收），更新 `elapsedBeforePause` 用于持久化与重渲染。

### 5.2 渲染策略

- 时间显示组件通过 `useElapsed()` hook 订阅状态机
- 内部用 `requestAnimationFrame` 或每秒 `setState` 更新一次显示（默认 1s 即可，毫秒级在专注时反成干扰）
- **不显示**倒计时、进度条上**不显示**百分比数字（避免"剩余 X 分钟"带来的时间焦虑，呼应"时间感异常"特征）

### 5.3 持久化（`src/lib/storage.ts`）

- 每次 `flow` / `paused` 状态变更时，把 `PersistedSession` 写入 `localStorage['flowtime.session']`
- **不**持久化 `break` 状态（休息是倒计时硬约束，跨标签页恢复无意义）
- App 启动时 `useRecovery()` 检查：若 localStorage 中存在未完成 `flow` / `paused`，**根据当前 wall-clock 重新计算** elapsed 注入状态机

```typescript
// 恢复 flow 时的关键计算
const recoveredElapsed = stored.elapsedBeforePause + (Date.now() - stored.startedAt) / 1000;
```

---

## 6. 通知策略（"通知而不打扰"的核心）

| 状态 | 系统通知 | 声音 | 视觉 |
|---|---|---|---|
| flow | ❌ 永不 | ❌ 永不 | 仅时间数字平滑增长（无动画/闪烁） |
| paused | ❌ | ❌ | 显示已用时间，不闪烁 |
| break | ✅ 仅在 `breakEndsAt` 到达时 1 次柔和通知 | 可选铃声 | 大字号倒计时；颜色由"专注红"切换为"休息绿" |
| idle | ❌ | ❌ | 显示任务输入框 + "开始" |

**Notification 权限请求时机**：仅在用户首次结束一段 ≥ 25min 的 flow、进入 break 状态**之后**请求；不在 idle 启动时索取（避免一上来就弹权限框破坏首次体验）。

**降级**：若 Notification 权限被拒绝，break 结束时不弹系统通知，但**仍用 `document.title` 闪烁 + 视觉提示**（标题前缀 `⏰ ` 切换 / 还原），保证用户能感知。

---

## 7. UI/UX 细节（呼应"平静技术"）

### 7.1 配色与情绪曲线

- **flow 状态**：低饱和暖色（参考 `#1f2937` 深灰底 + `#f87171` 柔和红数字），全屏沉浸感
- **break 状态**：低饱和冷色（`#065f46` 深绿底 + `#86efac` 薄荷绿数字），提示"松弛"
- **idle 状态**：中性灰白，任务输入框居中

### 7.2 专注界面（flow 状态）

```
+----------------------------+
|                            |
|   任务：撰写开发文档       |  ← 半透明顶部，淡入 200ms
|                            |
|        45 : 12             |  ← 主显，120px+，tabular-nums
|                            |
|   [  暂停  ] [  结束  ]    |  ← 半透明，hover 时加深
|                            |
+----------------------------+
```

- 默认隐藏任务输入框、按钮文字
- 鼠标移动 2s 内无活动 → 控件淡出（`opacity-0`），避免抢注意
- 进度环（圆环）作为可选"开关"：默认关；研究表明可视化进度提升任务坚持率 ~23%，但纯正计时不需要——**留给用户决定**

### 7.3 控件尺寸

- "开始" 按钮 ≥ 96×96px（让用户无需精确瞄准）
- 快捷键：`Space` = 暂停/继续，`Enter` = 结束

### 7.4 PWA 安装提示

- 检测到 `beforeinstallprompt` 事件后，温和地在设置区出现一个"安装到桌面"链接（**不弹横幅**）

---

## 8. PWA 配置（`vite.config.ts`）

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FlowTime',
        short_name: 'FlowTime',
        description: '心流守护者 — 保护你的深度专注',
        theme_color: '#1f2937',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
});
```

---

## 9. 验证（Verification）

### 9.1 编译与运行
```bash
cd "D:/Code/Study/FlowTime"
npm install
npm run dev          # 本地起 dev server，访问 http://localhost:5173
npm run build        # 产出 dist/，PWA 资源自动生成
npm run preview      # 预览生产构建，验证 Service Worker
```

### 9.2 手动测试用例（按优先级）

| # | 场景 | 预期 |
|---|---|---|
| 1 | 输入任务名 → 点击"开始" | 状态进入 flow；时间从 00:00 开始每秒 +1；按钮变为"暂停/结束" |
| 2 | flow 期间切到其他标签页 1 分钟再切回 | 时间准确显示已过 ~60s（验证 wall-clock 恢复） |
| 3 | flow 期间触发系统通知（如 IM 消息） | 应用本身不主动弹任何通知；时间显示不被打断 |
| 4 | flow 中点击"暂停" → 1 分钟后"继续" | 暂停时时间停止；继续后从暂停时累计值接续 |
| 5 | flow 中点击"结束" | 状态进入 break；倒计时显示 `recommendBreakSec()` 推荐值；颜色变绿 |
| 6 | break 倒计时归零 | 弹 1 次系统通知（若已授权）+ 标题闪烁 |
| 7 | 刷新页面 / 关闭浏览器再打开 | 若之前是 flow/paused，自动恢复并显示已用时间 |
| 8 | DevTools → Application → Local Storage 检查 | `flowtime.session` 键存在且结构正确 |
| 9 | 浏览器关闭再开 / 设备休眠 10 分钟后 | 恢复后已用时间正确累加（误差 < 1s） |
| 10 | 移动端浏览器添加到主屏 | 可作为独立应用启动，全屏运行 |

### 9.3 关键不变量测试（可在 `tests/` 目录添加，本次 MVP 不强制）
- `fsm.test.ts`：覆盖状态机所有合法/非法转换
- `time.test.ts`：`recommendBreakSec()` 各区间边界
- `storage.test.ts`：恢复时 wall-clock 计算正确性

---

## 10. 实施步骤（按推荐顺序）

1. **脚手架**：`npm create vite@latest . -- --template react-ts`；安装 tailwind、lucide-react、vite-plugin-pwa
2. **状态机核心**：`src/lib/fsm.ts`（纯函数 reducer + 类型）+ 单元自测
3. **持久化层**：`src/lib/storage.ts` + `src/hooks/useRecovery.ts`
4. **主 hook**：`src/hooks/useTimerMachine.ts`（reducer + 副作用 + interval 管理）
5. **UI 组件**：`TimerDisplay` → `TaskInput` → `Controls` → `BreakPanel` → 顶层 `App.tsx` 装配
6. **PWA 配置**：`vite.config.ts` + manifest 图标（用任意 192/512 PNG 占位即可）
7. **样式打磨**：配色、字号、hover/focus、键盘快捷键
8. **联调验证**：按 9.2 的 10 条用例逐项手测

---

## 11. 后续迭代路线图（非本次范围）

- v1.1：统计页（专注时长日历热力图） → 届时 `localStorage` 改 `IndexedDB`
- v1.2：番茄/正计时双模式切换（呼应"自主感不可缺"研究结论）
- v1.3：可选 HRV 接入（Web Bluetooth + 兼容设备）
- v2.0：跨设备同步（需要时再决定协议：自建 REST vs CRDT）

---

## 关键文件清单（修改/新增）

| 路径 | 用途 |
|---|---|
| `package.json` | 依赖：react, typescript, vite, tailwindcss, lucide-react, vite-plugin-pwa |
| `vite.config.ts` | Vite + PWA 配置 |
| `tailwind.config.ts` | 主题色（flow/break 配色） |
| `src/main.tsx`, `src/App.tsx` | 入口与顶层 |
| `src/types.ts` | AppState / AppEvent / PersistedSession |
| `src/lib/fsm.ts` | 状态机 reducer（核心） |
| `src/lib/time.ts` | 格式化 + 推荐休息时长 |
| `src/lib/storage.ts` | localStorage 包装 |
| `src/lib/notify.ts` | Notification 封装 |
| `src/hooks/useTimerMachine.ts` | 状态机 hook（连接 React 生命周期） |
| `src/hooks/useRecovery.ts` | 启动时恢复未完成会话 |
| `src/components/*.tsx` | UI 组件 |
| `public/pwa-192x192.png`, `public/pwa-512x512.png` | PWA 图标占位 |

---

*本计划基于用户决策（Web PWA / React+TS+Vite+Tailwind / MVP / 四种状态）整合心流学术研究、注意力残留、平静技术、Flowtime 实践与现代前端最佳实践。*
