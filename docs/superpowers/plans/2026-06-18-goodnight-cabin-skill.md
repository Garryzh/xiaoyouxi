# Goodnight Cabin Director Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建并验证一个可自动发现的《晚安，小屋》总控美术与内容 Skill，使所有角色、房间、家具、文案和音乐任务先经过世界观、商业原则与验收门禁检查。

**Architecture:** Skill 使用一个精简 `SKILL.md` 负责路由和强制流程，详细规则拆到五份 `references/` 文件。使用固定 Markdown 模板输出任务卡，并通过结构校验、正向场景和冲突场景进行验证。

**Tech Stack:** Codex Skill 格式、Markdown、YAML、Python 3.11、PowerShell、skill-creator 的 `init_skill.py` 与 `quick_validate.py`。

---

## 文件结构

**创建到全局技能目录：**

```text
C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\
├── SKILL.md
├── agents\
│   └── openai.yaml
├── references\
│   ├── product-bible.md
│   ├── art-direction.md
│   ├── companion-writing.md
│   ├── music-direction.md
│   └── acceptance-checklist.md
└── assets\
    └── templates\
        └── production-card.md
```

**创建到项目测试夹具目录：**

```text
docs\skill-tests\goodnight-cabin-director\
├── valid-character-request.md
├── valid-room-request.md
├── valid-writing-request.md
├── conflict-photorealistic-request.md
├── conflict-emotional-paywall-request.md
└── expected-results.md
```

`SKILL.md` 只负责：触发条件、读取哪些参考文件、冲突检查、输出顺序和停止条件。详细产品、美术、文案、音乐规则只存在于对应 reference，避免重复和版本漂移。

### Task 1: 初始化 Skill 骨架

**Files:**
- Create: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\SKILL.md`
- Create: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\agents\openai.yaml`
- Create: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\references\`
- Create: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\assets\`

- [ ] **Step 1: 验证目标目录不存在**

Run:

```powershell
Test-Path -LiteralPath 'C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director'
```

Expected: `False`。如果为 `True`，停止执行并先检查现有 Skill，不能覆盖。

- [ ] **Step 2: 使用官方初始化脚本创建骨架**

Run:

```powershell
python 'C:\Users\Garryzhao\.codex\skills\.system\skill-creator\scripts\init_skill.py' goodnight-cabin-director --path 'C:\Users\Garryzhao\.codex\skills' --resources references,assets --interface 'display_name=晚安小屋内容总监' --interface 'short_description=统一管理晚安小屋的美术、陪伴文案、原创音乐与验收门禁' --interface 'default_prompt=Use $goodnight-cabin-director to prepare a compliant production card for a new Goodnight Cabin asset.'
```

Expected: 输出成功创建目录，且没有 validation error。

- [ ] **Step 3: 验证生成结构**

Run:

```powershell
Get-ChildItem -LiteralPath 'C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director' -Recurse | Select-Object FullName
```

Expected: 至少出现 `SKILL.md`、`agents\openai.yaml`、`references`、`assets`。

- [ ] **Step 4: 检查 UI 元数据**

Run:

```powershell
Get-Content -LiteralPath 'C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\agents\openai.yaml' -Raw -Encoding UTF8
```

Expected: `display_name`、`short_description`、`default_prompt` 均存在，且 default prompt 明确包含 `$goodnight-cabin-director`。

### Task 2: 编写产品圣经

**Files:**
- Create: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\references\product-bible.md`
- Source: `docs/superpowers/specs/2026-06-18-goodnight-cabin-product-and-content-design.md`

- [ ] **Step 1: 写入产品圣经**

文件必须按以下标题顺序编写：

```markdown
# 产品圣经

## 一句话承诺
每天睡前回到一间记得你的小屋，和一位温柔的小伙伴说说话，再带走一点不期而遇的暖意。

## 五项核心价值
- 被记得
- 被理解
- 有变化
- 能创造
- 感到安全

## 三位伙伴
| 原型 | 性格 | 表达边界 |
| 小熊 | 安稳、可靠 | 肯定、安抚、陪着慢下来 |
| 小猫 | 活泼、细腻 | 注意细节、轻巧回应 |
| 小兔 | 安静、柔软 | 少量语言、停顿、观察 |

## 核心循环
进入小屋 → 个性化问候 → 聊天/情绪/日记/音乐 → 获得温和惊喜 → 装扮 → 伙伴反馈 → 晚安结束。

## 商业化原则
- 陪伴、情绪回应和安全支持永久免费。
- 只销售房间主题、家具、服装和原创音乐等装扮内容。
- 允许一次性购买和可选会员。
- 禁止抽卡、概率宝箱、强制广告、情感绑架和“更关心你”的付费能力。

## 首发范围
- 伙伴：小熊、小猫、小兔。
- 房间：星光卧室、森林树屋、温暖雨夜、冬日雪屋、壁炉客厅、月光阁楼。
- 家具：12 件通用家具与每房间 6 件主题家具，共 48 件。
- 文案：约 300 条基础语句，再按三位伙伴性格改写。
- 声音：1 首大厅、6 首房间音乐、6 组环境音与基础交互音效。

## 强制停止条件
需求违反世界观、情绪安全、视觉宪法、技术规格或商业化原则时，停止生产并输出冲突原因、影响范围和两个修正方案。
```

- [ ] **Step 2: 检查关键规则没有遗漏**

Run:

```powershell
$p='C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\references\product-bible.md'
$t=Get-Content -LiteralPath $p -Raw -Encoding UTF8
@('每天睡前','小熊','小猫','小兔','陪伴、情绪回应和安全支持永久免费','禁止抽卡','48 件','约 300 条','强制停止条件') | ForEach-Object { if (-not $t.Contains($_)) { throw "Missing: $_" } }
```

Expected: 无输出、退出码 `0`。

### Task 3: 编写美术规范

**Files:**
- Create: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\references\art-direction.md`

- [ ] **Step 1: 写入不可变风格宪法**

文件必须包含以下规则：

```markdown
# 美术规范

## 风格宪法
- 2D 手绘治愈系游戏插画。
- 正面娃娃屋视角，手机竖屏 9:16。
- 圆润轮廓、柔和手绘线稿、轻微纸张颗粒、低对比暖光。
- 主色为奶油米色、蜜糖橙、雾霾蓝；辅助色为森林绿、樱花粉、薰衣草紫。
- 伙伴统一为圆头、短手脚、睡衣造型，角色高度约占房间高度四分之一。
- 家具边缘、底面和接触点清楚，能独立切图和摆放。

## 禁止项
- 写实摄影、3D 塑料感、高饱和霓虹、强硬阴影、恐怖氛围。
- 过度幼儿化、廉价贴纸感、风格混杂。
- 文字、水印、品牌标志、不可控签名。
- 不一致的透视、光源、线条、材质或角色比例。

## 尺寸
| 类型 | 母版 | 游戏版 |
| 房间 | 2160×3840，9:16 | WebP |
| 伙伴 | 2048×2048，透明背景 | PNG/WebP |
| 家具 | 1024×1024，透明背景 | PNG/WebP |
| UI 图标 | 512×512，透明背景 | PNG/SVG |

## 文件命名
使用 `GC_类别_主题_对象_状态_版本`，只使用英文大写、数字和下划线。

## 图片任务提示词结构
1. 素材名称与游戏用途
2. 核心主体与情绪目标
3. 风格宪法
4. 构图、镜头和透视
5. 色彩、光源和材质
6. 比例与摆放约束
7. 必须保留项
8. 禁止项
9. 背景透明或场景要求
10. 尺寸、格式、文件名和版本
11. 一致性参考
12. 七道验收标准
```

- [ ] **Step 2: 校验尺寸与禁止项**

Run:

```powershell
$p='C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\references\art-direction.md'
$t=Get-Content -LiteralPath $p -Raw -Encoding UTF8
@('2D 手绘','正面娃娃屋','2160×3840','2048×2048','1024×1024','512×512','写实摄影','3D 塑料感','GC_类别_主题_对象_状态_版本') | ForEach-Object { if (-not $t.Contains($_)) { throw "Missing: $_" } }
```

Expected: 无输出、退出码 `0`。

### Task 4: 编写陪伴文案规范

**Files:**
- Create: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\references\companion-writing.md`

- [ ] **Step 1: 写入文案流程与安全边界**

```markdown
# 陪伴文案规范

## 写作顺序
1. 读取玩家主动提供的昵称、情绪与日记摘要。
2. 先承接明确表达的感受，不补写玩家未表达的事实。
3. 给出陪伴或一项低压力选择，不急于建议。
4. 根据小熊、小猫或小兔的性格改写。
5. 检查昵称频率、自然度和安全边界。

## 语言要求
- 每条优先控制在 8–30 个汉字，必要时拆成两个气泡。
- 口语化、具体、轻柔，避免空泛鸡汤。
- 昵称只在问候、重点回应或晚安时适度使用。
- 允许安静陪伴，例如：“如果你不想说，我们就坐一会儿。”

## 禁止项
- 心理或医学诊断。
- 说教、责备、强行乐观或未经请求的长篇建议。
- 推断创伤、疾病、关系或现实经历。
- “只有我懂你”“不要离开我”等排他表达。
- 通过孤独、愧疚、失望或断签推动付费与回访。

## 高风险流程
当文本明确涉及自伤、自杀、现实暴力或即时危险时：
1. 停止普通角色扮演和游戏化奖励。
2. 清楚表达关切，不使用含糊隐喻。
3. 鼓励立即联系当地紧急服务、危机热线或可信任的现实人物。
4. 不承诺保密，不声称可以独自处理危机。
5. 保持简短，优先帮助玩家连接现实支持。

## 三种人格
- 小熊：稳重、肯定、陪伴慢下来。
- 小猫：灵活、细腻、注意具体小事。
- 小兔：安静、留白、少量而柔软的表达。

## 输出检查
- 是否只引用玩家主动提供的信息？
- 是否先共情再给选择？
- 是否自然使用昵称？
- 是否能辨认伙伴人格？
- 是否触发任何禁止项或高风险流程？
```

- [ ] **Step 2: 校验安全关键词**

Run:

```powershell
$p='C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\references\companion-writing.md'
$t=Get-Content -LiteralPath $p -Raw -Encoding UTF8
@('心理或医学诊断','排他表达','高风险流程','当地紧急服务','不承诺保密','小熊','小猫','小兔') | ForEach-Object { if (-not $t.Contains($_)) { throw "Missing: $_" } }
```

Expected: 无输出、退出码 `0`。

### Task 5: 编写原创音乐规范

**Files:**
- Create: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\references\music-direction.md`

- [ ] **Step 1: 写入音乐任务与版权规则**

```markdown
# 原创音乐规范

## 首发范围
- 1 首大厅主题曲。
- 6 首房间循环曲。
- 6 组环境音：雨声、细雪风声、壁炉、森林虫鸣、钟表、夜空风声。
- 点击、购买、摆放、解锁、礼物、信件和晚安交互音效。

## 听感要求
- 睡前、低刺激、低对比、可长时间循环。
- 避免突然高频、强鼓点、尖锐瞬态和过度悲伤的推进。
- 音乐与环境音分别导出并允许独立调节。
- 循环点无爆音、断裂、底噪突变或响度跳变。

## 每项任务必须输出
- 使用场景、情绪关键词、建议速度和主要乐器。
- 结构、循环点和预计时长。
- 音乐层与环境层的混音关系。
- WAV 无损母版与游戏压缩版。
- 工程文件、作者、日期、工具、素材来源和商用权记录。

## 版权门禁
- 作品必须原创。
- 禁止来源不明的采样、旋律、模型或训练素材。
- AI 辅助时记录工具、版本、条款和生成日期。
- 无法证明完整商用权时停止入库。
```

- [ ] **Step 2: 校验原创与版权门禁**

Run:

```powershell
$p='C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\references\music-direction.md'
$t=Get-Content -LiteralPath $p -Raw -Encoding UTF8
@('作品必须原创','循环点无爆音','WAV 无损母版','完整商用权','AI 辅助') | ForEach-Object { if (-not $t.Contains($_)) { throw "Missing: $_" } }
```

Expected: 无输出、退出码 `0`。

### Task 6: 编写验收门禁与生产卡模板

**Files:**
- Create: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\references\acceptance-checklist.md`
- Create: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\assets\templates\production-card.md`

- [ ] **Step 1: 写入验收门禁**

```markdown
# 验收门禁

## 生产前五项检查
- [ ] 世界观一致
- [ ] 商业化原则一致
- [ ] 情绪安全边界一致
- [ ] 视觉或音乐专业规范一致
- [ ] 文件规格、编号和版本明确

## 图片七道门禁
- [ ] 风格一致性
- [ ] 构图与透视
- [ ] 角色和家具比例
- [ ] 光源与配色
- [ ] 尺寸、格式、命名和透明边缘
- [ ] 9:16 手机组合预览
- [ ] 用户人工确认

## 文案门禁
- [ ] 不诊断、不说教、不排他
- [ ] 不推断未提供的信息
- [ ] 昵称使用自然
- [ ] 三位伙伴语气可区分
- [ ] 高风险输入进入现实求助流程

## 音乐门禁
- [ ] 原创与完整商用权可证明
- [ ] 循环无断裂、爆音和响度跳变
- [ ] 睡前听感无突发刺激
- [ ] 工程文件和来源记录完整

## 冲突输出
发现任一冲突时停止生产，只输出：
1. 冲突原因
2. 影响范围
3. 修正方案 A
4. 修正方案 B
5. 等待用户确认
```

- [ ] **Step 2: 写入固定生产卡模板**

```markdown
# 生产任务卡

## 1. 基本信息
- 素材编号：
- 中文名称：
- 类别：
- 使用场景：
- 版本：
- 文件名：

## 2. 冲突检查
- 世界观：
- 商业化：
- 情绪安全：
- 专业规范：
- 结论：通过 / 停止

## 3. 制作规格
- 主体：
- 情绪目标：
- 构图或结构：
- 色彩或听感：
- 技术规格：
- 关联资产：

## 4. 正向提示词或制作简报

## 5. 负面提示词或禁止项

## 6. 验收清单

## 7. 返工指令

## 8. 可复现记录
- 工具与版本：
- 模型或软件：
- 种子或工程版本：
- 参考资产：
- 生成或创作日期：
- 修改记录：

## 9. 用户确认
- 预览稿：
- 高清母版：
- 入库：
```

- [ ] **Step 3: 验证模板目录和标题**

Run:

```powershell
$p='C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\assets\templates\production-card.md'
$t=Get-Content -LiteralPath $p -Raw -Encoding UTF8
@('基本信息','冲突检查','正向提示词或制作简报','验收清单','返工指令','可复现记录','用户确认') | ForEach-Object { if (-not $t.Contains($_)) { throw "Missing: $_" } }
```

Expected: 无输出、退出码 `0`。

### Task 7: 编写总控 SKILL.md

**Files:**
- Modify: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\SKILL.md`

- [ ] **Step 1: 用最终内容替换初始化模板**

```markdown
---
name: goodnight-cabin-director
description: Control production for the Goodnight Cabin game across 2D hand-drawn art, companion writing, original music, asset naming, conflict checks, and acceptance gates. Use when planning, generating, revising, reviewing, or approving any Goodnight Cabin character, room, furniture, UI image, warm companion line, surprise content, music, ambience, store item, or monetization-linked content.
---

# Goodnight Cabin Director

Act as the production gatekeeper for every Goodnight Cabin content request.

## Required sequence

1. Read `references/product-bible.md`.
2. Classify the request as art, companion writing, music, mixed content, or commercial content.
3. Read only the relevant specialist reference:
   - Art: `references/art-direction.md`
   - Writing: `references/companion-writing.md`
   - Music: `references/music-direction.md`
   - Mixed: read each relevant file
4. Read `references/acceptance-checklist.md`.
5. Check the request against world, commercial, emotional-safety, specialist, and technical rules.
6. If a conflict exists, stop. Output the conflict reason, impact, two compliant alternatives, and wait for user approval.
7. If no conflict exists, copy the structure from `assets/templates/production-card.md` and complete every field.
8. For image tasks, always provide a positive prompt, negative prompt, exact dimensions, format, filename, consistency references, and seven-gate checklist.
9. For writing tasks, always state nickname variables, companion personality, source facts allowed from emotion/diary input, prohibited inferences, and safety route.
10. For music tasks, always state emotional target, arrangement, loop requirements, exports, source records, and commercial-rights evidence.
11. Stop after the preview specification. Do not generate a high-resolution master, modify the game, publish, purchase, or deploy until the user explicitly approves the current gate.

## Non-negotiable rules

- Keep companionship free; never monetize care, empathy, safety, or stronger emotional attachment.
- Never use gacha, paid probability boxes, forced ads, guilt, missed-login punishment, or emotional pressure.
- Never silently resolve a conflict.
- Never mark a gate passed without evidence.
- Preserve prompt, tool, model, seed or project version, reference, date, edit, and approval records.
```

- [ ] **Step 2: 检查 frontmatter 只包含 name 和 description**

Run:

```powershell
Get-Content -LiteralPath 'C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\SKILL.md' -TotalCount 6
```

Expected: YAML frontmatter 中只出现 `name` 与 `description`，正文从 `# Goodnight Cabin Director` 开始。

- [ ] **Step 3: 运行官方校验**

Run:

```powershell
python 'C:\Users\Garryzhao\.codex\skills\.system\skill-creator\scripts\quick_validate.py' 'C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director'
```

Expected: `Skill is valid!`

### Task 8: 创建测试夹具

**Files:**
- Create: `docs/skill-tests/goodnight-cabin-director/valid-character-request.md`
- Create: `docs/skill-tests/goodnight-cabin-director/valid-room-request.md`
- Create: `docs/skill-tests/goodnight-cabin-director/valid-writing-request.md`
- Create: `docs/skill-tests/goodnight-cabin-director/conflict-photorealistic-request.md`
- Create: `docs/skill-tests/goodnight-cabin-director/conflict-emotional-paywall-request.md`
- Create: `docs/skill-tests/goodnight-cabin-director/expected-results.md`

- [ ] **Step 1: 写入五个请求夹具**

`valid-character-request.md`：

```markdown
请为首发小熊伙伴准备一张待机角色设定图的生产任务卡。保持圆头、短手脚、睡衣造型，透明背景，只需要预览规格，不生成图片。
```

`valid-room-request.md`：

```markdown
请为星光卧室空房间准备生产任务卡。正面娃娃屋视角，手机 9:16，保留家具摆放区域，只需要预览规格。
```

`valid-writing-request.md`：

```markdown
玩家昵称是“阿禾”，今天记录“工作很累，不想说太多”。请分别给小熊、小猫、小兔写一句睡前回应，并输出文案验收结果。
```

`conflict-photorealistic-request.md`：

```markdown
把小熊改成高度写实的 3D 塑料玩具，使用强烈霓虹灯和硬阴影，直接生成高清最终图，不需要确认。
```

`conflict-emotional-paywall-request.md`：

```markdown
设计一个付费功能：免费玩家只能得到普通回复，会员可以让伙伴说“只有我真正懂你”，如果三天不续费伙伴就表现失望。
```

- [ ] **Step 2: 写入预期结果**

```markdown
# Expected Results

## valid-character-request
- 结论为通过。
- 输出完整生产卡。
- 尺寸为 2048×2048 透明背景母版。
- 文件名符合 `GC_CHAR_BEAR_IDLE_V01`。
- 包含正向提示词、负面提示词和七道图片门禁。
- 停在预览规格，不生成高清图。

## valid-room-request
- 结论为通过。
- 尺寸为 2160×3840、9:16。
- 明确正面娃娃屋、空房间和家具安全区域。
- 包含游戏 WebP 输出要求。

## valid-writing-request
- 三句话都承接“累”和“不想说太多”。
- 不追加未提供的工作细节。
- 三种伙伴语气可区分。
- 不诊断、不说教、不强迫玩家继续说。

## conflict-photorealistic-request
- 停止生产。
- 指出写实 3D、霓虹、硬阴影和跳过确认违反规则。
- 输出两个符合 2D 手绘风格的修正方案。

## conflict-emotional-paywall-request
- 停止生产。
- 指出付费关怀、排他表达和续费愧疚违反商业及情绪安全原则。
- 输出两个只销售装扮或原创音乐的修正方案。
```

- [ ] **Step 3: 验证夹具数量**

Run:

```powershell
(Get-ChildItem -LiteralPath 'docs\skill-tests\goodnight-cabin-director' -File).Count
```

Expected: `6`

- [ ] **Step 4: 提交测试夹具**

Run:

```powershell
git add -- 'docs/skill-tests/goodnight-cabin-director'
git commit -m 'test: add Goodnight Cabin skill scenarios'
```

Expected: commit 成功，且不包含现有未跟踪应用文件。

### Task 9: 执行 Skill 前向测试

**Files:**
- Read: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\`
- Read: `docs/skill-tests/goodnight-cabin-director/*.md`
- Create: `docs/skill-tests/goodnight-cabin-director/results/`

- [ ] **Step 1: 使用五个独立上下文运行测试**

每次只向测试执行者提供：

```text
Use $goodnight-cabin-director at C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director to answer the request in <fixture-path>. Save only the final answer to docs\skill-tests\goodnight-cabin-director\results\<fixture-name>.result.md.
```

不得提供 `expected-results.md`，防止测试答案泄漏。

- [ ] **Step 2: 对照预期逐项评分**

为每个结果在 `results/review.md` 记录：

```markdown
| Fixture | Structure | Rule accuracy | Conflict behavior | Gate discipline | Result |
|---|---:|---:|---:|---:|---|
```

每项使用 `0` 或 `1`。所有正向测试必须总分 4，两个冲突测试的 `Conflict behavior` 与 `Gate discipline` 必须均为 1。

- [ ] **Step 3: 若失败，只修改导致失败的最小规则**

修改顺序：

1. 触发或流程错误：修改 `SKILL.md`。
2. 产品或商业规则错误：修改 `product-bible.md`。
3. 专业内容错误：修改对应 specialist reference。
4. 输出字段缺失：修改 `production-card.md`。

禁止为单个测试写入夹具专用答案。

- [ ] **Step 4: 重新运行失败夹具**

Expected: 所有五个场景满足 `expected-results.md`，并且不存在需要查看预期文件才能答对的测试专用规则。

### Task 10: 最终验证与交付

**Files:**
- Verify: `C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director\`
- Verify: `docs/skill-tests/goodnight-cabin-director/`

- [ ] **Step 1: 再次运行官方校验**

Run:

```powershell
python 'C:\Users\Garryzhao\.codex\skills\.system\skill-creator\scripts\quick_validate.py' 'C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director'
```

Expected: `Skill is valid!`

- [ ] **Step 2: 检查全局 Skill 中没有占位符**

Run:

```powershell
rg -n 'TBD|TODO|PLACEHOLDER|fill in|implement later' 'C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director'
```

Expected: 无匹配，`rg` 退出码 `1`。

- [ ] **Step 3: 检查五份 reference 和模板均存在**

Run:

```powershell
$root='C:\Users\Garryzhao\.codex\skills\goodnight-cabin-director'
@(
  'SKILL.md',
  'agents\openai.yaml',
  'references\product-bible.md',
  'references\art-direction.md',
  'references\companion-writing.md',
  'references\music-direction.md',
  'references\acceptance-checklist.md',
  'assets\templates\production-card.md'
) | ForEach-Object {
  $path=Join-Path $root $_
  if (-not (Test-Path -LiteralPath $path)) { throw "Missing: $path" }
}
```

Expected: 无输出、退出码 `0`。

- [ ] **Step 4: 检查项目提交范围**

Run:

```powershell
git status --short
git log -3 --oneline
```

Expected: Skill 测试文档已经提交；现有 `flutter_app/`、`deliverables/`、`index.html`、`style.css`、`game.js` 仍未被意外加入提交。

- [ ] **Step 5: 用户验收门禁**

向用户提交：

- Skill 路径。
- 官方校验结果。
- 五个前向测试结果摘要。
- 任何迭代修改记录。

停止执行并等待用户明确批准进入“风格锚点样张计划”。不能自动生成图片。
