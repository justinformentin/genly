import fs from "fs-extra";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";
import rehypeParse from "rehype-parse";
import rehypeFormat from "rehype-format";
import handlebars from "handlebars";
import { renderCustomImgMarkup } from "./renderCustomImgMarkup.js";

async function convertMarkdownToHTML(markdownContent) {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeExternalLinks, { rel: ["nofollow"] })
    .use(rehypeStringify)
    .process(markdownContent);
}

async function formatFinalHTML(htmlContent) {
  const htmlFinal = await unified()
    .use(rehypeParse)
    .use(rehypeFormat)
    .use(rehypeStringify)
    .use(renderCustomImgMarkup)
    .process(htmlContent);
  return htmlFinal.value;
}
async function markdownToHtml(content) {
  const outputDirectory = "dist/";
  const layoutPath = "templates/layout/index.html.hbs";
  const layout = fs.readFileSync(layoutPath).toString("utf-8");
  const template = handlebars.compile(layout);
  fs.ensureDir(outputDirectory);

  const html = await convertMarkdownToHTML(content);
  const builtHTMLFile = template({ content: html });
  return formatFinalHTML(builtHTMLFile);
}

export { markdownToHtml };
