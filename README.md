# FlowTime

> A PWA focus timer with finite state machine architecture.

专注计时器，使用有限状态机管理工作流：idle → flow → paused → break。

## Features

- **Pure State Machine** — 状态逻辑与副作用分离，代码可预测、可测试
- **Session Recovery** — 页面刷新或浏览器关闭后自动恢复计时
- **PWA** — 可安装到桌面/主屏幕，离线使用
- **Break Recommendations** — 根据专注时长智能推荐休息时长
- **Statistics Dashboard** — 可视化专注数据（今日、本周、平均时长）
- **Task History** — 记录所有完成的专注任务
- **Browser Notifications** — 计时结束时通知提醒
- **Wake Lock** — 防止屏幕休眠

## Tech Stack

- **React 18** + TypeScript
- **Vite** — 构建工具
- **Tailwind CSS** — 样式
- **React Router** — 路由
- **Recharts** — 统计图表
- **vite-plugin-pwa** — PWA 支持

## Getting Started

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## State Machine

```
┌──────┐    START    ┌──────┐   PAUSE   ┌────────┐
│ idle │ ──────────►│ flow │ ────────►│ paused │
└──────┘            └──┬───┘           └───┬────┘
     ▲                  │                    │
     │                  │ FINISH             │ RESUME
     │                  ▼                    │
     │               ┌──────┐               │
     │               │ break│◄──────────────┘
     │               └──┬───┘
     │                  │ SKIP/EXPIRE
     └──────────────────┘
```

### States

| State | Description |
|-------|-------------|
| `idle` | 初始状态，输入任务名称 |
| `flow` | 专注中，计时进行 |
| `paused` | 暂停，计时暂停 |
| `break` | 休息中，独立倒计时 |

### Events

`START`, `PAUSE`, `RESUME`, `FINISH`, `SKIP`, `EXPIRE`, `RESTORE`, `DISMISS`

## Architecture

```
src/
├── types.ts              # AppState, AppEvent 类型定义
├── lib/
│   ├── fsm.ts            # 状态机 reducer（纯函数）
│   ├── time.ts           # 时间格式化和休息时长计算
│   ├── storage.ts        # localStorage 持久化
│   ├── notify.ts         # 浏览器通知
│   ├── history.ts        # 任务历史 CRUD
│   ├── stats.ts          # 统计数据计算
│   ├── audio.ts          # 音频反馈
│   └── wake_lock.ts      # 屏幕 Wake Lock
├── hooks/
│   ├── useTimerMachine.ts # 状态机 + 副作用
│   └── useRecovery.ts     # 启动时恢复会话
├── components/           # UI 组件
└── pages/
    ├── HomePage.tsx       # 主页（计时器）
    └── HistoryPage.tsx    # 历史记录（统计）
```

## Design Principles

- **状态逻辑是纯的，副作用在 hook 中隔离**
- **不要在 reducer 中混入副作用**
- 修改行为时：
  - 状态转换 → 修改 `fsmReducer`
  - 持久化/定时器/通知 → 修改 `useTimerMachine`

## License

MIT
