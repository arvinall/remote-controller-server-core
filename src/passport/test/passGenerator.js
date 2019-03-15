
import characters from './characters'

export const password = (size = 8) => {
  size = Number(size)

  let pass = ''
  let charType = 0

  for (let counter = 0; counter < size; counter++) {
    if (counter >= characters.length) charType = randomNumber(characters.length)

    pass += characters[charType][randomNumber(characters[charType].length)]
    if (counter < characters.length) charType++
  }

  return pass
}

function randomNumber (max) {
  return Number.parseInt((Math.random() * max))
}
