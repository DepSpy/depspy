// json数组生成buffer（转为二进制格式）
export function jsonsToBuffer(jsons: string[]) {
  return Buffer.concat(
    jsons.map((json) => {
      const buffer = Buffer.from(json);
      // 获取长度
      const sizeBuffer = Buffer.alloc(4);
      sizeBuffer.writeInt32LE(buffer.length, 0);
      // 写入长度信息，方便解析
      return Buffer.concat([sizeBuffer, buffer]);
    }),
  );
}
