// 接线 shim ——  Card.jsx 里写的是 `import { Tag } from "./Tag"`(原项目里 Card 和 Tag 同目录)。
// 收进本库时按功能拆开了,这里把线接回去,不复制源码。真身在 ui/primitives/Tag.jsx。
export { Tag } from '../primitives/Tag.jsx'
