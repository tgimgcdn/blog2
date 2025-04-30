import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import webmanifest from 'astro-webmanifest';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://blog.canjie.org',
  integrations: [
    mdx({
      remarkPlugins: [
        () => (tree) => {
          const visit = require('unist-util-visit');
          visit(tree, 'image', (node) => {
            node.type = 'html';
            node.value = `<img src="${node.url}" alt="${node.alt || ''}" class="cursor-pointer hover:opacity-90 transition-opacity" onclick="showImage(this.src)" />`;
          });
        },
      ],
    }),
    tailwind(),
    sitemap(),
    robotsTxt(),
    webmanifest({
      icon: 'public/icon.svg',
      name: 'Canjie\'s Blog',
      shortName: 'Canjie',
      description: 'Canjie\'s personal blog',
      startUrl: '/',
      themeColor: '#ffffff',
      backgroundColor: '#ffffff',
    }),
    icon(),
  ],
  env: {
    WEBMENTION_URL: process.env.WEBMENTION_URL || '',
    WEBMENTION_PINGBACK: process.env.WEBMENTION_PINGBACK || '',
  },
}); 
