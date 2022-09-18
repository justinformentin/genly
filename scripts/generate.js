import fs from "fs-extra";
import path from "path";
import handlebars from "handlebars";
// import { markdownToHtml } from "./markdownToHtmlMarked.js";
import { markdownToHtml } from "./markdownToHtmlRemark.js";
import { resizeImages } from "./resizeImages.js";
import config from "../config.js";

// interface Frontmatter {
//   slug: string;
//   date: string;
//   title: string;
//   chunk: string;
//   category: string;
//   tags: string;
// }

function registerPartials() {
  const partials = ["seo", "sidebar"];
  partials.forEach((name) => {
    const partialPath = `templates/partials/${name}.html.hbs`;
    const partial = fs.readFileSync(partialPath).toString("utf-8");
    const partialName = name + "Partial";
    handlebars.registerPartial(partialName, partial);
  });
}

async function handleMarkdownConversion(absolute, subDirectory, filenameNoExt) {
  const content = fs.readFileSync(absolute, "utf-8");
  const { html, frontmatter } = await markdownToHtml(content);
  const subDir = `dist/${subDirectory}`;
  fs.ensureDir(subDir);
  const fileDir = `${subDir}/${frontmatter.slug}`;
  fs.ensureDir(fileDir);
  const outPath = `${fileDir}/${filenameNoExt}.html`;
  fs.writeFileSync(outPath, html);
  return frontmatter;
}

async function init() {
  const inputDirectory = "site/";
  fs.ensureDir("dist/");
  // Partials
  registerPartials();

  config.pages.forEach(async (subDirectory) =>
    fs.readdirSync(inputDirectory + subDirectory).map(async (filename) => {
      const inPath = inputDirectory + subDirectory + "/" + filename;

      const files = fs.readdirSync(inPath);
      const findExt = (ext) => files.find((d) => d.split(".")[1] === ext);
      const foundMd = findExt("md");
      if (foundMd) {
        const absoluteMd = path.join(inPath, foundMd);
        const mdNoExt = foundMd.split(".")[0];
        const frontmatter = await handleMarkdownConversion(
          absoluteMd,
          subDirectory,
          mdNoExt
        );
        const foundImg = findExt("jpg");
        if (foundImg) {
          const absoluteImg = path.join(inPath, foundImg);
          const imgNoExt = foundImg.split(".")[0];
          const imageOutputDir = `dist/${subDirectory}/${frontmatter.slug}`;
          resizeImages(absoluteImg, imageOutputDir, imgNoExt);
        }
      }
    })
  );
}

init();
