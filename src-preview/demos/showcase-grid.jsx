import { useState } from 'react'
import { MuyanStage, MODELS } from '../muyan.jsx'
import ShowcaseGrid from '../../library/ui/showcase-grid/ShowcaseGrid.jsx'

export default function Demo() {
  const [fav, setFav] = useState({ 'cat-cafe': true })
  return (
    <MuyanStage scroll top pad={20}>
      <ShowcaseGrid
        models={MODELS}
        isFavorite={(m) => !!fav[m.id]}
        onToggleFavorite={(m) => setFav((f) => ({ ...f, [m.id]: !f[m.id] }))}
        onOpen={() => {}}
      />
    </MuyanStage>
  )
}
