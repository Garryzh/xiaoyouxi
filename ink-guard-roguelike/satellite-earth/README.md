# OrbitLive · 全球卫星实时追踪

CelesTrak TLE + satellite.js SGP4 · 纯前端 3D 地球实时演示。

## 原理

1. 优先加载内置 `data/catalog.tle` 快照（离线可用）
2. 后台按分组从 [CelesTrak](https://celestrak.org/NORAD/elements/) 刷新（避免被 403 的超大 `active`/`starlink` 整包）
3. 用 [satellite.js](https://github.com/shashwatak/satellite-js) 在浏览器内做 SGP4 推算
4. 每帧更新卫星位置 → **实时运动来自本地物理计算，不轮询 API**

## 运行

```bash
cd satellite-earth
npx serve -l 5174 .
```

打开 http://localhost:5174  

需要能访问 CelesTrak（若浏览器 CORS 拦截，会自动尝试公共代理）。

## 功能

- Starlink / OneWeb / 空间站 / GNSS / 气象等分组开关
- ISS 轨道线 + 地面覆盖圈
- 时间：现在 / 暂停 / 1×–1000×
- 地球贴图、大气辉光、星空、Additive 卫星点云

## 技术

- Three.js r178 + OrbitControls
- satellite.js 5
- localStorage TLE 缓存（TTL 2h）
