import fs from "fs-extra";
import handlebars from "handlebars";
import createDOMPurify from "dompurify";
import { marked } from "marked";
import { JSDOM } from "jsdom";

// Test low res image
// const lowResImg = "http://i.stack.imgur.com/zWfJ5.jpg";

const renderer = {
  image(src, title) {
    const noExt = src.slice(0, -4);
    const srcset = `
      ${noExt}3x.jpg 1080w,
      ${noExt}2x.jpg 720w,
      ${noExt}1x.jpg 360w
    `;
    const size = "width: 100%; display: block;";
    const lowResImg = src.replace("./images/", "./images/low-");
    const style = `background-image: url(${lowResImg}); background-size: cover; ${size}`;
    return `<img src="${src}" title="${title}" loading="lazy" srcset="${srcset}" style="${style}" >`;
  },
};

function createHtml(content) {
  const window = new JSDOM("").window;
  const DOMPurify = createDOMPurify(window);
  marked.use({ renderer });
  const markdownToHtml = marked.parse(content);
  return DOMPurify.sanitize(markdownToHtml);
}

async function markdownToHtml(content) {
  const outputDirectory = "dist/";
  const layoutPath = "templates/layout/index.html.hbs";
  const layout = fs.readFileSync(layoutPath).toString("utf-8");
  const template = handlebars.compile(layout);
  fs.ensureDir(outputDirectory);
  const html = createHtml(content);
  return template({ content: html });
}

export { markdownToHtml };
