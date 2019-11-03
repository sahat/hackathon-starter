# How to use custom themes

The starter ships with default theme provided for your convienance. You could use that theme `as is` in your project, or use it as the starting point for your own custom theme.

## How to use custom Bootswatch theme

The project also supports custom themes based on the Bootswatch project: [Free themes for Bootstrap](https://bootswatch.com/). Bootswatch support is already added to the project configuration file and install with the dependencies as part of the `npm install`.

To switch to one of the custom Bootswatch themes, open `public/css/main.scss` file modify paths to theme and variables pointing to the node modules location of the Bootswatch theme. Here are couple of example changes:

### Flatly theme

```diff
@@ -1,4 +1,4 @@
-@import "themes/default/variables";
+@import "node_modules/bootswatch/dist/flatly/variables";

 @import "node_modules/bootstrap/scss/bootstrap";
 @import "node_modules/@ladjs/bootstrap-social/bootstrap-social.scss";
@@ -7,7 +7,7 @@
 @import "node_modules/@fortawesome/fontawesome-free/scss/regular";
 @import "node_modules/@fortawesome/fontawesome-free/scss/solid";

-@import "themes/default/default";
+@import "node_modules/bootswatch/dist/flatly/bootswatch";

 // Scaffolding
 // -------------------------
```

### Cosmo theme

```diff
@@ -1,4 +1,4 @@
-@import "themes/default/variables";
+@import "node_modules/bootswatch/dist/cosmo/variables";

 @import "node_modules/bootstrap/scss/bootstrap";
 @import "node_modules/@ladjs/bootstrap-social/bootstrap-social.scss";
@@ -7,7 +7,7 @@
 @import "node_modules/@fortawesome/fontawesome-free/scss/regular";
 @import "node_modules/@fortawesome/fontawesome-free/scss/solid";

-@import "themes/default/default";
+@import "node_modules/bootswatch/dist/cosmo/bootswatch";

 // Scaffolding
 // -------------------------
```

### Materia theme

```diff
@@ -1,4 +1,4 @@
-@import "themes/default/variables";
+@import "node_modules/bootswatch/dist/materia/variables";

 @import "node_modules/bootstrap/scss/bootstrap";
 @import "node_modules/@ladjs/bootstrap-social/bootstrap-social.scss";
@@ -7,7 +7,7 @@
 @import "node_modules/@fortawesome/fontawesome-free/scss/regular";
 @import "node_modules/@fortawesome/fontawesome-free/scss/solid";

-@import "themes/default/default";
+@import "node_modules/bootswatch/dist/materia/bootswatch";

 // Scaffolding
 // -------------------------
```

## How to use other custom theme

As the project ships with the SASS toolign included, it should be quite easy to add another custom theme to the project. Similary to the Bootswatch custom theme, in order to modify project theme:

- add your custom theme as dependnecy, either by copying assets into project directory or as package installed by NPM.
- include theme inhe `public/css/main.scss` and rebuild the project.
