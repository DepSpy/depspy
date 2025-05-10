//获取文本长度
export function getActualWidthOfChars(
  text,
  options?: { size: number; family: string },
) {
  const { size = 16, family = "Playfair Display1" } = options || {};
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `${size}px ${family}`;
  const metrics = ctx.measureText(text);
  const actual =
    Math.abs(metrics.actualBoundingBoxLeft) +
    Math.abs(metrics.actualBoundingBoxRight);
  return Math.max(metrics.width, actual);
}
//模拟text-overflow: ellipsis;
export function textOverflow(input, maxLength) {
  if (getActualWidthOfChars(input) <= maxLength) {
    return input;
  } else {
    while (getActualWidthOfChars(input.concat("...")) >= maxLength) {
      input = input.slice(0, -1);
    }
    return input.concat("...");
  }
}
