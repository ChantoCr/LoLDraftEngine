export interface DDragonChampionImage {
  full: string
  sprite: string
  group: string
  x: number
  y: number
  w: number
  h: number
}

export interface DDragonChampionInfo {
  attack: number
  defense: number
  magic: number
  difficulty: number
}

export interface DDragonChampionStats {
  hp: number
  hpperlevel: number
  mp: number
  mpperlevel: number
  movespeed: number
  armor: number
  armorperlevel: number
}

export interface DDragonChampionDataItem {
  version: string
  id: string
  key: string
  name: string
  title: string
  blurb: string
  info: DDragonChampionInfo
  image: DDragonChampionImage
  tags: string[]
  partype: string
  stats: DDragonChampionStats
}

export interface DDragonChampionCollectionResponse {
  type: 'champion'
  format: string
  version: string
  data: Record<string, DDragonChampionDataItem>
}
