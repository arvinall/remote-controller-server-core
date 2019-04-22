
/**
 * @module idGenerator
 */

/**
 * ID character's range [0 to 9 then a to z]
 *
 * @type {number[][]}
 */
export const keyCodesList = [[48, 57], [65, 90]]

/**
 * Make new id generator
 *
 * @param charCodesList
 * @returns {function(): string}
 */
export default function idGenerator (charCodesList = keyCodesList) {
  const firstID = codeToChar(charCodesList[0][0])
  const nextCode = nextCharCode.bind(null, charCodesList, charToCode(firstID))

  let lastID

  /**
   * Make a new unique id
   *
   * @returns {string}
   */
  return function () {
    if (lastID === undefined) lastID = firstID
    else {
      let newID = lastID.split('')

      for (let charIndex in newID) {
        charIndex = Number(charIndex)

        if (charToCode(newID[charIndex]) === charCodesList[charCodesList.length - 1][1]) {
          newID[charIndex] = firstID
          if (newID[charIndex + 1] === undefined) {
            newID.push(firstID)
            break
          }
        } else {
          let charCode = nextCode(charToCode(newID[charIndex]))

          newID[charIndex] = codeToChar(charCode)
          break
        }
      }

      lastID = newID.join('')
    }

    return lastID
  }
}

function rangeOf (charCodesList, charCode) {
  if (typeof charCode !== 'number') return

  for (const rangeIndex in charCodesList) {
    if (charCode > charCodesList[rangeIndex][0] - 1 &&
      charCode < charCodesList[rangeIndex][1] + 1) return Number(rangeIndex)
  }
}

function codeToChar (charCode) {
  return String.fromCharCode(charCode).toUpperCase()
}

function charToCode (char) {
  return char.toUpperCase().charCodeAt(0)
}

function nextCharCode (charCodesList, firstID, charCode) {
  let rangeIndex = rangeOf(charCodesList, charCode)

  if (charCode >= charCodesList[rangeIndex][1]) {
    if (rangeIndex === charCodesList.length - 1) charCode = firstID
    else charCode = charCodesList[rangeIndex + 1][0]
  } else charCode++

  return charCode
}
