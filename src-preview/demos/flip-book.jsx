import FlipBook from '../../library/ui/flip-book/FlipBook.jsx'

// 12 张样片:横横竖竖横横竖竖横横横横 —— 排出来正好 10 个展开面,带两处「竖图凑一面」。
// 故意每次渲染都新建数组:调用方通常就这么写,组件必须扛得住(内部按内容取键,不按数组身份)。
export default function Demo() {
  const photos = Array.from({ length: 12 }, (_, i) => ({
    src: `/flip-book/photo-${String(i + 1).padStart(2, '0')}.jpg`,
    alt: `样片 ${i + 1}`,
  }))

  return (
    <div
      className="stage stage--bleed"
      style={{ background: 'radial-gradient(120% 90% at 50% 20%, #e9ebe7 0%, #d8dcd8 100%)' }}
    >
      <FlipBook images={photos} />
    </div>
  )
}
