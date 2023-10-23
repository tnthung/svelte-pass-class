import {
  JSDOM,
} from "jsdom";

import {
  randomUUID,
  createHash,
}  from "crypto";

import type {
  PreprocessorGroup,
  MarkupPreprocessor,
} from "svelte/compiler";


type PreprocessorOptions = {
};


type SELECTOR = string;
type UUID     = string;


export default function (option?: PreprocessorOptions): PreprocessorGroup {
  const {

  } = option ?? {};


  const CLASS_NAME = "\\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)";


  const markup: MarkupPreprocessor = ({ content, filename }) => {
    const THIS_HASH = Hashing(content, filename ?? randomUUID());

    // Extract the script block from the content
    let { block: script, content: __c1 } = ExtractBlock(content, "script");
    script  = script.trim() || `<script>\n</script>`;
    content = __c1.trim();

    let isTS = false;
    {
      const match = script.match(/^<script\s+(.*?)>/);
      if (match) {
        const attrs = match[1];
        isTS = attrs.includes("lang=\"ts\"") ||
               attrs.includes("type=\"ts\"");
      }
    }

    const appendScript = (code: string) => {
      script = `${script.slice(0, script.length-9)}${code}\n</script>`;
    };

    // Extract the style block from the content
    let { block: style, content: __c2 } = ExtractBlock(content, "style");
    style   = style.trim() || `<style>\n</style>`;
    content = __c2.trim();

    // Replace self-closing tags with proper closing tags
    content = content.replace(
      /<([^ >]+?)(?:\s+([^>]*?))?\/>/g,
      "<$1 $2></$1>");


    // Create a DOM from the content
    const dom = new JSDOM(content);
    const doc = dom.window.document;
    const all = doc.querySelectorAll("*");


    // Component essential information
    const components    = {} as Record<string, string>;
    const exportedMap   = new Set() as Set<string>; // exported classes
    const usedClasses   = new Set() as Set<string>; // all classes used in the component
    const passedClasses = new Set() as Set<string>; // all classes passed to the children

    const addClass = (cls: string, passed: boolean) => {
      if (cls === "") return;

      if (passed)
        passedClasses.add(cls);
      usedClasses.add(cls);
    }


    // Extract the imported components
    script.replace(
      /import ([A-Z_][a-zA-Z0-9_]*) from .*?\.svelte/g,
      (_, n) => {
        if (n.toUpperCase() in components) throw new Error(
          `The component "${n}" may be imported more than once. (case-insensitive)`);

        components[n.toUpperCase()] = n;
        return "";
      });

    // Extract the exported classes
    style = style.replace(
      new RegExp(`:export\\(\\s*${CLASS_NAME}\\s*\\)`, "g"),
      (_, c) => {
        if (exportedMap.has(c)) throw new Error(
          `The class "${c}" is exported more than once`);

        exportedMap.add(c);
        return `.${c}`;
      });


    // Process each element &&
    // Extract the used and passed classes
    all.forEach(ele => {
      const attrs = ele.attributes;

      // If is a component
      if (ele.tagName in components) {

      }

      // If is a normal element
      else {

      }
    });
  };


  return {
    name: "svelte-preprocess-class",
    markup,
  };
}


// Extract a block from the content
function ExtractBlock(
  content: string,
  tag    : string,
): {
  block  : string;
  content: string;
} {
  let tagS = content.indexOf(`<${tag}`);
  let tagE = content.indexOf(`</${tag}>`);

  if (tagS === -1 || tagE === -1)
    return { block: "", content };

  tagE += tag.length+3;

  return {
    block  : content.slice(tagS, tagE),
    content: content.slice(0, tagS) + content.slice(tagE),
  };
}


// Create a hash from the fragments
function Hashing(...frag: string[]): string {
  const hash = createHash("sha256");
  for (const f of frag) hash.update(f);
  return `spc-${hash.digest("hex").toString().slice(0, 10)}`;
}













// const ALLOW_COMPLEX_SELECTOR = false;


// const classSwapTable      = "__spc_class_swap_table__";
// const classSwapTableField = `export let ${classSwapTable} = {};\n`;


// const reg_importComponent   = /import ([A-Z_][a-zA-Z_0-9]*) from .*\.svelte.*/g;
// const reg_exportedClass     = /:export\(\.((?:[a-zA-Z0-9_-]|\\[^a-zA-Z0-9_ -])+)\)/g;
// const reg_declaredClass     = /:let\((.*)\)\.((?:[a-zA-Z0-9_-]|\\[^ a-zA-Z0-9_-])+)/g;
// const reg_classAttribute    = /class:((?:[a-zA-Z0-9_-]|\\[^ a-zA-Z0-9_-])+)(?:\s*=\s*"((?:[a-zA-Z0-9_-]|\\[^ a-zA-Z0-9_-])+?)")?/g
// const reg_classAttributeEle = /class:((?:[a-zA-Z0-9_-]|\\[^ a-zA-Z0-9_-])+)(?:\s*=\s*\{(.*?)\})?/g
// const reg_openOrSelfHTMLTag = /<([^ />]+)\s*(.*?)>/g;



// // Find the imported components
// function findImported(content: string) {
//   const imported = [] as string[];

//   content.replace(
//     reg_importComponent,
//     (_, name) => {
//       imported.push(name);
//       return "";
//     });

//   return imported;
// }


// // Check if 2 selectors are equivalent
// function isSelectorEquivalent(s1: string, s2: string) {
//   if (!ALLOW_COMPLEX_SELECTOR) return false;

//   // WIP
//   throw new Error("Not implemented");
// }


// export const markup: MarkupPreprocessor = ({ content, filename }) => {
//   // compute the hash of the component
//   const selfHash = getHash(content, filename ?? "");

//   // extract the script block from the content
//   let { block: script, content: __c1} =
//     extractBlock(content, "script");
//   script  = script.trim() || `<script>\n</script>`;
//   content = __c1.trim();

//   function appendScript(code: string) {
//     const endTagPos = script.indexOf("</script>");
//     script =
//       script.slice(0, endTagPos) +
//       code +
//       script.slice(endTagPos)
//   }


//   // extract the style block from the content
//   let { block: style, content: __c2 } =
//     extractBlock(content, "style");
//   style   = style.trim() || `<style>\n</style>`;
//   content = __c2.trim();


//   // get all imported components
//   const component = findImported(script);


//   // get all exported classes & transform them
//   const exported = [] as string[];

//   style = style.replace(
//     reg_exportedClass,
//     (_, name) => {
//       exported.push(name);
//       return `.${name}`;
//     });


//   // add the class swap table field if has exported classes
//   if (exported.length > 0)
//     appendScript(classSwapTableField);


//   // process the declared classes
//   const declaredSwapTable = {} as Record<string, Record<string, string>>;

//   style = style.replace(
//     reg_declaredClass,
//     (_, selector, cls) => {
//       const hash = getHash(selfHash, selector, cls);

//       if (ALLOW_COMPLEX_SELECTOR)
//         for (const [s, c] of Object.entries(declaredSwapTable))
//           if (isSelectorEquivalent(s, selector)) {
//             c[cls] = hash;
//             return `:global(.${hash})`;
//           }

//       else if (!component.includes(selector))
//         throw new Error(`The selector "${selector}" is not a component`);

//       (declaredSwapTable[selector] ??= {})[cls] = hash;

//       return `:global(.${hash})`;
//     });


//   // replace the use of the exported classes with swap table
//   // and get the list that is passed to the children
//   const passedMap = {} as Record<string, string>;

//   content = content.replace(
//     reg_openOrSelfHTMLTag,
//     (_, tag: string, attrs: string) => {
//       // if is the component
//       if (component.includes(tag)) {
//         if (ALLOW_COMPLEX_SELECTOR) {
//           throw new Error("Not implemented");
//         }

//         else {
//           const declared   = declaredSwapTable[tag] ?? {};
//           let   swapTable  = {} as Record<string, string>;
//           const useDeclare = [] as string[];

//           attrs = attrs.replace(
//             reg_classAttribute,
//             (_, i: string, o: string) => {
//               o ??= i;

//               if (declared[i])
//                 useDeclare.push(i);

//               swapTable[i] = passedMap[o] ??= getHash(selfHash, o);
//               return "";
//             });

//           swapTable = { ...(
//             Object.fromEntries(Object.entries(declared)
//               .filter(([k]) => !useDeclare.includes(k)))
//           ), ...swapTable };

//           let tableString = "";

//           for (const k in swapTable) {
//             if (!exported.includes(k)) {
//               tableString += `"${k}": "${swapTable[k]}",`;
//               continue;
//             }

//             tableString += `"${k}": ${classSwapTable}["${k}"] ?? "${swapTable[k]}",`
//           }

//           attrs = `${classSwapTable}={{${tableString}}} ${attrs}`;
//         }
//       }

//       else {
//         const swapTable = {} as Record<string, string>;

//         attrs = attrs.replace(
//           reg_classAttributeEle,
//           (match, i: string, c: string) => {
//             if (!exported.includes(i)) return match;

//             const name = "_" + randomUUID().replaceAll("-", "_");
//             appendScript(`$: ${name} = (${c ?? i}) ? (${classSwapTable}["${i}"] ?? "${i}") : "";\n`);

//             swapTable[i] = name;
//             return "";
//           });

//         let swapped = false;

//         attrs = attrs.replace(
//           /class="([^"]*?)"/g,
//           (_, c: string) => {
//             let classes = c.split(" ").filter(c => c !== "");

//             classes = classes.map(c => {
//               const swap = swapTable[c];
//               if (swap) delete swapTable[c];

//               const name = swap ?? (exported.includes(c)
//                 ? `{${classSwapTable}["${c}"] ?? "${c}"}`
//                 : c);
//               return name;
//             });

//             for (const swap of Object.values(swapTable)) {
//               classes.push(`{${swap}}`);
//             }

//             swapped = true;

//             return `class="${classes.join(" ")}"`;
//           });

//         if (!swapped && Object.keys(swapTable).length > 0) {
//           attrs = `class="${Object.values(swapTable).join(" ")}" ${attrs}`
//         }
//       }

//       return `<${tag} ${attrs.trim()}>`;
//     });


//   // add the hashed class to global
//   for (const [k, v] of Object.entries(passedMap))
//     style = style.replace(
//       new RegExp(`(?<=^\\s*)\\.${k}\\b`, "gm"),
//       `:global(.${v}), .${k}`);


//   const code = `
//     ${script}\n
//     ${content}\n
//     ${style}`;

//   return { code };
// };
