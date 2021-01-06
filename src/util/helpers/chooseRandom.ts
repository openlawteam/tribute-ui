/**
 * chooseRandom
 *
 * Choose a random item from an array.
 *
 * @param {array} array - The array to choose from.
 * @param doNotChooseItem - An item to not choose (e.g. previously chosen item)
 */
export function chooseRandom<T>(array: T[], doNotChooseItem?: T) {
  const arrayToUse =
    doNotChooseItem !== undefined
      ? array.filter((a) => a !== doNotChooseItem)
      : array;

  return arrayToUse[Math.floor(Math.random() * arrayToUse.length)];
}
