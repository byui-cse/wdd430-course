// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';

// 2. Import loader(s)
import { glob, file } from 'astro/loaders';

// 3. Define your collection(s)
const ponder = defineCollection({ loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/ponder" }), });
const resources = defineCollection({ loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/resources" }), });
const semester = defineCollection({ loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/semester" }), });
const prepare = defineCollection({ loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/prepare" }), });
const prove = defineCollection({ loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/prove" }), });



// 4. Export a single `collections` object to register  your collection(s)
export const collections = { ponder, resources, semester, prepare, prove };