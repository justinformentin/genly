# Genly

All the cool tools have short, simple, cutesy names, so I wanted to be a tool, too.

## About

This is a site generator. I tried finding the simplest site generator possible, and I didn't have any luck. I want to take a little bit of html, markdown, and a few images, and turn that into a proper multi-page site with SEO, resized and optimized image sets, and whatever else I will likely realize is necessary as this develops.

I will keep a log of changes I make, along with my thought process at the time because I know from experience I will inevitably come back to this project a year from now and have no idea what I was trying to do.

## Structure

This is the structure I am envisioning. It is subject to change.

```bash
├── public # Built website
│   └── blog
│       └── blog-post-name
│           ├── index.html
│           ├── image1x.jpg
│           ├── image2x.jpg
│           └── image3x.jpg
│       └── index.html
│   └── index.html
├── config 
├── site 
│   └── blog
│       └── 2022-09-16
│           ├── index.md
│           └── image.jpg
│       └── index.html
│   └── index.html
├── templates # Handlebar templaes
│   └── layouts
│       ├── post
│       └── page
│   └── partials
│       ├── seo.html.hbs
│       └── sidebar.html.hbs
└── scripts # Build scripts
```

## Log

### 2022-09-15

The idea:

- Make some handlebars templates for chunks of shared HTML - the head, meta tags, layout containers, post/page structure, a sidebar.
- Make some HTML and Markdown files.
- Use a Markdown to HTML converter
- If file is an HTML page:
  - wrap in handlebars page layout
- If file is a Markdown post:
  - Get Frontmatter for handlebars and parsing purposes
  - Convert MD to HTML
  - Use handlebars to wrap converted HTML in layout HTML
  - Parse HTML?
- If file is an image:
  - Run the image file through Sharp, make a few different sizes for responsiveness, plus a very low-res version for initial image load on slow machines/connections.

### 2022-09-16

#### Image handling

Wrote image parser to turn single image into multiple images of varying sizes plus low res version. Need to look deeper into how to make full use of Remark/Rehype plugins. 

From what the documentation tells me, I should be able to essential do a quick and easy check for image node using the HTML AST, and if it is, add an `srcset` property. 

I know I will want to do more complicated node editing and adding new custom nodes in between children, so I need to look at some real world examples since the documentation I feel the documentation is lacking here. The way I'm doing it currently seems pretty stupid and convoluted, breaking the frontmatter, markdown, html, and custom image node rendering into multiple steps. When I try to put them together into a single pipe, it doesn't come out correctly. I feel this should be possible though.

#### Tested Marked vs Remark/Rehype/Unify

I looked at `marked` to use instead of `remark`, and it provides a way to edit and add custom nodes so easily it's amazing. You just add a custom renderer object to the markdown parser, with properties being functions for each AST node - heading, image, etc. Dealing with it this way is exactly how I imagined it in my head. Unfortunately, it looks like `marked` is not as "plugin mature" as `remark`. 

Remark/Rehype/Unified looks like it has a very active community, with a list of plugins that handles everything that you need to do. 

I'm coming back to this later, and now I'm not so sure. At first glance, it looked like Remark was easier. For example, I want to be able to take markdown frontmatter, parse it, and use that data to do things like create the page slug, pass the title to handlebars to add to the html file's title tag, etc. But it's never that easy.

It feels like everything with remarked is just a neverending chain of plugins. You need the plugin `remark-frontmatter` to remove the frontmatter from the markdown file. If it's being removed, I'd expect you to be able to access it to parse. Kind of, but all you get the stringified mess. You need to use the plugin `remark-parse-frontmatter` to be able to parse it. I want to just add this to the pre-existing markdown to html pipe. Nope, doesn't work. I need to extract this logic to be a separate pipe that just deals with the frontmatter on it's own, *then* handle the frontmatter again in the parsing pipe to remove it.

It's the same story with the custom img markup I want. I can't just pass in the custom render logic that acts on the AST. I need to parse the markdown fully in it's own pipe, then parse, sanitize, format, and render the custom img markdown in another pipe. Each plugin/action/whatever in the pipe already returns the AST, why do I need to split everything up into 3 pieces when I want to do 2 very simple actions?

It looks like a package called `grey-matter` to parse the frontmatter when using `marked`. I think I need to look into `marked` more because while it might not has as many plugins, do I really even want that if the code becomes convoluted as a result? Maybe I'm just not groking remark/unified, and it'll click after more testing. Also remember to wrap added attributes in `""`, for example `srcset=${}` works with `remark`, but with `marked` you need `srcset="${}"` to work properly.

#### Structure

Do I want the input directory's structure to mirror the expected output directory's structure? For example, to get

```bash
├── public # Built website
│   └── blog
│       └── blog-post-name
│           ├── index.html
│           ├── image1x.jpg
│           ├── image2x.jpg
│           └── image3x.jpg
│       └── index.html
│   └── index.html
```

Do I want 

```bash
├── site 
│   └── blog
│       └── 2022-09-16
│           ├── index.md
│           └── image.jpg
│       └── index.html
│   └── index.html
```

or

```bash
├── site 
│   └── content
│       └── blog
│           └── 2022-09-16
│               ├── index.md
│               └── image.jpg
│   └── pages
│       └── blog
│           └── index.html
│       └── index.html
```

I feel the second option makes no sense, and I'm not sure why I was even thinking about it. The idea is to either have it mirror the output exactly, or separate everything into chunks - pages, posts, etc. What would be the benefit of separating everything? Meanwhile, mirroring the output would make parsing and converting easier. Instead of taking separate pages and matching them with posts, I would just need to copy everything over as it stands.

### 2022-09-17

#### Structure

Coming back to the structure after moving some things around, I'm still not sure what makes the most sense. Now that I've tested both structures it's clear what the pros and cons are.

If I mirror the structure, the conversion logic will essentially need to be one big conditional - check if file is HTML, or MD, or Image. And then I will need to change the blog post files directory from `2022-09-17` to `blog-post-title` because I do not want to have a bunch of blog posts all organized by title, it'll be hard to find anything - chronologically is much easier to look at. The other issue is that it kind of feel weird to be mixing multiple file types. I'd ideally want all HTML files together, all MD files together, etc. 

If I don't mirror the structure, I'll need to compare directories to pages. For example, I'll have a `content/blog` directory, and a `pages/blog.html`. I'd need to convert that into `public/blog/index.html. It's not as straightforward as mirroring.