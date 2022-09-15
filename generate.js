const fs = require("fs-extra");
const path = require("path");
const handlebars = require("handlebars");
const marked = require("marked");
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

function createHtml(content) {
  const window = new JSDOM("").window;
  const DOMPurify = createDOMPurify(window);
  return DOMPurify.sanitize(marked.parse(content));
}

async function transformCallback(content, filename) {
  const outputDirectory = "dist/";
  const layoutPath = "templates/layout/index.html.hbs";
  const layout = fs.readFileSync(layoutPath).toString("utf-8");
  const template = handlebars.compile(layout);
  fs.ensureDir(outputDirectory);

  const html = createHtml(content);

  const htmlPageName = filename.slice(0, -3);
  const outPath = "dist/" + htmlPageName + ".html";

  //   fs.rmSync(outPath);
  fs.writeFileSync(outPath, template({ content: html }));
}

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
  const inputDir = 'images/';
  const outputDir = 'dist/images/';
  fs.readdirSync(inputDir).forEach((filename) => {
    console.log('imagedir filename: ', filename)
    const inPath = inputDir + filename;
    const outPath = outputDir + filename;
    if (!fs.existsSync(outPath)) {
      console.log('does not exist')
      try {
        fs.ensureDir(path.dirname(outPath));
        console.log('ensureDir');
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

  fs.readdirSync(inputDirectory).forEach((filename) => {
    // Save filenames to check for removed files later
    pageFiles.push(filename);

    fs.readFile(inputDirectory + filename, "utf-8", (err, content) => {
      if (err) throw err;
      transformCallback(content, filename);
    });
  });
  //   return Promise.all(promiseArr).then(() => {});
  copyLinkedFiles();
  handleRemovedFiles(pageFiles);
}

init();
