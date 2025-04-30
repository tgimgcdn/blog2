import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';

export const remarkImageViewer: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'image', (node) => {
      // 添加 data-viewer 属性
      node.data = {
        ...node.data,
        hProperties: {
          ...(node.data?.hProperties || {}),
          'data-viewer': true,
          class: 'cursor-pointer hover:opacity-90 transition-opacity',
        },
      };
    });
  };
}; 
