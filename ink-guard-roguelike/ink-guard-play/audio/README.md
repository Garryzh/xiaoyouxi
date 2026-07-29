# 真·背景音乐（可选）

程序化 BGM 只能做到「像氛围」，做不到录音级。

若要真实配乐：把循环 mp3 放到本目录，并在 `src/game/audio.js` 的 `FILE_MAP` 取消注释，例如：

```js
export const FILE_MAP = {
  bgm_menu: '/audio/bgm_menu.mp3',
  bgm_none: '/audio/bgm_none.mp3',
  bgm_rain: '/audio/bgm_rain.mp3',
  bgm_moon: '/audio/bgm_moon.mp3',
  bgm_fire: '/audio/bgm_fire.mp3',
  bgm_snow: '/audio/bgm_snow.mp3',
  bgm_bell: '/audio/bgm_bell.mp3',
  bgm_mist: '/audio/bgm_mist.mp3',
  bgm_lantern: '/audio/bgm_lantern.mp3',
  bgm_boss: '/audio/bgm_boss.mp3',
};
```

建议：轻中国风 / 氛围循环，音量别盖过音效；每条约 1–2 分钟可无缝循环。
