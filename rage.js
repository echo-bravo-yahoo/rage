import cheerio from 'cheerio'
import { writeFile } from 'node:fs/promises'

function tableToData($, table) {
  const row = $(table).find('tr').slice(1, 2)
  return {
    name: row.find('td:nth-of-type(1)').text().trim(),
    input: row.find('td:nth-of-type(2)').text().trim(),
    damage: row.find('td:nth-of-type(3)').text().trim(),
    guard: row.find('td:nth-of-type(4)').text().trim(),
    startup: row.find('td:nth-of-type(5)').text().trim(),
    active: row.find('td:nth-of-type(6)').text().trim(),
    recovery: row.find('td:nth-of-type(7)').text().trim(),
    onBlock: row.find('td:nth-of-type(8)').text().trim(),
    onHit: row.find('td:nth-of-type(9)').text().trim(),
    attackLevel: row.find('td:nth-of-type(10)').text().trim(),
    counterHitType: row.find('td:nth-of-type(11)').text().trim(),
    type: row.find('td:nth-of-type(12)').text().trim(),
    riscGain: row.find('td:nth-of-type(13)').text().trim(),
    riscLoss: row.find('td:nth-of-type(14)').text().trim(),
    wallDamage: row.find('td:nth-of-type(15)').text().trim(),
    inputTension: row.find('td:nth-of-type(16)').text().trim(),
    chipRatio: row.find('td:nth-of-type(17)').text().trim(),
    otgRatio: row.find('td:nth-of-type(18)').text().trim(),
    proration: row.find('td:nth-of-type(19)').text().trim(),
    invuln: row.find('td:nth-of-type(20)').text().trim(),
    cancel: row.find('td:nth-of-type(21)').text().trim(),
  }
}

const characters = [
  'Axl_Low',
  'Millia_Rage',
  'Testament',
  'Jack-O',
  'Nagoriyuki',
  'Chipp_Zanuff',
  'Sol_Badguy',
  'Ky_Kiske',
  'May',
  'Zato-1',
  'I-No',
  'Happy_Chaos',
  'Baiken',
  'Anji_Mito',
  'Leo_Whitefang',
  'Faust',
  'Potemkin',
  'Ramlethal_Valentine',
  'Giovanna',
  'Goldlewis_Dickinson',
  'Bridget'
]

async function loadData() {
  const promises = []
  characters.forEach((characterName) => {
    const promise = loadCharacterData(characterName)
    promise.then((data) => {
      return writeFile(`./frame-data/${characterName}.json`, JSON.stringify(data, null, 2))
    })
    promises.push(promise)
  })
  return Promise.all(promises)
}

async function loadCharacterData(characterName) {
  const res = await ((await fetch(`https://www.dustloop.com/w/GGST/${characterName}/Data`)).text())
  const $ = cheerio.load(res)
  const moves = []
  $('#mw-content-text table.wikitable tbody').each((i, table) => {
    moves.push(tableToData($, table))
  })
  return moves
}

loadData()
