export default function (context) {
  return new Bump(context);
}
class Bump {
  constructor(context) {
    this._context = context;
  }
  areaStart() {
    this._line = 0;
  }
  areaEnd() {
    this._line = NaN;
  }
  lineStart() {
    this._point = 0;
  }
  lineEnd() {
    if (this._line || (this._line !== 0 && this._point === 1))
      this._context.closePath();
    this._line = 1 - this._line;
  }
  point(x, y) {
    (x = +x), (y = +y);
    switch (this._point) {
      case 0: {
        this._point = 1;
        if (this._line) this._context.lineTo(x, y);
        else this._context.moveTo(x, y);
        break;
      }
      case 1:
        this._point = 2; // falls through
      default: {
        const direct =
          y - this._y0 ? (y - this._y0) / Math.abs(y - this._y0) : 1;
        let r = Math.min((x - this._x0) / 4, Math.abs((y - this._y0) / 2));
        let changeX = this._x0 + r;
        let middleX = this._x0 + (x - this._x0) / 2;
        this._context.lineTo(changeX, this._y0);
        this._context.moveTo(changeX, this._y0);

        this._context.bezierCurveTo(
          middleX,
          this._y0,
          middleX,
          this._y0,
          middleX,
          this._y0 + r * direct,
        );
        this._context.moveTo(middleX, this._y0 + r * direct);

        this._context.lineTo(middleX, y - r * direct);
        this._context.moveTo(middleX, y - r * direct);

        this._context.bezierCurveTo(middleX, y, middleX, y, middleX + r, y);
        this._context.moveTo(middleX + r, y);

        this._context.lineTo(x, y);
        this._context.moveTo(x, y);
        break;
      }
    }
    (this._x0 = x), (this._y0 = y);
  }
}
