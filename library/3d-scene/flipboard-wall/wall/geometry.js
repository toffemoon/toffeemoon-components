import * as THREE from 'three'

// 只管几何:一格长什么样、每格摆在哪。不碰材质、不碰时序。

/** 单块面板。用 Box 而不是 Plane,是为了让侧边金属框在翻转时真的能看见。 */
export function createPanelGeometry({ size, depth }) {
  return new THREE.BoxGeometry(size, size, depth)
}

/**
 * 算出整面墙的排布。
 * row 0 在最底下,和纹理 v 轴方向一致,这样格子位置和采样区块自然对齐。
 */
export function layoutCells({ cols, rows, size, gap }) {
  const step = size + gap
  const count = cols * rows

  const cells = new Float32Array(count * 2)
  const offsets = new Float32Array(count * 3)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col
      cells[i * 2] = col
      cells[i * 2 + 1] = row
      offsets[i * 3] = (col - (cols - 1) / 2) * step
      offsets[i * 3 + 1] = (row - (rows - 1) / 2) * step
      offsets[i * 3 + 2] = 0
    }
  }

  return {
    count,
    cells,
    offsets,
    width: cols * size + (cols - 1) * gap,
    height: rows * size + (rows - 1) * gap,
  }
}
