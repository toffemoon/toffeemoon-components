// 接线 shim —— primitives/index.js 这个桶文件里写了 `export { Card, CardShelf } from "./Card"`。
// Card 太大,收录时单列成 ui/card/,这里把桶补齐。
export { Card, CardShelf } from '../card/Card.jsx'
