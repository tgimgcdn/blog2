import { defineCollection, z } from 'astro:content';
import type { Node } from 'unist';
import type { Image } from 'mdast';
import { ImageViewer } from '../components/ImageViewer.astro';

const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    updatedDate: z.string().optional(),
    tags: z.array(z.string()),
    author: z.string(),
    seriesId: z.string().optional(),
    orderInSeries: z.number().optional(),
  }),
});

const notes = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    updatedDate: z.string().optional(),
    tags: z.array(z.string()),
    author: z.string(),
  }),
});

export const collections = { posts, notes };

// 自定义 Markdown 图片渲染
export const markdownConfig = {
  remarkPlugins: [
    () => (tree: Node) => {
      const visit = require('unist-util-visit');
      visit(tree, 'image', (node: Image) => {
        node.type = 'html';
        node.value = `<ImageViewer src="${node.url}" alt="${node.alt || ''}" />`;
      });
    },
  ],
}; 
