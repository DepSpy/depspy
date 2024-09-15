// 必须以1000 为间隔
export function unitConvert(number: number, units: string[]) {
  let result = number;
  for (let index = 0; index < units.length; index++) {
    const unit = units[index];
    if (index === units.length - 1) {
      return result.toFixed(2) + unit;
    }
    if (result > 1024) {
      result /= 1024;
    } else {
      return result.toFixed(2) + unit;
    }
  }
}
