import fs from "fs-extra";
import { unified } from "unified";
import { remark } from "remark";
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

function getFrontmatter(markdownContent) {
  const processFrontmatter = remark()
    .use(remarkFrontmatter)
    .use(parseFrontmatter)
    .freeze();
  const { data } = processFrontmatter.processSync(markdownContent);
  return data.frontmatter;
}

async function convertMarkdownToHTML(markdownContent) {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeExternalLinks, { rel: ["nofollow"] })
    .use(rehypeStringify)
    .use(renderCustomImgMarkup)
    .process(markdownContent);
}

async function formatFinalHTML(htmlContent) {
  const htmlFinal = await unified()
    .use(rehypeParse)
    .use(rehypeFormat)
    .use(rehypeStringify)
    .process(htmlContent);
  return htmlFinal.value;
}

export function getHtml(content) {
  const layoutPath = "templates/layout/index.html.hbs";
  const layout = fs.readFileSync(layoutPath).toString("utf-8");
  const template = handlebars.compile(layout);
  return template({ content });
}

export async function markdownToHtml(markdown) {
  const layoutPath = "templates/layout/index.html.hbs";
  const layout = fs.readFileSync(layoutPath).toString("utf-8");
  const template = handlebars.compile(layout);
  const frontmatter = getFrontmatter(markdown);
  const content = await convertMarkdownToHTML(markdown);
  const builtHtml = template({ content, pageTitle: frontmatter.title });
  const html = await formatFinalHTML(builtHtml);
  return { html, frontmatter };
}
