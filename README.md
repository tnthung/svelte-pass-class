# svelte-pass-class

> This is current experimental and totally not ready for any production.
> At current stage, this package is only a proof of concept.

This package is meant to provide the ability to pass the style classes into the child component. It
is done by using the svelte preprocessor.

# Installation

```bash
npm i -D svelte-pass-class
```

```js
// svelte.config.js
import sveltePassClass from 'svelte-pass-class';

const config = {
  // ...other settings

	preprocess: [
    sveltePassClass,
    // ...other preprocessor
  ],

  // ...other settings
};

export default config;
```

# Usage

This preprocessor introduced 2 pseudo-class, `:export` and `:let`.

## `:export`

> Syntax: `:export(.<Class name>) { /* style */ }`

The `:export` tells the preprocessor the class inside the parenthesis may be passed in from the
parent component, so don't directly apply the style to the element.

### Example

```svelte
<div class="a">Hello</div>

<style>
  :export(.a) {
    color: red;
  }
</style>
```

will be compiled to

```svelte
<script>
  export let __spc_class_swap_table__ = {};
</script>

<div class="{__spc_class_swap_table__["a"] ?? "a"}">Hello</div>

<style>
  .a {
    color: red;
  }
</style>
```

## `:let`

> Syntax: `:let(<Component name>).<Class name> { /* style */ }`

The `:let` tells the preprocessor to apply the styles to the class field for all components it
specified. Such as `:let(Foo).bar { /* style */ }` will apply the style to the `bar` field of all
the `Foo` component.

### Example

```svelte
<script>
  import Foo from './Foo.svelte';
</script>

<Foo />
<Foo />

<style>
  :let(Foo).bar {
    color: red;
  }
</style>
```

will be compiled to

```svelte
<script>
  import Foo from './Foo.svelte';
</script>

<Foo __spc_class_swap_table__={{"bar":"spc-xxxxxxxxxx"}} />
<Foo __spc_class_swap_table__={{"bar":"spc-xxxxxxxxxx"}} />

<style>
  :global(.spc-xxxxxxxxxx) {
    color: red;
  }
</style>
```

## More Applies

Except for using `:let` to apply the styles, you can also use the `class` attribute to apply it.
Using `:let` will have a lower priority than using `class` attribute, because the `class` attribute
is closer to the element visually.

### Component

For components, you have only 1 way to apply with `class` attribute, that is `class:bar="name"`
where `bar` is the exported class name from the component and `name` is the class name you want to
apply.

To reduce the verbosity, you can also use `class:bar` as the shorthand for `class:bar="bar"`.

```svelte
<script>
  import Foo from './Foo.svelte';
</script>

<Foo class:bar          />
<Foo class:bar="foobar" />

<style>
  .bar {
    color: red;
  }

  .foobar {
    color: blue;
  }
</style>
```

will be compiled to

```svelte
<script>
  import Foo from './Foo.svelte';
</script>

<Foo __spc_class_swap_table__={{"bar":"spc-xxxxxxxxxx"}} />
<Foo __spc_class_swap_table__={{"bar":"spc-oooooooooo"}} />

<style>
  :global(.spc-xxxxxxxxxx), .bar {
    color: red;
  }

  :global(.spc-oooooooooo), .foobar {
    color: blue;
  }
```

### Element

For elements, you can use the `class` directly to apply the style. And also the method mentioned
above with little difference.

The difference is that the `class:bar={true}` in the above example is using `{}` instead of `""`,
this is because it's the native svelte syntax, but the preprocessor will still recognize it.

#### Example 1

In this example, you'll find out that before and after is the same, that is because the preprocessor
only do the transformation when the class is exported.

```svelte
<div class="bar" />
<div class:bar={true} />

<style>
  .bar {
    color: red;
  }
</style>
```

will be compiled to

```svelte
<div class="bar" />
<div class:bar={true} />

<style>
  .bar {
    color: red;
  }
</style>
```

#### Example 2

This example shows that the `class:bar` will be transformed.

```svelte
<div class="bar" />
<div class:bar={true} />

<style>
  :export(.bar) {
    color: red;
  }
</style>
```

will be compiled to

```svelte
<script>
  export let __spc_class_swap_table__ = {};

  $: __random_uuid__ = (true) ? (__spc_class_swap_table__["bar"] ?? "bar") : "";
</script>

<div class="{__spc_class_swap_table__["bar"] ?? "bar"}" />
<div class="{__random_uuid__}" />

<style>
  .bar {
    color: red;
  }
</style>
```

## Forwarding

If the exported class is passed into the child component, the preprocessor will forward the class
to the child component.

```svelte
<script>
  import Child from './Child.svelte';
</script>

<Child class:bar />

<style>
  :export(.bar) {
    color: red;
  }
</style>
```

will be compiled to

```svelte
<script>
  import Child from './Child.svelte';

  export let __spc_class_swap_table__ = {};
</script>

<Child __spc_class_swap_table__={{"bar": __spc_class_swap_table__["bar"] ?? "bar"}} />

<style>
  .bar {
    color: red;
  }
</style>
```
