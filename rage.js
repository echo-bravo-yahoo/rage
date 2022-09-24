import cheerio from 'cheerio'
import { writeFile, readFile } from 'node:fs/promises'

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
  $('#mw-content-text table.wikitable tbody').slice(1).each((i, table) => {
    moves.push(tableToData($, table))
  })
  return moves
}

const attackLevelData = {
  0: {
    hitstop: 11,
    standingHitstun: 12,
    crouchingHitstun: 13,
    blockstun: 9,
    airBlockstun: 'L+19',
    airInstantBlockstun: 'L+5'
  },
  1: {
    hitstop: 12,
    standingHitstun: 14,
    crouchingHitstun: 15,
    blockstun: 11,
    airBlockstun: 'L+19',
    airInstantBlockstun: 'L+5'
  },
  2: {
    hitstop: 13,
    standingHitstun: 16,
    crouchingHitstun: 17,
    blockstun: 13,
    airBlockstun: 'L+19',
    airInstantBlockstun: 'L+5'
  },
  3: {
    hitstop: 14,
    standingHitstun: 19,
    crouchingHitstun: 20,
    blockstun: 16,
    airBlockstun: 'L+19',
    airInstantBlockstun: 'L+5'
  },
  4: {
    hitstop: 15,
    standingHitstun: 21,
    crouchingHitstun: 22,
    blockstun: 18,
    airBlockstun: 'L+19',
    airInstantBlockstun: 'L+5'
  }
}

function getBlockstun(attackLevel) {
  return attackLevelData[attackLevel].blockstun
}

function getHitstun(attackLevel, position) {
  if (position === 'crouch') {
    return attackLevelData[attackLevel].crouchingHitstun
  } else if (position === 'stand') {
    return attackLevelData[attackLevel].standingHitstun
  }
}

async function parseInput(characterName, input) {
  const moves = JSON.parse(await readFile(`./frame-data/${characterName}.json`))
  const events = input.split('>').map((event) => event.trim())
  let currentTime = 0
  // const defenderTimeline = []
  // const attackerTimeline = []
  for(let i = 0; i < events.length; i++) {
    console.log(`Looking for ${events[i]}.`)
    const move = moves.find((move) => {
      return events[i] === move.input || events[i] === move.name
    })

    // TODO: actually check gatlings
    const link = i === 0 ? false : true

    // TODO: actually check if hit
    const hit = true

    const position = 'stand'

    if (!move) throw new Error(`Could not find move $[events[i]}.`)

    console.log(move.input, 'hit.')
    attackerTimeline.push({
      timestamp: currentTime,
      startup: move.startup,
      active: move.active,
      recovery: move.recovery,
      move: move.input
    })
    const defenderOutcome = {
      timestamp: currentTime,
      move: move.input
    }
    if (hit) {
      defenderOutcome.hitstun = getHitstun(move.attackLevel, stand)
    } else {
      defenderOutcome.blockstun = getBlockstun(move.attackLevel)
    }
    defenderTimeline.push(defenderOutcome)

    if (link) {
      attackerTimeline[i - 1].recovery = 0
    } else {
    }
  }
}

parseInput('Millia_Rage', '2K > 2D > 236H')

// loadData()
