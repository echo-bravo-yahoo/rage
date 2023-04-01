import { readFile } from 'node:fs/promises'
import chalk from 'chalk'

const buttons = (JSON.parse(await readFile('./frame-data.json'))).Millia.moves

// disable debug logging
console.debug = () => {}

// const string = 'c.S > c.S > 2S hit > 5H > SDisk'
// const string = '2P > 2P > 5H > S Disc hit'
// const string = '2K hit > 6H > hair car > S Disc'
// const string = 'c.S > 2S > 5H'
// const string = 'c.S hit > 6H > hair car'
const string = 'f.S > S Disc'

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
    return (sanitizeActive(attack) - 1) + sanitizeRecovery(attack) + attack.kda
  }

  if (position === 'crouch') {
    return attackLevelData[attack.attackLevel].crouchingHitstun
  } else if (position === 'stand') {
    return attackLevelData[attack.attackLevel].standingHitstun
  }
}

function getName(buttonObject) {
  // TODO: aliases go here
  const name = buttonObject.cmnName || buttonObject.moveName
  if (!name) throw new Error(`Button ${buttonObject} does not have a cmnName or moveName!`)
  return name
}

function sanitizeActive(button) {
  if (button.active === 'UC') {
    console.log(`Assuming ${getName(button)} hits on frame 1 (this is highly unlikely!)`)
    return 1
  } else {
    return button.active
  }
}

function sanitizeRecovery(button) {
  if (typeof button.recovery === 'string') {
    if (button.recovery.match(/\d+(\+\d+)+/).length) {
      let values = button.recovery.split('+')
      values = values.map((value) => Number(value))
      return values.reduce((prev, cur) => prev + cur, 0)
    } else {
      throw new Error(`Could not parse recovery value of ${button.recovery} for button ${getName(button)}`)
    }
  } else {
    return button.recovery
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

    const button = getButtonFromName(token.toLowerCase())

    return { button, state }
  })
  console.log(`Tokens: ${tokens.map((token) => ' ' + getName(token.button) + ' (' + token.state + ')')}`)
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

  while (timeline[timeline.length - 1].state === 'rest') {
    timeline.pop()
  }

  return timeline
}

function renderSummary(attackerTimeline, defenderTimeline) {
  const advantage = trimTimeline(defenderTimeline).length - trimTimeline(attackerTimeline).length
  const sign = advantage >= 0 ? '+' : ''
  const color = advantage >= 0 ? '#36B37E' : '#FF5D5D'
  console.log(`atk. adv: ${chalk.hex(color)(sign + advantage)}`)
}

function renderAttackerTimeline(timeline) {
  let string = ''
  for (let i = 0; i < timeline.length; i++) {
    const frame = timeline[i]
    string += colorFrame(frame)
  }
  console.log('attacker: ' + string)
}

function getButtonFromName(name) {
  let matches = Object.values(buttons.normal).filter((button) => {
    if (!button.cmnName) {
      // TODO: alias these?
      // console.log(`Button ${button.moveName} has no cmnName. Using moveName instead.`)
      return name.toLowerCase() === button.moveName.toLowerCase()
    } else {
      return name.toLowerCase() === button.cmnName.toLowerCase()
    }
  })

  if (matches.length === 0) {
    throw new Error(`Could not find a match for button with name ${name}!`)
  } else if (matches.length > 1) {
    throw new Error(`Found ${matches.length} matches for button with name ${name}!`)
  }

  return matches[0]
}

function colorButton(buttonObject) {
  let ret = getName(buttonObject)

  if (buttonObject.numCmd.toUpperCase().includes('P')) {
    ret = chalk.hex('#d96aca')(ret)
  } else if (buttonObject.numCmd.toUpperCase().includes('K')) {
    ret = chalk.hex('#1f8ccc')(ret)
  } else if (buttonObject.numCmd.toUpperCase().includes('S')) {
    ret = chalk.hex('#009e4e')(ret)
  } else if (buttonObject.numCmd.toUpperCase().includes('H')) {
    ret = chalk.hex('#de1616')(ret)
  } else if (buttonObject.numCmd.toUpperCase().includes('D')) {
    ret = chalk.hex('#e8982c')(ret)
  } else {
    console.log(`Did not know how to color button ${getName(buttonObject)} with numpad command ${buttonObject.numCmd}!`)
  }

  return ret
}

function colorFrame(frame) {
  let ret = ''

  if (frame.state === 'attackStartup') {
    ret += chalk.hex('#36B37E')('s')
  } else if (frame.state === 'attackActive') {
    ret += chalk.hex('#FF5D5D')('a')
  } else if (frame.state === 'attackRecovery') {
    ret += chalk.hex('#0069B6')('r')
    // TODO: Special recovery frames (#db69cf)
  } else if (frame.state === 'rest') {
    ret += ' '
  } else if (frame.state === 'blockstun') {
    ret += chalk.hex('#0069B6')('s')
  } else if (frame.state === 'hitstun') {
    ret += chalk.hex('#FF5D5D')('h')
  } else if (frame.state === 'rest') {
    ret += ' '
  }

  return ret
}

// takes an attacker timeline
function renderTimelineOverview(timeline) {
  let firstButton = getButtonFromName(timeline[0].button)
  let string = colorButton(firstButton)
  let charsToSkip = getName(firstButton).length - 1
  for (let i = 1; i < timeline.length; i++) {
    const frame = timeline[i]
    const lastFrame = timeline[i-1]
    if (charsToSkip) {
      // skip processing this character
      charsToSkip--
    } else if (frame.state === 'attackStartup' && frame.state !== lastFrame.state) {
      const buttonObject = getButtonFromName(frame.button)
      string += colorButton(buttonObject)
      charsToSkip = (buttonObject.cmnName || buttonObject.moveName).length - 1
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
    string += colorFrame(frame)
  }
  console.log('defender: ' + string)
}

function cancelEligible(first, second) {
  const normalCancelEligible = first.gatling && first.gatling.includes(second.cmnName)
  const specialCancelEligible = first.cancelsTo && first.cancelsTo.includes("sp") && second.moveType === 'special'
  if (normalCancelEligible || specialCancelEligible) {
    return true
  } else {
    return false
  }
}

function advanceAttackerState(attacker, defender) {
  if (attacker.remaining === 0) {
    if (attacker.state === 'rest') {
      console.log(`Starting ${getName(attacker.buttons[0].button)}.`)
      attacker.state = 'attackStartup'
      attacker.button = getName(attacker.buttons[0].button)
      console.debug(`startup::startup::before::${attacker.remaining}`)
      attacker.remaining = attacker.buttons[0].button.startup - 2
      console.debug(`startup::startup::after::${attacker.remaining}`)
    } else if (attacker.state === 'attackStartup') {
      console.log(`${getName(attacker.buttons[0].button)} is active.`)
      attacker.state = 'attackActive'
      attacker.button = getName(attacker.buttons[0].button)

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

      console.debug(`startup::active::before::${attacker.remaining}`)
      attacker.remaining = sanitizeActive(attacker.buttons[0].button) - 1
      console.debug(`startup::active::after::${attacker.remaining}`)

    } else if (attacker.state === 'attackActive') {
      if (attacker.buttons.length > 1 && cancelEligible(attacker.buttons[0].button, attacker.buttons[1].button)) {
        console.log(`Canceling ${getName(attacker.buttons[0].button)} into ${getName(attacker.buttons[1].button)}.`)

        // common
        attacker.state = 'attackStartup'
        attacker.buttons = attacker.buttons.slice(1)
        attacker.button = getName(attacker.buttons[0].button)
        attacker.remaining = attacker.buttons[0].button.startup - 1

      } else {
        console.log(`${getName(attacker.buttons[0].button)} is recovering.`)
        attacker.state = 'attackRecovery'
        console.debug(`startup::recovery::before::${attacker.remaining}`)
        attacker.remaining = sanitizeRecovery(attacker.buttons[0].button) - 2
        console.debug(`startup::recovery::after::${attacker.remaining}`)
      }
    } else if (attacker.state === 'attackRecovery') {
      if (attacker.buttons.length > 1) {
        console.log(`Starting ${getName(attacker.buttons[0].button)}.`)

        // common
        attacker.state = 'attackStartup'
        attacker.buttons = attacker.buttons.slice(1)
        attacker.button = getName(attacker.buttons[0].button)
        console.debug(`startup::remaining::before::${attacker.remaining}`)
        attacker.remaining = attacker.buttons[0].button.startup - 2
        console.debug(`startup::remaining::after::${attacker.remaining}`)

      } else {
        attacker.buttons = attacker.buttons.slice(1)
      }
    }
  } else {
    if (attacker.state === 'attackActive' && attacker.buttons.length > 1 && cancelEligible(attacker.buttons[0].button, attacker.buttons[1].button)) {
      console.log(`Canceling ${getName(attacker.buttons[0].button)} into ${getName(attacker.buttons[1].button)}.`)
      // common
      attacker.state = 'attackStartup'
      attacker.buttons = attacker.buttons.slice(1)
      attacker.button = getName(attacker.buttons[0].button)
      console.debug(`startup::startup::before::${attacker.remaining}`)
      attacker.remaining = attacker.buttons[0].button.startup - 1
      console.debug(`startup::startup::after::${attacker.remaining}`)
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
