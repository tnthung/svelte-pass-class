// import PassClass from "./index.js";

// import { preprocess } from "svelte/compiler";


const code = `

<script>
  import Foo from "Foo.svelte";
</script>


<div class="a d" class:b={0==10}></div>

<Foo class:a="c"></Foo>

<svelte:component ></svelte:component>


<style>
  :export(.a) {

  }

  .b {

  }

  .c {

  }

  .d {

  }
</style>

`;

// preprocess(, PassClass());


import { JSDOM } from "jsdom";

const tmp = new JSDOM(code);

const { document } = tmp.window;

document.querySelectorAll("*").forEach(ele => {
  // console.log(ele.outerHTML);
  console.log(ele.tagName);
});
