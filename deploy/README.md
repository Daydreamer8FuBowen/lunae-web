# tools.lunovaai.top 部署

- 静态站点：`/var/www/tools-lunovaai`，上传根目录构建出的 `dist/` 内容。
- 图片服务：`/opt/lunae-xuyu`，包含 `code1/package.json`、`server/`、`src/image-style.js` 和 `scripts/generate-images.mjs`，无需生产 npm 依赖。
- Node：`/opt/node-v22/bin/node`（22.x）。
- 服务环境文件：`/etc/lunae-xuyu.env`，权限 `root:www-data 0640`，由 Node 的 `--env-file` 加载。配置项参见 `code1/.env.example`，不要将真实值提交到 Git。
- 持久化生成图片和识别缓存：`/var/lib/lunae-xuyu/generated`。升级时保留，独立备份；用户收藏仍保存在各自浏览器。
- `xuyu-api.service` 安装到 `/etc/systemd/system/`，使用 `systemctl enable --now xuyu-api` 启动。
- `xuyu-api.nginx.conf` 安装到 `/etc/nginx/snippets/`，在该域名 HTTPS server 块中 include。主站继续使用 `try_files $uri $uri/ /index.html` 支持 React 路由。

发布前运行 `npm run lint`、`npm test`、`npm run build`。先备份站点和 Nginx 配置，再上传到暂存目录，检查资源完整性后切换静态站点。运行 `nginx -t` 成功后才 reload。接口只监听 127.0.0.1，拒绝非配置域名和跨站请求，不自动重试付费生成。

验证 `/tools` 第三张卡片、`/tools/xuyu` 直接访问、示例预览、收藏和 `/api/health` 返回 `configured: true`。测试使用模拟上游；真实生图需要服务商可用和余额充足。

回滚：恢复发布前站点目录和 Nginx 配置，检查后 reload；图片缓存不要删除。
