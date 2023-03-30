const buttons = [
  {
    name: 'c.S',
    type: 'normal',
    startup: 7,
    // active: [3, 3],
    active: 6,
    recovery: 13,
    blockstun: 14,
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
    startup: 11,
    active: 2,
    recovery: 18,
    blockstun: 12,
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
    startup: 12,
    active: 4,
    recovery: 23,
    blockstun: 15,
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
    cancels: {
      normals: [],
      jump: false,
      special: false,
      overdrive: true
    }
  },
]

// const string = 'c.S > c.S'
const string = 'c.S > c.S > 2S > 5H > SDisk'

attackString(parseString(string))

function parseString(string) {
  let names = string.split('>')
  names = names.map((name) => name.trim())
  names = names.map((name) => buttons.filter((button) => name.toLowerCase() === button.name.toLowerCase())[0])
  return names
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

  while(attacker.buttons.length) {
    advanceAttackerState(attacker, defender)
  }
  renderAttackerTimeline(attacker.timeline)
  renderDefenderTimeline(defender.timeline)
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

function renderDefenderTimeline(timeline) {
  let string = ''
  for (let i = 0; i < timeline.length; i++) {
    const frame = timeline[i]
    if (frame.state === 'blockstun') {
      string += 's'
    } else if (frame.state === 'attackActive') {
      string += 'a'
    } else if (frame.state === 'attackRecovery') {
      string += 'r'
    } else if (frame.state === 'rest') {
      string += ' '
    }
  }
  console.log('defender: ' + string)
}

function cancelEligible(first, second) {
  if (first.cancels.normals.includes(second.name)) {
    return true
  } else {
    return false
  }
}

function advanceAttackerState(attacker, defender) {
  if (attacker.remaining === 0) {
    if (attacker.state === 'rest') {
      console.log(`Starting ${attacker.buttons[0].name}.`)
      attacker.state = 'attackStartup'
      attacker.button = attacker.buttons[0].name
      attacker.remaining = attacker.buttons[0].startup - 1
    } else if (attacker.state === 'attackStartup') {
      console.log(`${attacker.buttons[0].name} is active.`)
      attacker.state = 'attackActive'
      attacker.button = attacker.buttons[0].name

      // make this handle multi-part actives?
      attacker.remaining = attacker.buttons[0].active - 1
      defender.state = 'blockstun'
      defender.remaining = attacker.buttons[0].blockstun
    } else if (attacker.state === 'attackActive') {
      if (attacker.buttons.length > 1 && cancelEligible(attacker.buttons[0], attacker.buttons[1])) {
        console.log(`Canceling ${attacker.buttons[0].name} into ${attacker.buttons[1].name}.`)

        // common
        attacker.state = 'attackStartup'
        attacker.button = attacker.buttons[0].name
        attacker.remaining = attacker.buttons[0].startup - 1
        attacker.buttons = attacker.buttons.slice(1)

      } else {
        console.log(`${attacker.buttons[0].name} is recovering.`)
        attacker.state = 'attackRecovery'
        attacker.remaining = attacker.buttons[0].recovery - 2
      }
    } else if (attacker.state === 'attackRecovery') {
      if (attacker.buttons.length > 1) {
          console.log(`Starting ${attacker.buttons[0].name}.`)

          // common
          attacker.state = 'attackStartup'
          attacker.button = attacker.buttons[0].name
          attacker.remaining = attacker.buttons[0].startup - 1
        }
          attacker.buttons = attacker.buttons.slice(1)
    }
  } else {
    attacker.remaining--
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
