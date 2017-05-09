'use strict';

const JsonML = require('jsonml.js/lib/utils');
// 这里获取的是运行目录的 package.json
const cleanCSS = require('./utils/clean-css');
const demoStyleScopo = require('./utils/demo-style-scope');

function isStyleTag(node) {
  return node && JsonML.getTagName(node) === 'style';
}

function getCode(node) {
  return JsonML.getChildren(JsonML.getChildren(node)[0])[0];
}

module.exports = (markdownData, config) => {
  const meta = markdownData.meta;
  meta.id = meta.filename.replace(/\.md$/, '').replace(/\//g, '-');

  const contentChildren = JsonML.getChildren(markdownData.content);

  const codeIndex = contentChildren.findIndex(node => {
    return (
      JsonML.getTagName(node) === 'pre' &&
      JsonML.getAttributes(node).lang === 'jsx'
    );
  });

  markdownData.content = contentChildren.slice(0, codeIndex); // 移除了 pre 的内容
  markdownData.highlightedCode = contentChildren[codeIndex].slice(0, 2);

  const rawCode = getCode(contentChildren[codeIndex]);
  markdownData.rawCode = rawCode;
  const styleNode = contentChildren.filter(node => {
    return (
      isStyleTag(node) ||
      (JsonML.getTagName(node) === 'pre' &&
        JsonML.getAttributes(node).lang === 'css')
    );
  })[0];

  if (isStyleTag(styleNode)) {
    const styleSource = JsonML.getChildren(styleNode)[0];

    if (styleSource && styleSource.trim() !== '') {
      const cleanStyleSource = cleanCSS.minify(styleSource);
      markdownData.style = demoStyleScopo(cleanStyleSource.styles, meta.id);
      markdownData.rawStyle = styleSource;
    }
  } else if (styleNode) {
    const styleTag = contentChildren.filter(isStyleTag)[0];
    const cssSource =
      getCode(styleNode) + (styleTag ? JsonML.getChildren(styleTag)[0] : '');

    if (cssSource && cssSource.trim() !== '') {
      const cleanCssSource = cleanCSS.minify(cssSource);
      markdownData.style = demoStyleScopo(cleanCssSource.styles, meta.id);
      markdownData.rawStyle = cssSource;
      markdownData.highlightedStyle = JsonML.getAttributes(
        styleNode
      ).highlighted;
    }
  }

  return markdownData;
};
