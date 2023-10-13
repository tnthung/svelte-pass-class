This is what I came up with.


## Define the component

You declare the component with `:export` pseudo-element to expose the class and optionally give it a
fallback case. The `:export` only accept single class selector.

```svelte
<!-- Foo.svelte -->

<div class="a">A</div>
<div class="b">B</div>

<style>
  :export(.a) {
    color: red;
  }

  .b {
    color: blue;
  }
</style>
```


## Use the component

Then, you can pass in the classes with 2 ways:

1. Using `class` prop
1. Using `style` tag


### Using `class` prop

This method will have a higher specificity than the `style` tag, because it is applied directly to
the specific component.

```svelte
<!-- App.svelte -->

<script>
  import Foo from './Foo.svelte';
</script>

<!-- To pass the class, use `class:in="out"` or `class="in:out"` -->
<Foo class:a="green"/>

<Foo class="a:blue"/>

<!-- If the class name outside is equal to the class exported
     you can omit the class name -->
<Foo class:a/>

<Foo class="a"/>

<style>
  .green {
    color: green;
  }

  .blue {
    color: blue;
  }

  .a {
    color: orange;
  }
</style>
```


### Using `style` tag

This method can be used to style multiple components at once with `:let` pseudo-element. The `:let`
accepts an element selector and the relation between elements. After the parenthesis, use regular
class selector to style the element.

The component inside the parenthesis cannot be selected with `.class`, `#id` or `[attr]`, because
they will be considered as the props passed into the component. But relations on the other hand can
be used because

```svelte
<!-- App.svelte -->

<script>
  import Foo from './Foo.svelte';
</script>

<Foo /> <!-- This will be purple -->
<Foo /> <!-- This will be purple -->
<div />
<Foo /> <!-- This will be yellow -->

<style>
  :let(Foo).a {
    color: purple;
  }

  :let(div + Foo).a {
    color: yellow;
  }
</style>
```

If both methods are used and there are overlapping classes, the `class` prop will have higher
specificity than the `style` tag.

```svelte
<!-- App.svelte -->

<script>
  import Foo from './Foo.svelte';
</script>

<!--
  This will be green text with yellow background.
 -->
<Foo class="a">

<style>
  :let(Foo).a {
    color: purple;
    background-color: yellow;
  }

  .a {
    color: green;
  }
</style>
```


## Compilation

Assuming the code is as follows.

```svelte
<!-- Bar.svelte -->

<script>
  import Foo from './Foo.svelte';
</script>

<Foo class="a">

<style>
  :let(Foo).a {
    color: purple;
    background-color: yellow;
  }

  .a {
    color: green;
  }
</style>
```

After the compilation, maybe with preprocessor, will yield something like this.

```html
<div class="s-bbbbbbbb s-ffffffff a">A</div>
<div class="s-ffffffff b">B</div>

<style>
  /* These are from the component defaults */
  .s-ffffffff.a {
    color: red;
  }

  .s-ffffffff.b {
    color: blue;
  }

  /* This is from :let(Foo).a */
  .s-bbbbbbbb.s-ffffffff.a {
    color: purple;
    background-color: yellow;
  }

  /* This is from .a */
  .s-bbbbbbbb.a {
    color: green;
  }
</style>
```

If the class is exposed, the html generated will add a class that indicates the parent component.
Such as `s-bbbbbbbb` in the example above indicates the `Bar` component, and only first `div` will
have this class because `.a` is `:export`ed while `.b` is not.


### Complex example

Consider a more complex example with 3 components `A`, `B` and `C`, where `C` uses `A` and `B`, and
`B` uses `A` while forward the class `.a`. The components are defined as follows.

```svelte
<!-- A.svelte -->

<div class="a">A</div>

<style>
  :export(.a) {
    color: red;
  }
</style>
```

```svelte
<!-- B.svelte -->

<script>
  import A from './A.svelte';
</script>

<A class="a"/>

<style>
  :export(.a) {
    color: purple;
  }
</style>
```

```svelte
<!-- C.svelte -->

<script>
  import A from './A.svelte';
  import B from './B.svelte';
</script>

<A class="a:b"/>
<B class="a"/>

<style>
  .a {
    color: yellow;
  }

  .b {
    color: purple;
  }
</style>
```

This will yield something like this.

```html
<div class="s-cccccccc s-aaaaaaaa b">A</div>
<div class="s-cccccccc s-bbbbbbbb s-aaaaaaaa a">A</div>

<style>
  /* This is from the component A */
  .s-aaaaaaaa.a {
    color: red;
  }

  /* This is from the component B */
  .s-bbbbbbbb.a {
    color: purple;
  }

  /* These are from the component C */
  .s-cccccccc.a {
    color: yellow;
  }

  .s-cccccccc.b {
    color: purple;
  }
```
