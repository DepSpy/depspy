// json数组生成buffer（转为二进制格式）
export function jsonsToBuffer(jsons: string[]) {
  return Buffer.concat(
    jsons.map((json) => {
      const buffer = Buffer.from(json);
      // 获取长度
      const sizeBuffer = Buffer.alloc(4);
      sizeBuffer.writeInt32LE(buffer.length, 0);
      // 写入长度信息，方便解析
      return Buffer.concat([sizeBuffer, buffer] as unknown as Uint8Array[]);
    }) as unknown as Uint8Array[],
  );
}
// buffer树转为json数组
export function parseNodeBuffer(buffer) {
  if (!buffer) {
    throw new Error("buffer is empty");
  }
  const nodes = [];
  let offset = 0;

  while (offset < buffer.byteLength) {
    // 读取数据块的大小（前4个字节）
    const sizeView = new DataView(buffer, offset, 4);
    const nodeSize = sizeView.getInt32(0, true); // Little Endian
    offset += 4;

    // 读取实际的数据
    const nodeBuffer = new Uint8Array(buffer, offset, nodeSize);
    offset += nodeSize;

    // 将数据转换为字符串并解析为对象
    const nodeJson = new TextDecoder().decode(nodeBuffer);
    const node = JSON.parse(nodeJson, (key, value) => {
      if (key === "childrenNumber" && (value === "Infinity" || value === null))
        return Infinity;
      return value;
    });
    nodes.push(node);
  }

  return nodes;
}