# Goodnight Cabin Delivery Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement each approved phase plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已批准的《晚安，小屋》设计规格分阶段推进为可复用生产体系、完整内容资产、经过测试的 Flutter 产品和可公开测试版本。

**Architecture:** 采用七个串行门禁阶段。每个阶段有独立计划、可单独验收；下游阶段只能读取上游已批准的产物，不能绕过风格锚点、内容安全或用户确认门禁。

**Tech Stack:** Codex Skills、Markdown/JSON 素材清单、AI 辅助 2D 插画、原创音频工程、Flutter/Dart、Flutter Test、Web 构建、浏览器端验收、Netlify。

---

## 阶段与依赖

| 阶段 | 独立计划 | 主要产物 | 开始门槛 | 完成门槛 |
|---|---|---|---|---|
| 1 | Skill 建设 | `goodnight-cabin-director` 与五份规范 | 本规格已批准 | 校验通过、三类正向测试和两类冲突测试通过 |
| 2 | 风格锚点 | 三位伙伴、星光卧室、六件家具、首页组合图 | 阶段 1 通过 | 七道门禁通过、用户批准锚点 |
| 3 | 首发视觉资产 | 六房间、48 家具、伙伴动作与 UI | 阶段 2 通过 | 清单完整、手机组合测试通过 |
| 4 | 陪伴文案 | 约 300 条基础语句及三伙伴语气版本 | 阶段 1 通过 | 安全测试、变量测试、人格区分测试通过 |
| 5 | 原创声音 | 7 首音乐、6 组环境音、交互音效与版权档案 | 阶段 1 通过 | 循环、响度、定时、版权验收通过 |
| 6 | Flutter 集成 | 新手流程、娃娃屋、商店、惊喜、音乐与付费骨架 | 阶段 2、3、4、5 通过 | 单元、组件、集成、浏览器测试通过 |
| 7 | 封闭测试与部署 | 测试报告、修复版本、公开测试网址 | 阶段 6 通过 | 阻断问题为零、用户批准直接部署 |

## 计划文件顺序

1. `docs/superpowers/plans/2026-06-18-goodnight-cabin-skill.md`
2. `docs/superpowers/plans/2026-06-18-goodnight-cabin-style-anchor.md`
3. `docs/superpowers/plans/2026-06-18-goodnight-cabin-visual-assets.md`
4. `docs/superpowers/plans/2026-06-18-goodnight-cabin-companion-copy.md`
5. `docs/superpowers/plans/2026-06-18-goodnight-cabin-original-audio.md`
6. `docs/superpowers/plans/2026-06-18-goodnight-cabin-flutter-integration.md`
7. `docs/superpowers/plans/2026-06-18-goodnight-cabin-closed-beta.md`

除第一份计划外，其余计划在其上游产物验收后再编写。这样可以让后续计划引用真实文件名、真实图片尺寸和真实音频时长，避免用假设填充实施细节。

## 全局执行规则

- 每个阶段单独提交，不混入无关文件。
- 现有未跟踪的 `flutter_app/`、`deliverables/`、`index.html`、`style.css` 和 `game.js` 均视为用户现有工作；阶段 1 不修改它们。
- 每个生成资产必须保留提示词、模型、版本、种子、参考图和返工记录。
- 每个阶段末先运行自动检查，再执行人工确认。
- 未通过人工确认时，只允许返工当前阶段。
- “直接部署”只在阶段 7 且用户明确下达该指令后执行。

## 总体验收

- [ ] Skill 能稳定输出任务卡并阻止冲突需求。
- [ ] 风格锚点得到用户书面批准。
- [ ] 六套房间、48 件家具和 UI 资源全部登记且可追溯。
- [ ] 陪伴文案不诊断、不说教、不排他、不进行情感付费诱导。
- [ ] 音乐全部原创，版权链和工程文件完整。
- [ ] Flutter 全部自动化测试通过。
- [ ] 浏览器完成首次进入、每日循环、房间装扮、购买和恢复购买测试。
- [ ] 免费体验完整，核心陪伴不存在付费墙。
- [ ] 用户批准后通过 Netlify 返回公开测试网址。
