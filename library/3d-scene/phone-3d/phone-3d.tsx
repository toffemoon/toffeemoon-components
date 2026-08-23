"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useScroll } from "motion/react";

/* 块级 3D 手机(2026-07-28 五版·终局:"直接替换手机屏幕")。
   单层架构:3D canvas 里的手机随块内滚动 ±150° 转正,屏幕 mesh 直接
   贴 VideoTexture。无第二层 DOM 叠罩 —— 双层交叉淡化在雨钦的壳浏览器上
   渲染成多重曝光,已弃。

   2026-08-02:屏幕素材从 PhoneJourney 预录循环换成真实录屏
   (雨钦提供,public/app/feature-*),视频源显式传入。窄屏/减动效
   fallback 随之从活 PhoneJourney 换成手机框里的同一段循环视频
   (减动效 = 静态首帧,不自动播)。PhoneJourney 组件留盘未删
   (?capture 裸页 + 素材管线仍指着它)。

   结构要点:滚动 hooks 都在 Canvas3D 里,而它只在 eligible 之后挂载 ——
   motion 的 useScroll 把观察绑在首帧的 ref 上,首帧返回 null 的话
   元素后补进 DOM 它不会重绑(Playwright 实测踩过)。
   门槛走 JS(matchMedia),不用 hidden/lg:block(壳浏览器兜底,
   见 index.css 注释)。 */

const Phone3DCanvas = lazy(() => import("@/components/phone-3d-canvas"));

export interface DemoPhone3DProps {
  /** 视频就绪前垫在屏幕 mesh 上的静态贴图(素材首帧,兼作 fallback poster) */
  underlay: string;
  videoWebm: string;
  videoMp4: string;
  mirror?: boolean;
  /** 3D 版描述(有"转过来"叙述) */
  alt: string;
  /** flat fallback 版描述(没有 3D 手机,不能沿用 alt) */
  altFlat: string;
  /** true = 鼠标自由旋转,不跟滚动(2026-08-23 加,组件库演示台用) */
  orbit?: boolean;
}

function VideoFallback({ underlay, videoWebm, videoMp4, altFlat }: DemoPhone3DProps) {
  /* 减动效:不自动播视频,退成静态首帧(内容不丢 —— 文字栏承载同一信息)。
     惰性初始化:effect 生效前那一帧也不许渲出 autoplay 视频(Codex 复审 8-02) */
  const [still, setStill] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStill(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* 进视口才播、离屏即停 —— 三段循环视频别在移动端常驻解码(Codex 复审 8-02)。
     IO 回调里的 play() 在 iOS 低功耗模式仍会被拒 → 退成 poster + 原生播放钮,可点 */
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (still) return;
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: "200px 0px 200px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [still]);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full max-w-[300px] rounded-[2.75rem] border border-line bg-panel p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
        {still ? (
          <img
            src={underlay}
            alt={altFlat}
            className="w-full rounded-[2.25rem]"
          />
        ) : (
          <video
            ref={videoRef}
            aria-label={altFlat}
            className="w-full rounded-[2.25rem]"
            muted
            loop
            playsInline
            preload="metadata"
            poster={underlay}
          >
            <source src={videoWebm} type="video/webm" />
            <source src={videoMp4} type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
}

function Canvas3D({ underlay, videoWebm, videoMp4, mirror = false, alt, orbit = false }: DemoPhone3DProps) {
  const boxRef = useRef<HTMLDivElement>(null);

  // 提前 600px 预挂载,让懒 chunk + 模型 + 屏幕视频在进入视口前加载完
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: "600px 0px 600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: boxRef,
    offset: ["start end", "end start"],
  });

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label={alt}
      className="h-[520px] w-full lg:h-[600px]"
    >
      {near && (
        <Suspense fallback={null}>
          <Phone3DCanvas
            progress={scrollYProgress}
            underlay={underlay}
            videoWebm={videoWebm}
            videoMp4={videoMp4}
            mirror={mirror}
            orbit={orbit}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function DemoPhone3D(props: DemoPhone3DProps) {
  /* 惰性初始化:桌面首帧直接进 3D,不再闪一帧 fallback 视频(白发三次
     视频请求);SSR/测试环境无 window → false 走 fallback 分支 */
  const [eligible, setEligible] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEligible(wide.matches && !still.matches);
    update();
    wide.addEventListener("change", update);
    still.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      still.removeEventListener("change", update);
    };
  }, []);

  return eligible ? <Canvas3D {...props} /> : <VideoFallback {...props} />;
}
