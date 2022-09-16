import fs from "fs-extra";
import path from "path";
import handlebars from "handlebars";
import { markdownToHtml } from "./markdownToHtml.js";
import { resizeImages } from "./resizeImages.js";

const imageFiles = [];
const pageFiles = [];

const defaultImageExtensions = [
  "svg",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
];

function registerPartials() {
  const partials = ["seo", "sidebar"];
  partials.forEach((name) => {
    const partialPath = `templates/partials/${name}.html.hbs`;
    const partial = fs.readFileSync(partialPath).toString("utf-8");
    const partialName = name + "Partial";
    handlebars.registerPartial(partialName, partial);
  });
}

const unlink = (absolutePath) =>
  fs.unlink(
    absolutePath,
    (err) => !err && console.log(absolutePath + " deleted!")
  );

const isImage = (filename) => {
  const imgExtRegex = new RegExp(`\\.(${defaultImageExtensions.join("|")})$`);
  return imgExtRegex.test(filename);
};

function removeImages(absolutePath) {
  const idx = imageFiles.findIndex((file) => {
    const fileNoExt = file.match(/(.+?)(\.[^\.]+$|$)/)[1];
    const image = new RegExp(`^(.*?(\(${fileNoExt}))[^$]*)$`);
    return image.test(absolutePath);
  });
  idx === -1 && unlink(absolutePath);
}

function removePages(absolutePath, file) {
  const match = (str) => str.match(/(.+?)(\.[^\.]+$|$)/)[1];
  const idx = pageFiles.findIndex((name) => match(name) === match(file));
  idx === -1 && unlink(absolutePath);
}

async function handleRemovedFiles() {
  const outputDirectory = "dist/";
  function throughDirectory(directory) {
    fs.readdirSync(directory).forEach((file) => {
      const absolute = path.join(directory, file);
      if (fs.statSync(absolute).isDirectory()) {
        return throughDirectory(absolute);
      } else {
        isImage(absolute)
          ? removeImages(absolute)
          : removePages(absolute, file);
      }
    });
  }
  throughDirectory(outputDirectory);
}

async function copyImages() {
  const inputDir = "images/";
  const outputDir = "dist/images/";
  fs.readdirSync(inputDir).forEach((filename) => {
    imageFiles.push(filename);
    const inPath = inputDir + filename;
    const outPath = outputDir + filename;
    fs.ensureDir(path.dirname(outPath));
    resizeImages(inPath, outputDir, filename);
  });
}

async function init() {
  const inputDirectory = "pages/";

  // Partials
  registerPartials();

  copyImages();

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
  handleRemovedFiles();
}

init();
