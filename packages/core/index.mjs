
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc';
import fs from 'fs';
function compileVueFile(source) {


  // 解析Vue文件
  const { descriptor } = parse(source);

  // 编译Script部分
  const script = compileScript(descriptor, {
    id: 'your-component-id' // 唯一ID（用于Scoped CSS）
  });

  // 编译Template部分
  const template = compileTemplate({
    source: descriptor.template.content,
    id: 'your-component-id'
  });

  // 组合成最终JS代码
  const output = `
${script.content.replace('export default ', 'const script = ')}

script.render = ${template.code};

export default script;
`;

  return output;

}

console.log(compileVueFile(fs.readFileSync('D:\\battlefield\\vue3-js-admin\\src\\App.vue', 'utf-8')));