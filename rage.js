import https from 'https'
import { writeFile } from 'node:fs/promises'

async function fetchFrameData() {
  const url = "https://raw.githubusercontent.com/D4RKONION/FAT/main/src/js/constants/framedata/GGSTFrameData.json"

  return new Promise((resolve, reject) => {
    https.get(url,(res) => {
      let body = ""

      res.on("data", (chunk) => {
        body += chunk
      })

      res.on("end", () => {
        try {
          resolve(JSON.parse(body))
        } catch (error) {
          reject(error.message)
        }
      })

    }).on("error", (error) => {
      reject(error.message)
    })
  })
}

/*
function transformFrameData(data) {
  const charsNames = Object.keys(data)
  const res = {}
  for (let charName in charsNames) {
    const char = data[charName]
    for (let normalName in char.moves.normal) {
      const normal = char.moves.normal[normalName]
      const tfNormal = {
        cancels: {
          normals: normal.gatling,
          jump: normal.cancelsTo.includes('j'),
          special: normal.cancelsTo.includes('sp'),
          overdrive: normal.cancelsTo.includes('su'),
          dash: normal.cancelsTo.includes('d')
        }
      }
      res[charName].buttons[normal.cmnName] = tfNormal
    }
  }
}
*/

async function saveFrameData(data) {
  return writeFile(`./frame-data.json`, JSON.stringify(data, null, 2))
}

await saveFrameData(await fetchFrameData())
