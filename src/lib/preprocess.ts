import { randomUUID } from "crypto";
import { createHash } from "crypto";

import type { MarkupPreprocessor } from "svelte/compiler";


const ALLOW_COMPLEX_SELECTOR = false;


const classSwapTable      = "__spc_class_swap_table__";
const classSwapTableField = `export let ${classSwapTable} = {};\n`;


const reg_importComponent   = /import ([A-Z_][a-zA-Z_0-9]*) from .*\.svelte.*/g;
const reg_exportedClass     = /:export\(\.((?:[a-zA-Z0-9_-]|\\[^a-zA-Z0-9_ -])+)\)/g;
const reg_declaredClass     = /:let\((.*)\)\.((?:[a-zA-Z0-9_-]|\\[^ a-zA-Z0-9_-])+)/g;
const reg_classAttribute    = /class:((?:[a-zA-Z0-9_-]|\\[^ a-zA-Z0-9_-])+)(?:\s*=\s*"((?:[a-zA-Z0-9_-]|\\[^ a-zA-Z0-9_-])+?)")?/g
const reg_classAttributeEle = /class:((?:[a-zA-Z0-9_-]|\\[^ a-zA-Z0-9_-])+)(?:\s*=\s*\{(.*?)\})?/g
const reg_openOrSelfHTMLTag = /<([a-zA-Z_][a-zA-Z0-9_-]+)\s*([^>]*)>/g;


// Function to get the hash of a component
function getHash(...frag: string[]) {
  const hashing = createHash("sha256");
  for (const f of frag) hashing.update(f);
  return `spc-${hashing.digest("hex").slice(0, 10)}`;
}


// Function to extract a block from the content
function extractBlock(content: string, tag: string) {
  const tagS = content.indexOf(`<${tag}`);
  const tagE = content.indexOf(`</${tag}>`)+tag.length+3;

  if (tagS === -1 || tagE === tag.length+2)
    return { block: "", content };

  const block = content.slice(tagS, tagE);
  content = content.slice(0, tagS) + content.slice(tagE);

  return { block, content };
}


// Find the imported components
function findImported(content: string) {
  const imported = [] as string[];

  content.replace(
    reg_importComponent,
    (_, name) => {
      imported.push(name);
      return "";
    });

  return imported;
}


// Check if 2 selectors are equivalent
function isSelectorEquivalent(s1: string, s2: string) {
  if (!ALLOW_COMPLEX_SELECTOR) return false;

  // WIP
  throw new Error("Not implemented");
}


const markup: MarkupPreprocessor = ({ content, filename }) => {
  // compute the hash of the component
  const selfHash = getHash(content, filename ?? "");

  // extract the script block from the content
  let { block: script, content: __c1} =
    extractBlock(content, "script");
  script  = script.trim() || `<script></script>`;
  content = __c1.trim();

  function appendScript(code: string) {
    const endTagPos = script.indexOf("</script>");
    script =
      script.slice(0, endTagPos) +
      code +
      script.slice(endTagPos)
  }


  // extract the style block from the content
  let { block: style, content: __c2 } =
    extractBlock(content, "style");
  style   = style.trim() || `<style></style>`;
  content = __c2.trim();


  // add the class swap table field
  appendScript(classSwapTableField);


  // get all imported components
  const component = findImported(script);


  // get all exported classes & transform them
  const exported = [] as string[];

  style = style.replace(
    reg_exportedClass,
    (_, name) => {
      exported.push(name);
      return `.${name}`;
    });


  // process the declared classes
  const declaredSwapTable = {} as Record<string, Record<string, string>>;

  style = style.replace(
    reg_declaredClass,
    (_, selector, cls) => {
      const hash = getHash(selfHash, selector, cls);

      if (ALLOW_COMPLEX_SELECTOR)
        for (const [s, c] of Object.entries(declaredSwapTable))
          if (isSelectorEquivalent(s, selector)) {
            c[cls] = hash;
            return `:global(.${hash})`;
          }

      else if (!component.includes(selector))
        throw new Error(`The selector "${selector}" is not a component`);

      (declaredSwapTable[selector] ??= {})[cls] = hash;

      return `:global(.${hash})`;
    });


  // replace the use of the exported classes with swap table
  // and get the list that is passed to the children
  const passedMap = {} as Record<string, string>;

  content = content.replace(
    reg_openOrSelfHTMLTag,
    (_, tag: string, attrs: string) => {
      // if is the component
      if (component.includes(tag)) {
        if (ALLOW_COMPLEX_SELECTOR) {
          throw new Error("Not implemented");
        }

        else {
          const declared   = declaredSwapTable[tag] ?? {};
          let   swapTable  = {} as Record<string, string>;
          const useDeclare = [] as string[];

          attrs = attrs.replace(
            reg_classAttribute,
            (_, i: string, o: string) => {
              o ??= i;

              if (declared[i])
                useDeclare.push(i);

              swapTable[i] = passedMap[o] ??= getHash(selfHash, o);
              return "";
            });

          swapTable = { ...(
            Object.fromEntries(Object.entries(declared)
              .filter(([k]) => !useDeclare.includes(k)))
          ), ...swapTable };

          attrs = `${classSwapTable}={${JSON.stringify(swapTable)}} ${attrs}`;
        }
      }

      else {
        const swapTable = {} as Record<string, string>;

        attrs = attrs.replace(
          reg_classAttributeEle,
          (match, i: string, c: string) => {
            if (!exported.includes(i)) return match;

            const name = "_" + randomUUID().replaceAll("-", "_");
            appendScript(`$: ${name} = (${c ?? i}) ? (${classSwapTable}["${i}"] ?? "${i}") : "";\n`);

            swapTable[i] = name;
            return "";
          });

        let swapped = false;

        attrs = attrs.replace(
          /class="([^"]*?)"/g,
          (_, c: string) => {
            let classes = c.split(" ").filter(c => c !== "");

            classes = classes.map(c => {
              const swap = swapTable[c];
              if (swap) delete swapTable[c];

              const name = swap ?? (exported.includes(c)
                ? `{${classSwapTable}["${c}"] ?? "${c}"}`
                : c);
              return name;
            });

            for (const swap of Object.values(swapTable)) {
              classes.push(`{${swap}}`);
            }

            swapped = true;

            return `class="${classes.join(" ")}"`;
          });

        if (!swapped && Object.keys(swapTable).length > 0) {
          attrs = `class="${Object.values(swapTable).join(" ")}" ${attrs}`
        }
      }

      return `<${tag} ${attrs.trim()}>`;
    });


  // add the hashed class to global
  for (const [k, v] of Object.entries(passedMap))
    style = style.replace(
      new RegExp(`(?<=^\\s*)\\.${k}\\b`, "gm"),
      `:global(.${v}), .${k}`);


  const code = `
    ${script}\n
    ${content}\n
    ${style}`;

  return { code };
};


export default { markup };
