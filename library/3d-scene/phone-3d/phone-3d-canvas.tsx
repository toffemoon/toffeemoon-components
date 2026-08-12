"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import {
  Box3,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
  VideoTexture,
} from "three";
import type { MotionValue } from "motion/react";

/* 演示区 3D 手机(2026-07-28 五版·终局:"直接替换手机屏幕")。
   屏幕 = VideoTexture:贴在屏幕 mesh 上的循环视频 ——
   一台手机一块屏,无叠层。视频就绪前用静态贴图垫底(同素材首帧)。
   2026-08-02 起视频源改为显式传入(videoWebm/videoMp4):三大演示
   上屏的是雨钦提供的真实录屏(public/app/feature-*),不再由
   PhoneJourney segment 推导;素材管线 scripts/capture-journey.py 保留
   (?capture 裸页仍在,journey-* 素材留盘)。
   弃案史:drei Html 表面投影(双影,矩阵不可查)、双层交叉淡化
   (壳浏览器把两层叠罩渲染成多重曝光,雨钦实机截图),都别复活。
   模型:Sketchfab polyman Studio iPhone 15 Pro(CC-BY,页脚已署名)。
   坐标系:ry=0 朝背、ry=π 朝正面;必须 clone(true) 再归一化(useGLTF
   缓存单例,多台 canvas 直用会互相偷模型)。 */

const MODEL_URL = "/models/iphone.glb";
const SCREEN_MESH = "xXDHkMplTIDAXLN";

interface PhoneProps {
  progress: MotionValue<number>;
  underlay: string;
  /** WebM/VP9 首选源(Chrome 系 + 壳浏览器 + 无头测试环境) */
  videoWebm: string;
  /** H.264 后备源(Safari) */
  videoMp4: string;
  /** true = 手机在右列,入场从右侧转正(镜像编排) */
  mirror: boolean;
}

function PhoneModel({ progress, underlay, videoWebm, videoMp4, mirror }: PhoneProps) {
  const group = useRef<Group>(null);
  const { gl } = useThree();
  const { scene } = useGLTF(MODEL_URL);
  const underTex = useTexture(underlay);
  const screenMat = useRef<MeshStandardMaterial | null>(null);

  /* 屏幕视频:muted 自动播;canplay 后换上屏 */
  const [videoTex, setVideoTex] = useState<VideoTexture | null>(null);
  useEffect(() => {
    const v = document.createElement("video");
    // WebM/VP9 首选(Playwright 的开源 Chromium 不带 H.264,
    // mp4 只作为 Safari 后备)
    v.src = v.canPlayType('video/webm; codecs="vp9"') ? videoWebm : videoMp4;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    let t: VideoTexture | null = null;
    /* iOS 低功耗模式会拒掉 muted autoplay(WebKit 行为),届时屏幕停在
       首帧(与垫底图等价的优雅降级);首次触碰重试一次(Codex 复审 8-02) */
    const resume = () => {
      if (v.paused) v.play().catch(() => {});
    };
    const onCanPlay = () => {
      v.play().catch(() => {});
      window.addEventListener("pointerdown", resume, { once: true, passive: true });
      t = new VideoTexture(v);
      t.colorSpace = SRGBColorSpace;
      setVideoTex(t);
    };
    v.addEventListener("canplay", onCanPlay, { once: true });
    v.load();
    return () => {
      v.removeEventListener("canplay", onCanPlay);
      window.removeEventListener("pointerdown", resume);
      v.pause();
      v.removeAttribute("src");
      t?.dispose();
      setVideoTex(null);
    };
  }, [videoWebm, videoMp4]);

  useEffect(() => {
    if (!videoTex || !screenMat.current) return;
    screenMat.current.map = videoTex;
    screenMat.current.emissiveMap = videoTex;
    screenMat.current.needsUpdate = true;
  }, [videoTex]);

  /* 深克隆 + 归一化:量包围盒缩放到高 ≈2.6 个世界单位 */
  const normalized = useMemo(() => {
    const c = scene.clone(true);
    const box = new Box3().setFromObject(c);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const s = 2.6 / size.y;
    c.position.sub(center);
    c.scale.setScalar(s);
    c.position.multiplyScalar(s);
    return c;
  }, [scene]);

  useLayoutEffect(() => {
    /* 屏幕 UV 不吃 glTF 的 flipY=false 惯例(实测 180° 颠倒),保持默认 true;
       各向异性采样治斜视角下的糊 */
    underTex.flipY = true;
    underTex.colorSpace = SRGBColorSpace;
    underTex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    underTex.needsUpdate = true;
    const mat = new MeshStandardMaterial({
      map: underTex,
      emissive: new Color(0xffffff),
      emissiveMap: underTex,
      emissiveIntensity: 0.55,
      roughness: 1,
    });
    screenMat.current = mat;
    normalized.traverse((obj) => {
      if (obj instanceof Mesh && obj.name === SCREEN_MESH) {
        obj.material = mat;
      }
    });
  }, [normalized, underTex, gl]);

  /* 块内滚动进度 → 姿态:前 55% 行程从近背面(±150°)转正落定,
     指数平滑(≈6Hz)防生硬 */
  const dir = mirror ? -1 : 1;
  const RY_END = Math.PI;
  const RY_START = RY_END - dir * 2.6;
  const pose = useRef({ ry: RY_START, rx: 0.28, rz: dir * -0.1, y: -0.25 });

  useFrame((_, dt) => {
    if (!group.current) return;
    const raw = Math.min(1, Math.max(0, progress.get()));
    const p = Math.min(1, raw / 0.55);
    const e = 1 - Math.pow(1 - p, 3);
    const t = {
      ry: RY_START + (RY_END - RY_START) * e,
      rx: 0.28 * (1 - e),
      rz: dir * -0.1 * (1 - e),
      y: -0.25 * (1 - e),
    };
    const k = Math.min(1, dt * 6);
    const c = pose.current;
    c.ry += (t.ry - c.ry) * k;
    c.rx += (t.rx - c.rx) * k;
    c.rz += (t.rz - c.rz) * k;
    c.y += (t.y - c.y) * k;
    group.current.rotation.set(c.rx, c.ry, c.rz);
    group.current.position.y = c.y;

    if (import.meta.env.DEV) {
      // Playwright 验证探针:按素材分键,多 canvas 不互相覆盖
      const w = window as unknown as { __p3d?: Record<string, unknown> };
      (w.__p3d ??= {})[videoWebm] = { p: raw, ry: c.ry };
    }
  });

  return (
    <group ref={group}>
      <primitive object={normalized} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);

export default function Phone3DCanvas(props: PhoneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.6], fov: 32 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      {/* 金属机身没有环境反射就近乎纯黑(PBR 特性)。不用 preset HDRI
          (走 CDN,国内网络不赌),Lightformer 程序化生成录影棚环境 */}
      <Environment resolution={256}>
        <Lightformer
          intensity={4}
          position={[0, 4, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[9, 3, 1]}
        />
        <Lightformer intensity={1.6} position={[-4, 1, 2]} scale={[3, 6, 1]} />
        <Lightformer intensity={1.2} position={[4, 0, 1]} scale={[3, 6, 1]} />
        <Lightformer
          intensity={0.8}
          color="#37c2ba"
          position={[-2, -3, 3]}
          scale={[4, 2, 1]}
        />
      </Environment>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 6]} intensity={1.4} />
      <PhoneModel {...props} />
    </Canvas>
  );
}
