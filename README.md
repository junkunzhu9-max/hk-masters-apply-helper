# 港硕申请助手 · 暖棕橙金与 DeepSeek 问答版

面向已选好香港授课型硕士候选项目、被材料问题卡住的申请者。首页选择材料问题和当前状态，获取下一步；需要进一步说明时，可打开右下角 AI 申请助手。

2026-10-04 更新：按项目所有者的最新选择，恢复暖棕背景、橙金重点、暖白正文。保留手机 AI 独立面板、底部输入区及桌面浮窗。DeepSeek 官方 API 的服务端代码已完成，所有者已明确授权发送问题、最近对话与所选卡点。2026-10-05 已在本地 8768 通过一次真实网页问答验证；公网新版尚未验证。本次未提交、推送或部署。

## 用 Cursor 打开和本地运行

选择 **File → Open Folder**，打开 `/Users/aaron/Desktop/港硕申请助手`。无需 npm 安装，使用 Node.js 24（支持原生 fetch、AbortSignal 和 --env-file）。

在 Cursor 终端运行：

```sh
node scripts/dev.js
```

访问 [http://127.0.0.1:8768](http://127.0.0.1:8768)。没有服务端密钥时，免费工具仍可使用，AI 显示“暂未启用”。结束时按 Ctrl+C。

如需本地使用真实问答，复制 `.env.example` 为 `.env.local`，自己在 Cursor 中填入 `DEEPSEEK_API_KEY` 的值，然后运行：

```sh
node --env-file=.env.local scripts/dev.js
```

真实密钥只放在本地 `.env.local` 或 Vercel 服务端环境变量；不要贴到聊天、HTML、JS 或 GitHub。`.env.local` 已在 Git 忽略规则内。本地服务只监听本机地址，不能用 localhost 链接分享给别人。

现有 `http://127.0.0.1:8767/index.html` 静态预览可查看最新样式和免费工具；静态服务器不会执行 AI 服务端接口。双击 HTML 也只能检查静态功能。

## 文件结构

- 六个 HTML：`index.html`、`consult.html`、`services.html`、`sample.html`、`sample-detail.html`、`guide.html`。
- `assets/site.css`、`assets/site.js`：暖棕橙金样式及免费工具交互。
- `assets/assistant.css`、`assets/assistant.js`：AI 面板、上下文、发送与失败提示。
- `api/chat.js`：Vercel Node.js Function，服务端访问 DeepSeek 官方接口。
- `scripts/build-static.js`：将 11 个白名单公开文件复制至 `public/`。
- `scripts/dev.js`：本地静态页面与 AI 接口预览。
- `vercel.json`：构建、公开目录、40 秒函数时限。
- `.env.example`：空密钥模板；默认模型为 `deepseek-flash`。
- `.gitignore`：排除生成目录、真实环境文件、日志和系统文件。
- `08_材料核对与行动清单_V2样例.md`：原完整文字样例。

## 更新 GitHub 和 Vercel

先将本目录的完整源码更新到原仓库根目录。根目录应直接看到 `index.html`、`assets/`、`api/`、`scripts/` 和 `vercel.json`，不要额外套一层文件夹。不要上传 `.env.local`、生成的 `public/`、日志或 `.git/`。仅添加密钥不会让已部署的旧静态版本获得 AI 接口，必须上传新版代码并重新部署。

项目配置为：

| 项目 | 设置 |
| --- | --- |
| Root Directory | 仓库根目录 `./` |
| Application / Framework Preset | Other |
| Build Command | `node scripts/build-static.js` |
| Output Directory | `public` |
| Install Command | 无需依赖安装，留空 |
| Node.js | 24.x |

已有 `vercel.json`；核对 Vercel 中的手动覆盖设置与它一致。此前将 Build Command 留空、Output Directory 设为 `.` 的配置应改为上表。

在 Vercel 项目的 **Environment Variables** 中新增：

| Name | Value | Environments |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 自己的 DeepSeek 密钥 | Production；需要预览时也选 Preview |

保存后部署新版代码，或对新版执行 Redeploy。环境变量变更只影响新的部署。`DEEPSEEK_MODEL` 为可选项，未填写时使用 `deepseek-flash`。不要使用 `VITE_` 或 `NEXT_PUBLIC_` 前缀。

部署后先打开 `/api/chat`，应返回 `{"enabled":true}`；这仅表示密钥变量存在，不代表密钥有效、余额充足或模型请求成功。再从网页发送一条不含个人材料的测试问题，确认有真实回答，并检查手机 AI 的打开、发送、关闭。

上一版由所有者部署至 [Vercel 网站](https://hk-masters-apply-helper.vercel.app/)。本次修改只在本地保存，公网不会自动更新。

官方说明：[Vercel 环境变量](https://vercel.com/docs/environment-variables/managing-environment-variables)、[Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)、[构建与输出目录](https://vercel.com/docs/builds/configure-a-build)、[DeepSeek 官方 API](https://api-docs.deepseek.com/zh-cn/)。

## AI 交互与数据范围

打开面板仅向本站 `/api/chat` 检查配置状态；只有点击发送后，才将问题、最多三组最近成功对话及当前所选卡点交给 DeepSeek。总输入长度有限制，过长时移除较早的完整对话。没有材料文件上传；应用不写入聊天记录，刷新清空前端会话。

模型密钥只在服务端读取，官方请求地址固定。回答按纯文本显示。无密钥时禁用发送；调用失败、超时或频率过高时保留问题并给出提示。GET 检查配置不会调用模型。

问答限定材料推进、本站说明与人工试点范围；具体学校要求仍需官方资料确认，不提供未核实的截止日、资格结论或录取概率。模型回答不是学校核实结果。

服务端有每 IP、每实例 10 分钟最多 20 次请求的限制，以及输入和输出长度、超时限制。该限制不能覆盖 Vercel 的所有并行实例，同源校验也不是用户身份验证；费用仍取决于真实调用量和服务商账户设置。

## 免费工具和产品边界

免费定位不请求后端、不发送或保存选择。选好两项后，查看先做什么、找谁、完成依据，以及何时值得人工核对。可复制行动提示；咨询草稿可编辑、复制，不自动发送或保存。无 JavaScript 时仍可查看样例。

人工服务处于试点筹备阶段；人民币 199 元／次是尚待验证的拟试价，实际费用、交付日与反馈时间先确认。范围为 1 位申请者、1 个拟入学年度、最多 3 个已有候选项目与一次原项目、原清单反馈复核。

现有页面没有实际联系入口、材料上传、预约、支付、自动提醒或申请后台。材料获取、联系学校与申请提交由学生自行完成，不保证录取。陈同学的背景、材料与进度全部虚构；学校资料沿用 2026-10-03 核对结果，本次未重新核实。

先让真实申请者使用免费入口，比较原有工具是否已解决问题、后续是否推进、人工是否补足具体证据，以及核对耗时。价格、获客方式和人工服务价值仍待验证。

## 已完成验证

- 20 组服务端单元测试：配置、输入限制、官方请求、限流、输出和错误处理。
- 27 项本地端到端检查：真实本地接口配合模拟上游，检查卡点、连续对话、失败恢复、超时、密钥隔离。
- 135 项 AI 界面检查：手机与桌面布局、输入区、焦点、关闭、会话清空及模拟问答。
- 231 项免费功能回归：六页、多尺寸、材料状态、复制、手机菜单、样例及无 JavaScript 降级。

上述自动化回归使用模拟模型。2026-10-05，所有者配置本地密钥后，另在本地 8768 网站发送一次“成绩单还没拿到，先做什么？”的真实请求，已收到回答；这确认了本地网页、接口与模型的连通，不代表完整的任务质量验收。验证过程没有读取或显示密钥。Vercel 新版函数与手机真机软键盘尚未验收。旧版备份与历史交付包继续保留；最新代码以本目录和“暖棕橙金_DeepSeek接入版”源码包为准。
