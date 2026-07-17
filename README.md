# zzglab_web_frontend_build
用你的codex帮我们改进网页！克隆到本地仓库修改了以后请通过Pull Request回传修改文件至本仓库 ^ ^

# zzglab.com 部署与维护手册

> 最后实测：2026-07-15（Asia/Tokyo）  
> 本文依据 `lab04` 当前状态、生产公网响应和本地源码逐文件 SHA-256 核对结果编写。  
> 本文不记录 Cloudflare API 密钥、Tunnel Token 或其他凭据。

## 1. 当前部署状态

### 1.1 项目性质

- 网站：<https://zzglab.com>
- 类型：纯静态中英文多页面网站
- 无构建框架、数据库、后端 API、登录或上传功能
- 生产服务器：`lab04`
- 生产根目录：`/home/4-CC/changshengjie/lab-web-build`

### 1.2 当前实测值

| 项目 | 当前值 |
|---|---|
| 当前生产版本 | `20260712T182121Z` |
| `current` 实际目标 | `releases/20260712T182121Z` |
| 当前生产文件数 | 40 |
| 当前版本大小 | 约 4.0 MB |
| 部署目录总大小 | 约 12 MB |
| 数据盘可用空间 | 约 4.2 TB |
| Nginx | `active`、`enabled` |
| Docker | `active`、`enabled` |
| Nginx 监听 | `127.0.0.1:18088`，不直接开放公网 80/443 |
| Nginx 配置检查 | 通过 |
| Tunnel 容器 | `cloudflared-lab-web-build`，`running`，重启次数 0 |
| Tunnel 重启策略 | `unless-stopped` |
| 源站健康检查 | `ok` |
| 公网健康检查 | `ok` |
| 本地源码与生产版本 | 40 个文件 SHA-256 完全一致 |

当前保留三个版本：

```text
20260712T175030Z
20260712T181608Z
20260712T182121Z  <- current
```

### 1.3 实际请求链路

```text
访客
-> Cloudflare DNS / TLS / CDN / HTML Cache Rule
-> Cloudflare Tunnel: lab-web-build
-> Docker: cloudflared-lab-web-build
-> Nginx: 127.0.0.1:18088
-> /home/4-CC/changshengjie/lab-web-build/current
-> releases/<版本号>
```

公网实测：

- 正式页面、CSS、JavaScript、Logo 均返回 `200`
- HTML 首次可出现 `REVALIDATED` 或 `MISS`，随后为 `HIT`
- HTML 响应为 `Cache-Control: no-cache`，但 Cloudflare 边缘 Cache Rule 仍可缓存 HTML
- `/health` 为 `CF-Cache-Status: DYNAMIC`，响应正文为 `ok`

## 2. 本地应该编辑哪些文件

所有网站内容都应在以下目录修改：

```text
/home/user/Documents/Codex/2026-07-11/q
```

不要直接修改服务器上的 `current` 或已有 `releases/<版本号>`。已有 release 应视为不可变版本，否则无法可靠回滚和核对哈希。

### 2.1 页面内容

| 英文文件 | 中文文件 | 用途 |
|---|---|---|
| `index.html` | `zh/index.html` | 首页 |
| `team.html` | `zh/team.html` | 团队及 Zuguo Zhao 介绍 |
| `research.html` | `zh/research.html` | 实验研究、分子模拟、生物信息三大方向 |
| `facilities.html` | `zh/facilities.html` | 科研平台与设施 |
| `projects.html` | `zh/projects.html` | 项目、成果和按年份排列的论文 |
| `join.html` | `zh/join.html` | 招募、加入流程和联系方式 |

修改页面时注意：

- 英文和中文是两套独立 HTML，需要同步修改。
- 保留 canonical、Open Graph、结构化数据中的 `https://zzglab.com`。
- 新外链使用完整 HTTPS 地址；新窗口链接保留 `rel="noopener"`。
- 联系邮箱由 JavaScript 复制，不要重新增加 `mailto:`。
- 论文作者统一为“名字在前、姓氏在后”，名字和姓氏之间用空格。

### 2.2 全站样式与行为

| 文件 | 用途 |
|---|---|
| `styles.css` | 全站视觉系统、Claude 风格悬浮导航、响应式布局、焦点和动效 |
| `script.js` | 移动导航、邮箱复制、语言菜单、年份与页面动效 |
| `language-init.js` | 页面加载前恢复语言偏好，避免语言闪烁和切换失效 |

如果修改 `styles.css`、`script.js` 或 `language-init.js`，必须同步更新 12 个 HTML 中对应资源的查询版本，例如：

```html
<link rel="stylesheet" href="styles.css?v=20260715-01">
<script src="language-init.js?v=20260715-01"></script>
<script src="script.js?v=20260715-01"></script>
```

这一步用于绕过浏览器和 Cloudflare 中旧的 CSS/JavaScript 缓存。三个文件可使用同一个新版本字符串。

### 2.3 图片、Logo 与字体

```text
assets/
assets/fonts/
```

- 替换图片时尽量保留原文件名和合理尺寸，可避免同时修改多个 HTML。
- 新增图片后必须在 HTML 中使用相对路径，例如 `assets/example.jpg`。
- 不要把科研照片替换为生成图片。
- 删除资源前先搜索所有 HTML、CSS 和 JavaScript，确认不存在引用。

### 2.4 SEO 与爬虫文件

| 文件 | 何时修改 |
|---|---|
| `sitemap.xml` | 新增、删除或重命名正式页面时 |
| `robots.txt` | 爬虫策略变化时，一般无需修改 |

### 2.5 不应发布的目录

以下内容是设计过程或临时产物，不属于生产网站：

```text
outputs/
work/
```

构建发布目录时必须显式排除它们。

## 3. 修改后的本地检查

### 3.1 启动本地服务器

```bash
python3 -m http.server 8123 --bind 127.0.0.1
```

浏览：

```text
http://127.0.0.1:8123/
http://127.0.0.1:8123/zh/
```

至少人工检查：

- 6 个英文页面和 6 个中文页面
- 桌面、平板、手机宽度
- 顶部悬浮导航和移动菜单
- 页脚 Language 下拉菜单及跨页面语言保持
- “联系邮箱 / 点击即可复制邮箱地址”是否复制 `talent@zzglab.com`
- 页面锚点、所有外链、Logo、图片和字体
- 键盘 Tab、焦点状态及 `prefers-reduced-motion`
- 浏览器控制台和 Network 中无 404 或 JavaScript 错误

### 3.2 基础静态检查

```bash
# 不应出现旧邮箱、mailto、已删除校徽或旧复制浮层
rg -n '850194283@qq\.com|admin@zzglab\.com|mailto:|gdmu-emblem|copy-hint' \
  --glob '*.html' --glob '*.css' --glob '*.js' .

# 检查正式域名是否混入其他域名
rg -n 'canonical|og:url|zzglab\.com' --glob '*.html' .

# 核对中英文正式页面
find . zh -maxdepth 1 -name '*.html' -type f | sort
```

第一条命令正常情况下不应输出任何结果。结构化数据中的邮箱如需保留，应统一使用 `talent@zzglab.com`；若因此产生预期结果，应逐条人工确认。

## 4. 手动发布到 lab04

以下流程会创建新的不可变 release，校验 SHA-256 后原子切换 `current`。普通静态发布不需要修改 Nginx、Docker、Tunnel 或其他科研目录。

### 4.1 生成干净的生产构建目录

```bash
set -euo pipefail

SOURCE=/home/user/Documents/Codex/2026-07-11/q
BUILD=$(mktemp -d /tmp/zzglab-build.XXXXXX)

rsync -a --prune-empty-dirs \
  --include='/*.html' \
  --include='/styles.css' \
  --include='/script.js' \
  --include='/language-init.js' \
  --include='/robots.txt' \
  --include='/sitemap.xml' \
  --include='/assets/***' \
  --include='/zh/***' \
  --exclude='*' \
  "$SOURCE/" "$BUILD/"

find "$BUILD" -type f | sort
printf 'files='; find "$BUILD" -type f | wc -l
du -sh "$BUILD"
```

当前版本是 40 个文件。未来新增正式资源后文件数可以增加，但应确认增加项全部必要，并确保没有 `outputs/`、`work/` 或密钥文件。

### 4.2 生成版本号和发布前哈希

```bash
VERSION=$(date -u +%Y%m%dT%H%M%SZ)
ROOT=/home/4-CC/changshengjie/lab-web-build

(
  cd "$BUILD"
  find . -type f -print0 | sort -z | xargs -0 sha256sum
) > "/tmp/zzglab-$VERSION.local.sha256"

echo "$VERSION"
```

版本号使用 UTC 时间戳，例如 `20260715T010203Z`。

### 4.3 上传到新 release

```bash
# 在lab04上操作
test ! -e '$ROOT/releases/$VERSION' && mkdir -p '$ROOT/releases/$VERSION'
rsync -a --delete "$BUILD/" "lab04:$ROOT/releases/$VERSION/"
```

不要将文件直接覆盖到 `current`。

### 4.4 原子切换 current

```bash
set -e
cd '$ROOT'
ln -sfn 'releases/$VERSION' current.next
mv -Tf current.next current
printf '%s\n' '$VERSION' > DEPLOYED_RELEASE
readlink current
cat DEPLOYED_RELEASE
curl -fsS http://127.0.0.1:18088/health
```

预期：

- `current` 输出 `releases/$VERSION`
- `DEPLOYED_RELEASE` 输出新版本号
- 健康检查输出 `ok`

### 4.5 源站逐页检查

```bash
set -e
for path in \
  / /index.html /team.html /research.html /facilities.html /projects.html /join.html \
  /zh/index.html /zh/team.html /zh/research.html /zh/facilities.html /zh/projects.html /zh/join.html \
  /styles.css /script.js /language-init.js /assets/zhao-lab-logo.png
do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:18088$path")
  printf "%-45s %s\n" "$path" "$code"
  test "$code" = 200
done
```

### 4.6 清除 Cloudflare 缓存

每次发布或回滚后都必须执行：

```text
Cloudflare Dashboard
-> Caching
-> Configuration
-> Purge Cache
-> Purge Everything
```

不要把 Cloudflare Global API Key、API Token 或 Tunnel Token 写入源码、构建目录、命令历史、部署报告或本文。当前最可靠的人工方式是 Dashboard 全量清缓存。

### 4.7 公网 HTTPS 检查

```bash
for path in \
  / /team.html /research.html /facilities.html /projects.html /join.html \
  /zh/index.html /zh/team.html /zh/research.html /zh/facilities.html /zh/projects.html /zh/join.html \
  /styles.css /script.js /language-init.js /assets/zhao-lab-logo.png
do
  code=$(curl -sS -o /dev/null -w '%{http_code}' "https://zzglab.com$path")
  printf '%-45s %s\n' "$path" "$code"
done

curl -sI https://zzglab.com/ | grep -iE 'cf-cache-status|age|cache-control'
curl -sI https://zzglab.com/ | grep -iE 'cf-cache-status|age|cache-control'
curl -fsS https://zzglab.com/health
curl -sI https://zzglab.com/health | grep -i cf-cache-status
```

预期：

- 页面与资源全部为 `200`
- 清缓存后的首次 HTML 可能为 `MISS` 或 `REVALIDATED`
- 后续相同 HTML 请求应为 `HIT`
- `/health` 正文为 `ok`
- `/health` 的 `CF-Cache-Status` 为 `DYNAMIC`

还应使用桌面和手机浏览器真实打开公网版本，检查新样式确实加载、语言切换和邮箱复制正常。

### 4.8 更新部署报告并保留三个版本

部署验证成功后更新：

```text
/home/4-CC/changshengjie/lab-web-build/DEPLOYMENT_REPORT.md
```

至少更新：

- 核对日期
- 当前版本号
- 当前版本文件数和大小
- releases 列表
- 公网验证与缓存状态

先列出版本：

```bash
find /home/4-CC/changshengjie/lab-web-build/releases \
  -mindepth 1 -maxdepth 1 -type d -printf "%f\n" | sort
```

确认新版本稳定后，只保留最近三个有效版本。删除前必须确认目标不是 `current`，也不是计划保留的回滚版本。应明确填写旧版本名，不要使用未经检查的通配符：

```bash
rm -rf /home/4-CC/changshengjie/lab-web-build/releases/<明确的旧版本号>
```

最后清理本地临时构建目录：

```bash
rm -rf "$BUILD"
```

## 5. 回滚操作

### 5.1 查看可回滚版本

```bash
set -e
ROOT=/home/4-CC/changshengjie/lab-web-build
cat "$ROOT/DEPLOYED_RELEASE"
readlink "$ROOT/current"
find "$ROOT/releases" -mindepth 1 -maxdepth 1 -type d -printf "%f\n" | sort
```

### 5.2 原子回滚

将 `<目标版本号>` 替换为确认存在且有效的 release：

```bash
ROLLBACK=<目标版本号>
ROOT=/home/4-CC/changshengjie/lab-web-build

set -e
cd '$ROOT'
test -d 'releases/$ROLLBACK'
ln -sfn 'releases/$ROLLBACK' current.next
mv -Tf current.next current
printf '%s\n' '$ROLLBACK' > DEPLOYED_RELEASE
curl -fsS http://127.0.0.1:18088/health
readlink current
```

回滚后同样必须：

1. 在 Cloudflare Dashboard 执行 Purge Everything。
2. 检查全部正式页面和资源为 `200`。
3. 检查 HTML 随后进入 `HIT`，`/health` 保持 `DYNAMIC`。
4. 更新 `DEPLOYMENT_REPORT.md`。

## 6. 日常检查命令

### 6.1 网站与服务

```bash
curl -fsS https://zzglab.com/health
curl -sI https://zzglab.com/ | grep -iE 'cf-cache-status|age|cache-control'

systemctl is-active nginx docker
systemctl is-enabled nginx docker
curl -fsS http://127.0.0.1:18088/health
sudo nginx -t
```

### 6.2 Tunnel

```bash
sudo docker inspect cloudflared-lab-web-build \
  --format "status={{.State.Status}} restart={{.RestartCount}} policy={{.HostConfig.RestartPolicy.Name}}"

sudo docker logs --tail 100 cloudflared-lab-web-build
```

这些命令不会读取或输出 Tunnel Token。

### 6.3 版本与空间

```bash
set -e
ROOT=/home/4-CC/changshengjie/lab-web-build
cat "$ROOT/DEPLOYED_RELEASE"
readlink -f "$ROOT/current"
find "$ROOT/releases" -mindepth 1 -maxdepth 1 -type d -printf "%f\n" | sort
du -sh "$ROOT" "$ROOT"/releases/*
df -h /home/4-CC
```

## 7. 禁止事项

- 不直接编辑 `lab-web-build/current` 或已有 release。
- 不修改其他科研目录或其他 Docker 容器。
- 不开放公网 80/443；Nginx 保持监听 `127.0.0.1:18088`。
- 不读取、复制或传播 Tunnel Token。
- 不把 Cloudflare 密钥放进 HTML、JavaScript、Git、压缩包或 Markdown。
- 不因静态页面更新而重启 Docker、Nginx 或 Tunnel；正常发布只需新建 release 并切换符号链接。
- 不执行 `docker system prune -a`。
- 不使用 `rm -rf releases/*` 或未经确认的通配符清理版本。
- 不在未做 SHA-256 核对、源站检查和公网检查时宣布发布完成。

## 8. 最短操作清单

```text
1. 修改本地 q/ 中的 HTML、CSS、JS 或 assets
2. CSS/JS 有变化时更新 12 个 HTML 的 ?v= 缓存版本
3. 本地服务器逐页检查中英文、响应式、复制和语言切换
4. 构建只包含正式文件的临时目录
5. 创建 releases/<UTC 时间戳>
6. 上传并比较本地/远程 SHA-256
7. 原子切换 current，更新 DEPLOYED_RELEASE
8. 检查源站全部页面和资源
9. Cloudflare Purge Everything
10. 检查公网 HTTPS、HIT 和 /health DYNAMIC
11. 更新 DEPLOYMENT_REPORT.md
12. 保留最近三个有效版本
```
