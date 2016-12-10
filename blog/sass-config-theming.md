# Sass theming with configuration files

For well over the last year or so I’ve been working on a large scale project with multiple websites based on the same codebase. All these sites require the same core functionality but at times differed with extra features or unique styles. When it came to styling the main issue we found was the need for certain sites to have an entirely different theme to the others. Because of this we decided to use Sass to create the CSS for the sites. In this article I want to talk you through how we went about editing themes for the various, different sites.

To give a brief bit of context, the project is on WordPress using a parent/child theme structure. There was a core parent WordPress theme with all the main functionality that each site would use. Along with child themes for each of the different market sites.

## Configuring your Sass

To start with I want to take a brief look at how we typically use configuration files in our Sass. Below is a basic folder structure for one of our projects:

	assets/
	`- scss/
		|- base/
		|- components/
		|- pages/
		|- settings/
			|- _colors.scss
			|- _layout.scss
			`- _fonts.scss
		|- tools/
		|- vendor/
		`- main.scss

I’ve expanded the settings folder above, in which we keep a variety of separate partials for each group of settings. The aim is to keep these configuration files as small and as easy to navigate as possible. Something I’ve been thinking about since reading Stu Robson’s article on [Rethinking your Sass variables](http://alwaystwisted.com/articles/rethinking-your-sass-variables).

If we took a look inside of the colors partial for instance we’d see something like this:

	// COLORS
	// ———————————————————————————

	$clr-lightblue:#4BCEFA;
	$clr-pink:#F96EC4;
	$clr-orange:#FFB400;
	$clr-green:#8DD400;
	$clr-purple:#009edc;

The settings partials get included first in our main manifest file allowing us to use these variables throughout the remaining partials. This means that all the color declarations are in the same location and easily found.


## Structure

Using the above method of configuration is fine in the context of a single style sheet with a single theme. In our situation we had a single core WordPress theme and several child themes that would all require style sheets - there is an issue of scale here which I’ll come on to a little later on.

To create style sheets for each of the individual child themes we set up our Sass structure to match our WordPress theme structure.

	scss/
	|- australia/
	|- china/
	|- core/
	`- uk

	themes/
	|- australia/
	|- china/
	|- core/
	`- uk

Each market in the `scss` directory would have it’s own style.scss which would compile directly into the corresponding theme in the themes directory.

**Note**: We decided on this structure based on that we were using Compass and Grunt to build out our Sass and this seemed to be the most efficient method at the time.

## Configuring multiple themes

So far I’ve been through the configuration setup and a bit about the structure we had in place. Now, let’s get down to how we actually used the configuration files to modify the different themes.

To start off with we had a core or default configuration thanks to the core/parent theme. To create each individual theme style sheet, we were able to include our core partial in each of the style.scss manifests. We could then add site-specific partials to add/overwrite any styles required for that market.

```sass
// Import the core partial containing all base site styles
@import “../core/core”;

// Import site-specific styles
@import “partials/campaigns/competition”;
@import “partials/campaigns/promotion-spring”;
```

### Overwriting configurations

So far the method we have for creating our multiple style sheets is working for overwriting styles fine. But overwriting configurations is slightly different. When importing the core partial into each of the market sites, what we’re getting is all the styles that have already used our configured variables. Once that’s imported that there’s no way to overwrite what’s already configured. In this case we needed to add custom configurations first before the core styles get imported. To do this we had two options:

1. Create a set of configuration partials for each market, or
2. Create a default set of configurations and overwrite them where necessary for each market.

Either is possible and entirely achievable. In both cases the individual market sites style.scss would look a bit like this:

	// Import configuration partials
	@import “settings/colors”;
	@import “settings/fonts”;

	// Import the core partial containing all base site styles
	@import “../core/core”;

	// Import site-specific styles
	…

When creating a set of entirely different themes where in most cases all the settings will likely change, the first option might be the most suitable. In our case however, we had a lot of sites that would almost always have the same color schemes, with only a few needing entirely different settings.

### Using `!default`

To allow us to create our configuration of default settings we needed to make use of the `!default` flag. The `!default` flag tells Sass that if there isn’t already a variable set with the name specified, then use this one.

> […] if the variable has already been assigned to, it won’t be re-assigned, but if it doesn’t have a value yet, it will be given one.

This means the flag needs to be set on the values that you want to use if nothing else has been configured already. Going back to our color configuration file, it now looks something like this:

	// COLORS
	// ———————————————————————————

	$clr-lightblue:#4BCEFA !default;
	$clr-pink:#F96EC4 !default;
	$clr-orange:#FFB400 !default;
	$clr-green:#8DD400 !default;
	$clr-purple:#009edc !default;

With the `!default` flag in use, we can now add regular definitions of these variables to our theme-specific configurations for use instead of these default values.

// Comment: Wonder if a Sassmeister gist would be useful here?

### Naming variables

One thing we realised when we started to use different configurations for our themes was that it meant our variable names were a bit, unhelpful to say the least. The intention was honest enough but when we started doing things like this in our configurations:

	$clr-lightblue:#f02233; // Red for China

We knew something had to change to improve things.

The naming scheme we decided on was quite specific to our requirements as we had a set of sections that required individual colors. Although I’d definitely recommend sticking to a convention that will be most suitable for the project you’re working on. While having a “primary”, “secondary”, “tertiary” style naming convention might work for some, it might not work for all.

In our case, now our color variables have much more consistent names relating to the project. It certainly allowed us a lot more ease with which to identify their usage.

	$clr-brand:#4BCEFA !default; // lightblue
	$clr-kids-activities:#F96EC4 !default; // pink
	$clr-parenting:#FFB400 !default; // orange
	$clr-sustainability:#8DD400 !default; // green
	$clr-mmr:#009edc !default; // blue

## Potential pitfall: scaling

There is one area where this method does come unstuck a little: scaling. When it came to scaling this solution up to configure each of the 31 themes we currently have on the project (soon to be 33), the time to compile became astronomical. I never thought I’d be able to relate to the [compiling XKCD comic](https://xkcd.com/303/) as a front-end developer.

The reason this solution might not scale well is because for every theme we create we’re having to compile all our Sass 31 times over. Couple this with the fact we’re using Sass and Compass as our compilers (instead of the much faster LibSass) you’re looking at 3-5 seconds per file in 31 themes. Waiting somewhere between 2-3 minutes every time you want to make a change is far from productive.

There are a couple of routes we could go to solve this. The first is to compile one core style sheet with all the default styles and then several much smaller ones to add the site-specific files. This would reduce the amount we have to compile for each of the sites, while still allowing us to overwrite full configurations if we needed. Yet, because there are only a few sites that have heavy theme customisation we would be able to limit how much extra work there is.

The second option is to separate all of the color definitions from the core style sheets and use them in separate partials. We could then create a specific theme file which could be overwritten as we are doing already. We would still need to create separate partial files for site-specific modifications and features. But these could still be created separately from the core style sheet.

Both of these options will leave us with multiple output files that we’d then need to concatenate into one file to be output for the theme. This should be straight-forward for us considering we’re using Grunt and there are tasks that can take care of concatenation. We’d just need to do some testing into how efficient these solutions are, both with compile time and the relative size of the output CSS.

## Conclusion

When it comes to theming Sass can be an extremely powerful ally.  Being able to use variables to store your theme settings and have them overwritable using the `!default` flag, takes this feature far beyond just ease of reuse. Theming is also made easier when you set out the right conditions. Create an understandable project-focused naming convention, staying away from names that could be misunderstood if the value changes. And remember to be aware of potential issues like scaling, as you can see it can have a considerable effect on your workflow. Happy theming!