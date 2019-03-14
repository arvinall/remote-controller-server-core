
import characters from './characters'

export const password = (size = 8) => {
  size = Number(size)

  let pass = ''
  let charType = 0

  for (let counter = 1; counter <= size; counter++) {
    if (charType >= characters.length) charType = 0

    pass += characters[charType][randomNumber(characters[charType].length)]
    charType++
  }

  return pass
}

function randomNumber (max) {
  return Number.parseInt((Math.random() * max))
}
