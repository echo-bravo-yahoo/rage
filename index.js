import { readFile } from 'node:fs/promises'

const buttons = (JSON.parse(await readFile('./frame-data.json'))).Millia.moves
// const string = 'c.S > c.S > 2S hit > 5H > SDisk'
// const string = '2P > 2P > 5H > S Disc hit'
const string = '2P > 2P > 2P'
// const string = 'c.S > 2S > 5H'

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

function getBlockstun(attack) {
  return attackLevelData[attack.attackLevel].blockstun
}
// counterhit...
function getHitstun(attack, position = 'stand') {
  if (attack.onHit === "KD" || attack.onHit === "HKD") {
    console.log((attack.active - 1) + attack.recovery + 1)
    return (attack.active - 1) + attack.recovery + attack.kda
  }

  if (position === 'crouch') {
    return attackLevelData[attack.attackLevel].crouchingHitstun
  } else if (position === 'stand') {
    return attackLevelData[attack.attackLevel].standingHitstun
  }
}

attackString(parseString(string))

function parseString(string) {
  let tokens = string.split('>')
  tokens = tokens.map((name) => name.trim())
  tokens = tokens.map((token) => {
    let state
    if (token.toLowerCase().startsWith('hit') || token.toLowerCase().endsWith('hit')) {
      token = token.replace('hit', '').trim()
      state = 'hit'
    } else if (token.toLowerCase().startsWith('ch') || token.toLowerCase().endsWith('ch')) {
      token = token.replace('ch', '').trim()
      state = 'counterhit'
    } else if (token.toLowerCase().startsWith('whiff') || token.toLowerCase().endsWith('whiff')) {
      token = token.replace('whiff', '').trim()
      state = 'whiff'
    } else {
      state = 'block'
    }

    let button = Object.values(buttons.normal).filter((button) => {
      if (!button.cmnName) {
        // TODO: alias these
        // console.log(`Button ${button.moveName} has no cmnName. Using moveName instead.`)
        return token.toLowerCase() === button.moveName.toLowerCase()
      } else {
        return token.toLowerCase() === button.cmnName.toLowerCase()
      }
    })[0]

    return { button, state }
  })
  console.log(`Tokens: ${tokens.map((token) => ' ' + token.button.cmnName + ' (' + token.state + ')')}`)
  return tokens
}

function attackString(buttons) {
  const attacker = {
    buttons: buttons,
    state: 'rest',
    remaining: 0,
    timeline: []
  }
  const defender = {
    state: 'rest',
    remaining: 0,
    timeline: []
  }

  while (attacker.buttons.length) {
    advanceAttackerState(attacker, defender)
  }

  while (defender.state !== 'rest') {
    advanceDefenderState(defender)
  }

  renderTimelineOverview(attacker.timeline)
  renderAttackerTimeline(attacker.timeline)
  renderDefenderTimeline(defender.timeline)
  renderSummary(attacker.timeline, defender.timeline)
}

// remove ending rest frames
function trimTimeline(timelineIn) {
  const timeline = [ ...timelineIn ]
  let lastRest

  while (timeline[timeline.length - 1].state === 'rest') {
    timeline.pop()
  }

  return timeline
}

function renderSummary(attackerTimeline, defenderTimeline) {
  const advantage = trimTimeline(defenderTimeline).length - trimTimeline(attackerTimeline).length
  const sign = advantage >= 0 ? '+' : ''
  console.log(`atk. adv: ${sign}${advantage}`)
}

function renderAttackerTimeline(timeline) {
  let string = ''
  for (let i = 0; i < timeline.length; i++) {
    const frame = timeline[i]
    if (frame.state === 'attackStartup') {
      string += 's'
    } else if (frame.state === 'attackActive') {
      string += 'a'
    } else if (frame.state === 'attackRecovery') {
      string += 'r'
    } else if (frame.state === 'rest') {
      string += ' '
    }
  }
  console.log('attacker: ' + string)
}

// takes an attacker timeline
function renderTimelineOverview(timeline) {
  let string = timeline[0].button
  let charsToSkip = string.length - 1
  for (let i = 1; i < timeline.length; i++) {
    const frame = timeline[i]
    const lastFrame = timeline[i-1]
    if (charsToSkip) {
      // skip processing this character
      charsToSkip--
    } else if (frame.state === 'attackStartup' && frame.state !== lastFrame.state) {
      string += frame.button
      charsToSkip = frame.button.length - 1
    } else {
      string += ' '
    }
  }
  console.log('          ' + string)
}

function renderDefenderTimeline(timeline) {
  let string = ''
  for (let i = 0; i < timeline.length; i++) {
    const frame = timeline[i]
    if (frame.state === 'blockstun') {
      string += 's'
    } else if (frame.state === 'hitstun') {
      string += 'h'
    } else if (frame.state === 'rest') {
      string += ' '
    }
  }
  console.log('defender: ' + string)
}

function cancelEligible(first, second) {
  const normalCancelEligible = first.gatling && first.gatling.includes(second.cmnName)
  const specialCancelEligible = first.cancelsTo.includes("sp") && second.moveType === 'special'
  if (normalCancelEligible || specialCancelEligible) {
    return true
  } else {
    return false
  }
}

function advanceAttackerState(attacker, defender) {
  console.log(`attacker: ${attacker.state} for ${attacker.remaining} frames.`)
  if (attacker.remaining === 0) {
    if (attacker.state === 'rest') {
      console.log(`Starting ${attacker.buttons[0].button.cmnName}.`)
      attacker.state = 'attackStartup'
      attacker.button = attacker.buttons[0].button.cmnName
      attacker.remaining = attacker.buttons[0].button.startup - 2
    } else if (attacker.state === 'attackStartup') {
      console.log(`${attacker.buttons[0].button.cmnName} is active.`)
      attacker.state = 'attackActive'
      attacker.button = attacker.buttons[0].button.cmnName

      // TODO: make this handle multi-part actives
      if ((defender.state === 'hitstun' && attacker.buttons[0].state !== 'whiff') || attacker.buttons[0].state === 'hit') {
        defender.state = 'hitstun'
        defender.remaining = getHitstun(attacker.buttons[0].button) + 1
      } else if (attacker.buttons[0].state === 'block') {
        defender.state = 'blockstun'
        defender.remaining = getBlockstun(attacker.buttons[0].button) + 1
      } else if (attacker.buttons[0].state === 'counterhit') {
        // TODO: Counterhit
      } else if (attacker.buttons[0].state === 'whiff') {
        // whiff! nothing for the defender
        // but let's remember that this is a valid outcome
      }

      attacker.remaining = attacker.buttons[0].button.active - 1
    } else if (attacker.state === 'attackActive') {
      if (attacker.buttons.length > 1 && cancelEligible(attacker.buttons[0].button, attacker.buttons[1].button)) {
        console.log(`Canceling ${attacker.buttons[0].button.cmnName} into ${attacker.buttons[1].button.cmnName}.`)

        // common
        attacker.state = 'attackStartup'
        attacker.buttons = attacker.buttons.slice(1)
        attacker.button = attacker.buttons[0].button.cmnName
        attacker.remaining = attacker.buttons[0].button.startup - 1

      } else {
        console.log(`${attacker.buttons[0].button.cmnName} is recovering.`)
        attacker.state = 'attackRecovery'
        attacker.remaining = attacker.buttons[0].button.recovery - 2
      }
    } else if (attacker.state === 'attackRecovery') {
      if (attacker.buttons.length > 1) {
        console.log(`Starting ${attacker.buttons[0].button.cmnName}.`)

        // common
        attacker.state = 'attackStartup'
        attacker.buttons = attacker.buttons.slice(1)
        attacker.button = attacker.buttons[0].button.cmnName
        attacker.remaining = attacker.buttons[0].button.startup - 2

      } else {
        attacker.buttons = attacker.buttons.slice(1)
      }
    }
  } else {
    if (attacker.state === 'attackActive' && attacker.buttons.length > 1 && cancelEligible(attacker.buttons[0].button, attacker.buttons[1].button)) {

        console.log(`Canceling ${attacker.buttons[0].button.cmnName} into ${attacker.buttons[1].button.cmnName}.`)
      // common
      attacker.state = 'attackStartup'
      attacker.buttons = attacker.buttons.slice(1)
      attacker.button = attacker.buttons[0].button.cmnName
      attacker.remaining = attacker.buttons[0].button.startup - 1
    }

    attacker.remaining--
    if(Number.isNaN(attacker.remaining)) {
      throw new Error(`Attacker is in state ${attacker.state} with NaN frames remaining.`)
    }
  }
  attacker.timeline.push({ state: attacker.state, button: attacker.button })
  advanceDefenderState(defender)
}

function advanceDefenderState(defender) {
  if(Number.isNaN(defender.remaining)) {
    throw new Error(`Defender is in state ${defender.state} with NaN frames remaining.`)
  }
  if (defender.remaining === 0) {
    defender.state = 'rest'
  } else {
    defender.remaining--
  }
  defender.timeline.push({ state: defender.state })
}
