import { MuyanStage } from '../muyan.jsx'
import AnimatedList from '../../library/ui/animated-list/animated-list.tsx'
import '../../library/ui/animated-list/animated-list.css'

const items = [
  { id: 1, content: '糖沐把杯子擦了第三遍。' },
  { id: 2, content: '门口的风铃响了一下,没人进来。' },
  { id: 3, content: '雨小了些,但还没停。' },
  { id: 4, content: '你翻开桌上那本没写完的册子。' },
  { id: 5, content: '第一页只有一行字:今天也没等到。' },
]

export default function Demo() {
  return (
    <MuyanStage>
      <div style={{ width: 420 }}>
        <AnimatedList items={items} autoAddDelay={1800} maxItems={5} />
      </div>
    </MuyanStage>
  )
}
