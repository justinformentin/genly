import fs from "fs-extra";
import { unified } from "unified";
import {remark} from 'remark';
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import parseFrontmatter from "remark-parse-frontmatter";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";
import rehypeParse from "rehype-parse";
import rehypeFormat from "rehype-format";
import handlebars from "handlebars";
import { renderCustomImgMarkup } from "./renderCustomImgMarkup.js";

function getFrontmatter(markdownContent){

  const processFrontmatter = remark()
  .use(remarkFrontmatter)
  .use(parseFrontmatter)
  .freeze();

const file = processFrontmatter.processSync(markdownContent);
    console.log('file', file.data.frontmatter);
    return file.data.frontmatter;
    // return markdownContent;
  }

async function convertMarkdownToHTML(markdownContent) {



  // const parsedFrontmatter = customThing(markdownContent);

  return unified()
  // .use(customThing)
    .use(remarkParse)
    .use(remarkFrontmatter)
    // .use(parseFrontmatter, {
    //   properties: {
    //     title: { type: "string", required: true },
    //     tags: { type: "array", maxItems: 4 },
    //   },
    // })
    // .use(() => (tree) => {
    //   console.log('FRONTMATTER: ',tree);
    //   return tree;
    // })
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeExternalLinks, { rel: ["nofollow"] })
    .use(rehypeStringify)
    .use(renderCustomImgMarkup)
    // .use(rehypeFormat)

    .process(markdownContent);
}

async function formatFinalHTML(htmlContent) {
  const htmlFinal = await unified()
    .use(rehypeParse)
    .use(rehypeFormat)
    .use(rehypeStringify)
    // .use(renderCustomImgMarkup)
    .process(htmlContent);
    console.log('htmlFinal', htmlFinal)
  return htmlFinal.value;
}

export async function markdownToHtml(content) {
  const outputDirectory = "dist/";
  const layoutPath = "templates/layout/index.html.hbs";
  const layout = fs.readFileSync(layoutPath).toString("utf-8");
  const template = handlebars.compile(layout);
  fs.ensureDir(outputDirectory);
  const frontmatter = getFrontmatter(content);
  const html = await convertMarkdownToHTML(content);
  const builtHTMLFile = template({ content: html, pageTitle: frontmatter.title });
  return formatFinalHTML(builtHTMLFile);
}

