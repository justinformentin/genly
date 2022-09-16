import fs from "fs-extra";
import path from "path";
import handlebars from "handlebars";
import { markdownToHtml } from "./markdownToHtml.js";

function registerPartials() {
  const partials = ["seo", "sidebar"];
  partials.forEach((name) => {
    const partialPath = `templates/partials/${name}.html.hbs`;
    const partial = fs.readFileSync(partialPath).toString("utf-8");
    const partialName = name + "Partial";
    handlebars.registerPartial(partialName, partial);
  });
}

async function handleRemovedFiles(pageFiles) {
  // Remove pages from /dist if no longer in /pages
  const outputDirectory = "dist/";
  fs.readdirSync(outputDirectory).forEach((filename) => {
    const removeHtmlExt = (f) => f.slice(0, -5);
    const removeMdExt = (f) => f.slice(0, -3);
    const foundIndex = pageFiles.findIndex(
      (name) => removeMdExt(name) === removeHtmlExt(filename)
    );
    if (foundIndex === -1) {
      const filePath = outputDirectory + filename;
      fs.unlink(filePath, (err) => !err && console.log(filePath + " deleted!"));
    }
  });
}

async function copyLinkedFiles() {
  const inputDir = "images/";
  const outputDir = "dist/images/";
  fs.readdirSync(inputDir).forEach((filename) => {
    const inPath = inputDir + filename;
    const outPath = outputDir + filename;

    if (!fs.existsSync(outPath)) {
      try {
        fs.ensureDir(path.dirname(outPath));
        
        fs.copyFile(inPath, outPath);
      } catch (err) {
        console.error(`error copying file`, err);
      }
    }
  });
}

async function init() {
  const inputDirectory = "pages/";
  const pageFiles = [];

  // Partials
  registerPartials();

  copyLinkedFiles();

  fs.readdirSync(inputDirectory).forEach((filename) => {
    // Save filenames to check for removed files later
    pageFiles.push(filename);

    fs.readFile(inputDirectory + filename, "utf-8", async (err, content) => {
      if (err) throw err;
      const htmlPageName = filename.slice(0, -3);
      const outPath = "dist/" + htmlPageName + ".html";
      const htmlFinal = await markdownToHtml(content, filename);
      fs.writeFileSync(outPath, htmlFinal);
    });
  });
  //   return Promise.all(promiseArr).then(() => {});
  handleRemovedFiles(pageFiles);
}

init();
