/** 
 * Compares two arrays of strings to see if each element is equal
 */
export function strArraysEqual(arr1:string[], arr2:string[]):boolean {
  if(arr1.length !== arr2.length)
    return false;
  return arr1.every((v, i) => v === arr2[i]);
}