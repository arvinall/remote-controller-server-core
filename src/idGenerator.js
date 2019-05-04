
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
 * @param {number[][]} [charCodesList] Min and max key code as every element (sort by size)
 * @param {string} [lastId]
 *
 * @returns {function(): string}
 */
export default function idGenerator (charCodesList = keyCodesList, lastId) {
  const firstId = codeToChar(charCodesList[0][0])
  const nextCode = nextCharCode.bind(null, charCodesList, charToCode(firstId))

  /**
   * Make a new unique id
   *
   * @returns {string}
   */
  return function () {
    if (lastId === undefined) lastId = firstId
    else {
      let newId = lastId.split('')

      for (let charIndex in newId) {
        charIndex = Number(charIndex)

        if (charToCode(newId[charIndex]) === charCodesList[charCodesList.length - 1][1]) {
          newId[charIndex] = firstId
          if (newId[charIndex + 1] === undefined) {
            newId.push(firstId)
            break
          }
        } else {
          let charCode = nextCode(charToCode(newId[charIndex]))

          newId[charIndex] = codeToChar(charCode)
          break
        }
      }

      lastId = newId.join('')
    }

    return lastId
  }
}

/**
 * @param {number[][]} charCodesList
 * @param {number} charCode
 *
 * @throws Will throw an error if id is not in range of charCodesList parameter
 *
 * @returns {number}
 */
function rangeOf (charCodesList, charCode) {
  if (typeof charCode !== 'number') throw new Error('charCode parameter is required and mus be number')

  for (const rangeIndex in charCodesList) {
    if (charCode > charCodesList[rangeIndex][0] - 1 &&
      charCode < charCodesList[rangeIndex][1] + 1) return Number(rangeIndex)
  }

  throw new Error('ID is not in range of charCodesList parameter')
}

/**
 * @param {number[][]} charCodesList
 * @param {number} firstId
 * @param {number} charCode
 *
 * @returns {number}
 */
function nextCharCode (charCodesList, firstId, charCode) {
  let rangeIndex = rangeOf(charCodesList, charCode)

  if (charCode >= charCodesList[rangeIndex][1]) {
    if (rangeIndex === charCodesList.length - 1) charCode = firstId
    else charCode = charCodesList[rangeIndex + 1][0]
  } else charCode++

  return charCode
}

/**
 * @param {number} charCode
 *
 * @returns {string}
 */
function codeToChar (charCode) {
  return String.fromCharCode(charCode).toUpperCase()
}

/**
 * @param {string} char
 *
 * @returns {number}
 */
function charToCode (char) {
  return char.toUpperCase().charCodeAt(0)
}
