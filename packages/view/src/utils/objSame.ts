// 判断两个对象是否相等
export function objSame(obj1: object, obj2: object) {
  if (typeof obj1 !== "object" || typeof obj2 !== "object") {
    return false;
  }
  if (Object.keys(obj1).length !== Object.keys(obj2).length) {
    return false;
  }
  for (const key in obj1) {
    if (Object.prototype.hasOwnProperty.call(obj1, key)) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }
  }
  return true;
}
