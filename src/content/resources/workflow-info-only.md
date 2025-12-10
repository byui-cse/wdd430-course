---
title: Managing the Modern Frontend Workflow
time: 20min
---

Development workflow has become quite complicated for Web development.
Let's take a medium-sized project for example. It could have dozens of
JavaScript files, several CSS files, 3rd party libraries, and who
knows how many icons, fonts, images, etc. involved. It might be using
a CSS preprocessor like SASS or it could be transpiling the JavaScript
to make sure that new features will work in older browsers.

> Here is a potential list of tasks that could need to happen every time something changes:
>
>- Lint CSS and JavaScript to find any coding issues.
>- Run unit tests to make sure nothing got broken with your last changes
>- Compile all SCSS/LESS to CSS
>- Concatenate all CSS into one file for faster loading
>- Minify the CSS to reduce file size
>- Transpile JavaScript with Babel for wider support for older browsers
>- Concatenate all JS files into one file for faster loading
>- Minify and Uglify JavaScript to reduce size
>- Do the same for any 3rd party CSS or JS
>- Move all the production assets into a distribution directory to separate them from the development stuff
>
> Whew! That's a big list...and they have to happen A LOT!

It's no wonder that developers have produced tools to help manage all of this. This activity will introduce a simple implementation of some of these tools. The tools fall into three categories:

- **Package managers:** These keep track of all of the
external dependencies for our app. This includes development tools
and libraries we might be using. It not only knows which packages to
download, but it tracks versions as well. We are using
`npm` for our package manager.
- **Bundlers:** Bundlers handle the compiling,
transpiling, concatenating, minifying, and moving around of assets
in our project. We are using `Vite` as our bundler. Other
common bundlers are Parcel and Webpack.
- **Task managers:** These keep track of what needs to be
done and when. There will generally be scripts defined in the task
manager for each phase of development. Our project is fairly simple
so we are just using `npm` again for task manager. Other
common managers are Grunt or Gulp.

We will be using a NPM/Node-based workflow for this course this semester. It is important that you understand how these tools work together. The Team Activity 1 will walk your group through setting this workflow up.
