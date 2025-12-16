# LiteTravel Scrapers

小红书数据采集模块，集成 [MediaCrawler](https://github.com/NanmiCoder/MediaCrawler) 开源项目。

## ⚠️ 免责声明

本模块仅供学习和研究目的使用：
1. **禁止用于商业用途**
2. 遵守目标平台使用条款和 robots.txt 规则
3. 不得进行大规模爬取或对平台造成运营干扰
4. 合理控制请求频率
5. 不得用于任何非法用途

## 架构设计

```
scrapers/
├── xhs/                    # 小红书爬虫适配器
│   ├── adapter.py          # MediaCrawler 适配器
│   ├── config.py           # 爬虫配置
│   └── models.py           # 数据模型
├── integration/            # 与 travel-tool 后端集成
│   └── service.py          # 爬虫服务接口
└── README.md
```

## 技术方案

### 方案选择

采用 **MediaCrawler 集成方案**，原因：
1. 成熟稳定，已支持小红书平台
2. 基于 Playwright，无需 JS 逆向
3. 支持登录态缓存、IP 代理池
4. 社区活跃，持续更新

### 集成方式

1. **进程调用**: 通过 subprocess 调用 MediaCrawler
2. **结果解析**: 读取 MediaCrawler 输出的 JSON/CSV
3. **数据转换**: 转换为 travel-tool 统一 Schema

### 数据流

```
用户搜索关键词
    ↓
travel-tool Backend API
    ↓
ScraperService (integration/service.py)
    ↓
XhsAdapter (xhs/adapter.py)
    ↓
MediaCrawler (subprocess)
    ↓
解析结果 → 统一 Schema
    ↓
返回前端展示
```

## 使用方法

### 前置条件

1. 确保 MediaCrawler 已安装在 `../MediaCrawler/` 目录
2. 已完成 MediaCrawler 的依赖安装:
   ```bash
   cd ../MediaCrawler
   uv sync
   uv run playwright install
   ```

### 首次使用

需要先通过 MediaCrawler 完成小红书登录（扫码）：
```bash
cd ../MediaCrawler
uv run main.py --platform xhs --lt qrcode --type search
```

登录后会保存 cookie，后续可直接使用。

### API 调用

```python
from scrapers.integration.service import ScraperService

service = ScraperService()
results = await service.search_xhs(
    keyword="长沙美食",
    limit=20
)
```

## 配置说明

参见 `xhs/config.py` 中的配置项。

## 注意事项

1. **请求频率**: 默认间隔 2-5 秒，请勿调低
2. **登录态**: Cookie 有效期约 30 天，过期需重新扫码
3. **IP 风控**: 建议配置代理池，避免 IP 被封
4. **数据存储**: 爬取结果缓存到本地数据库，减少重复请求
