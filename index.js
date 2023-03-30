const buttons = [
  {
    name: 'c.S',
    type: 'normal',
    level: 3,
    startup: 7,
    // active: [3, 3],
    active: 6,
    recovery: 13,
    blockstun: 14,
    hitstun: 19,
    cancels: {
      normals: [ '2S' ],
      jump: true,
      special: true,
      overdrive: true
    }
  },
  {
    name: '2S',
    type: 'normal',
    level: 2,
    startup: 11,
    active: 2,
    recovery: 18,
    blockstun: 13,
    hitstun: 16,
    cancels: {
      normals: [ '5H' ],
      jump: false,
      special: true,
      overdrive: true
    }
  },
  {
    name: '5H',
    type: 'normal',
    level: 4,
    startup: 12,
    active: 4,
    recovery: 23,
    blockstun: 15,
    hitstun: 21,
    cancels: {
      normals: [],
      jump: false,
      special: true,
      overdrive: true
    }
  },
  {
    name: 'SDisk',
    type: 'special',
    startup: 12,
    active: 14,
    recovery: 45,
    blockstun: 35,
    hitstun: 87,
    cancels: {
      normals: [],
      jump: false,
      special: false,
      overdrive: true
    }
  },
]

// const string = 'c.S > c.S'
const string = 'c.S > c.S > 2S hit > 5H > SDisk whiff'

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

    let button = buttons.filter((button) => token.toLowerCase() === button.name.toLowerCase())[0]

    return { button, state }
  })
  console.log(`Tokens: ${tokens.map((token) => ' ' + token.button.name + ' (' + token.state + ')')}`)
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
  if (first.cancels.normals.includes(second.name) || (first.cancels.special && second.type === 'special')) {
    return true
  } else {
    return false
  }
}

function advanceAttackerState(attacker, defender) {
  if (attacker.remaining === 0) {
    if (attacker.state === 'rest') {
      console.log(`Starting ${attacker.buttons[0].button.name}.`)
      attacker.state = 'attackStartup'
      attacker.button = attacker.buttons[0].button.name
      attacker.remaining = attacker.buttons[0].button.startup - 1
    } else if (attacker.state === 'attackStartup') {
      console.log(`${attacker.buttons[0].button.name} is active.`)
      attacker.state = 'attackActive'
      attacker.button = attacker.buttons[0].button.name

      // TODO: make this handle multi-part actives
      if ((defender.state === 'hitstun' && attacker.buttons[0].state !== 'whiff') || attacker.buttons[0].state === 'hit') {
        defender.state = 'hitstun'
        defender.remaining = attacker.buttons[0].button.hitstun
      } else if (attacker.buttons[0].state === 'block') {
        defender.state = 'blockstun'
        defender.remaining = attacker.buttons[0].button.blockstun
      } else if (attacker.buttons[0].state === 'counterhit') {
        // TODO: Counterhit
      } else if (attacker.buttons[0].state === 'whiff') {
        // whiff! nothing for the defender
        // but let's remember that this is a valid outcome
      }

      attacker.remaining = attacker.buttons[0].button.active - 1
    } else if (attacker.state === 'attackActive') {
      if (attacker.buttons.length > 1 && cancelEligible(attacker.buttons[0].button, attacker.buttons[1].button)) {
        console.log(`Canceling ${attacker.buttons[0].button.name} into ${attacker.buttons[1].button.name}.`)

        // common
        attacker.state = 'attackStartup'
        attacker.buttons = attacker.buttons.slice(1)
        attacker.button = attacker.buttons[0].button.name
        attacker.remaining = attacker.buttons[0].button.startup - 1

      } else {
        console.log(`${attacker.buttons[0].button.name} is recovering.`)
        attacker.state = 'attackRecovery'
        attacker.remaining = attacker.buttons[0].button.recovery - 2
      }
    } else if (attacker.state === 'attackRecovery') {
      if (attacker.buttons.length > 1) {
          console.log(`Starting ${attacker.buttons[0].button.name}.`)

          // common
          attacker.state = 'attackStartup'
          attacker.button = attacker.buttons[0].button.name
          attacker.remaining = attacker.buttons[0].button.startup - 1
        }
          attacker.buttons = attacker.buttons.slice(1)
    }
  } else {
    attacker.remaining--
    if(Number.isNaN(attacker.remaining)) {
      throw new Error('later!')
    }
  }
  attacker.timeline.push({ state: attacker.state, button: attacker.button })
  advanceDefenderState(defender)
}

function advanceDefenderState(defender) {
  if (defender.remaining === 0) {
    defender.state = 'rest'
  } else {
    defender.remaining--
  }
  defender.timeline.push({ state: defender.state })
}
