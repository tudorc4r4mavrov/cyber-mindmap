/* ============================================================
   Programming Languages & Frameworks region — data
   Built from stable, general programming knowledge, framed for
   security work to match the other regions. No documents were
   provided for this region; content is foundational and can be
   refined/replaced when source material is supplied.

   Concept shapes match the other regions:
     normal : { id, cluster, title, short, body:[...], code:{...}, links:[] }
     steps  : { id, cluster, title, short, kind:"steps", steps:[...], links:[] }
   ============================================================ */

const PR_HUB = "Programming";

const PR_CLUSTERS = [
  { id: "foundations", label: "Language Foundations", accent: "cyan",   blurb: "How code runs, how it stores data, and the one question that unites every language: where does untrusted input meet code?" },
  { id: "scripting",   label: "Scripting for Security", accent: "violet", blurb: "The automation trio that does the daily work: Python, Bash, PowerShell." },
  { id: "systems",     label: "Systems Languages",     accent: "green",  blurb: "Close to the metal: C/C++ and the memory-safe generation, Rust and Go." },
  { id: "web",         label: "Web & Client Languages", accent: "amber", blurb: "What runs in the browser and on the web server — and the markup it produces." },
  { id: "data",        label: "Data, Queries & Formats", accent: "rose", blurb: "Talking to databases, matching text, and moving structured data — each with its own injection surface." },
  { id: "securecoding", label: "Secure Coding",        accent: "teal",   blurb: "The cross-cutting habits that stop most vulnerabilities at the source." },
  { id: "frameworks",  label: "Frameworks & Dependencies", accent: "indigo", blurb: "Standing on other people's code: web frameworks, package managers, ORMs — and the supply-chain risk that comes with them." },
  { id: "tooling",     label: "Tooling & Dev Practice", accent: "coral", blurb: "Choosing a language, tracking changes with Git, and catching bugs with tests and CI." },
];

const PR_CONCEPTS = [

  /* ===================== 1 · LANGUAGE FOUNDATIONS ===================== */
  {
    id: "how-code-runs", cluster: "foundations", title: "How Code Runs",
    short: "Compiled, interpreted, or somewhere in between — and why it matters to a tester.",
    body: [
      { h: "From source to execution", p: "Source code is text a human writes; a machine ultimately runs instructions. A compiled language (C, C++, Rust, Go) is translated ahead of time into a native binary that runs directly on the CPU. An interpreted language (Python, Bash, PHP in the classic sense) is read and executed line by line by an interpreter at run time. Many modern languages sit in between: they compile to bytecode for a virtual machine (Java, C#) or just-in-time compile hot paths (JavaScript engines)." },
      { h: "Why the model matters", p: "It shapes both how you build and how you attack. A compiled binary ships as machine code — to understand it you reverse-engineer or run it; its source may be unavailable. An interpreted script ships as readable source — easy to read, modify, and sometimes to inject into. A JIT or VM adds a runtime layer that is itself an attack surface." },
      { h: "Performance vs convenience", p: "Compiled native code is typically fastest and needs no runtime installed; interpreted code is slower but quicker to write, edit, and run anywhere the interpreter exists. This trade-off is exactly why security tooling is often prototyped in Python and shipped in Go or Rust." },
      { h: "Everything is still just input and instructions", p: "Whatever the model, a program is a set of instructions acting on data. Security problems appear at the seam where data the program trusted turns out to be attacker-controlled — the theme that returns in every cluster here." },
    ],
    code: { lang: "text", label: "Three execution models", text:
`compiled     source -> native binary -> CPU
             (C, C++, Rust, Go) fast, no runtime

interpreted  source -> interpreter -> runs now
             (Python, Bash, PHP) readable, portable

bytecode/JIT source -> bytecode -> VM / JIT -> CPU
             (Java, C#, JS engines)` },
    links: ["types-memory","code-attack-surface","c-cpp"],
  },
  {
    id: "types-memory", cluster: "foundations", title: "Types & Memory",
    short: "How a language handles types and memory decides which bugs are even possible.",
    body: [
      { h: "Static vs dynamic typing", p: "In a statically-typed language (C, Rust, Go, Java, TypeScript) the type of every value is known and checked at compile time, catching whole classes of mistakes before the program runs. In a dynamically-typed language (Python, JavaScript, PHP) types are checked at run time, which is flexible and fast to write but lets type-confusion bugs survive until execution." },
      { h: "Managed vs manual memory", p: "A memory-managed language uses a garbage collector or ownership rules to free memory automatically (Python, Java, Go, Rust). A manual-memory language (C, C++) makes the programmer allocate and free memory by hand — powerful and fast, but the source of buffer overflows, use-after-free, and double-free bugs when it goes wrong." },
      { h: "The stack and the heap", p: "The stack holds function calls and local variables in a tidy last-in-first-out structure; the heap holds longer-lived, dynamically-sized data. Classic memory-corruption attacks target both: a stack buffer overflow overwrites a return address; heap corruption abuses allocator metadata. Understanding this split is the entry point to exploitation and to defence." },
      { h: "Why this is the foundation", p: "You cannot reason about a language's security without knowing its type and memory model. 'Can this overflow?' 'Can a string become code?' 'Is this freed twice?' are all answered by these two axes — which is why the memory-safe languages in the Systems cluster are such a big deal." },
    ],
    code: { lang: "text", label: "Two axes that decide the bug classes", text:
`            STATIC types        DYNAMIC types
            (checked early)      (checked at run time)
MANAGED     Rust, Go, Java       Python, Ruby
memory
MANUAL      C, C++               (rare)
memory      <- buffer overflow, use-after-free live here

stack = calls + locals (LIFO)   heap = dynamic, long-lived` },
    links: ["how-code-runs","c-cpp","rust"],
  },
  {
    id: "code-attack-surface", cluster: "foundations", title: "Where Input Meets Code",
    short: "The one question that unifies every language: is this data, or is it instructions?",
    body: [
      { h: "The recurring seam", p: "Almost every serious vulnerability lives where untrusted input crosses into a place that can act on it: a database query, an OS command, an HTML page, a template, a deserializer, a file path. The language and framework decide how easy it is to keep data and instructions separate — but the responsibility is always the developer's." },
      { h: "Trust boundaries in code", p: "A trust boundary is any point where data passes from a less-trusted source (a user, a network, a file, another service) into more-trusted logic. Mark those boundaries mentally as you read code: function parameters that come from a request, values pulled from a database that a user populated, environment variables, command-line arguments. Validation belongs at the boundary, on the way in." },
      { h: "The same mindset as the attacker", p: "This mirrors the pentester's three questions: what does this code trust, can an attacker control it, and does the code verify it before acting? When the answer is 'it trusts the input and doesn't check it', you have found the shape of an injection, a traversal, or a logic flaw — before writing a single payload." },
      { h: "Why it leads the region", p: "Every language-specific footgun later in this map is a special case of this idea: SQL injection (input becomes query), command injection (input becomes shell), XSS (input becomes markup/JS), insecure deserialization (input becomes objects). Learn the seam once and the rest are variations." },
    ],
    code: { lang: "text", label: "One pattern, many names", text:
`input -> SQL query        = SQL injection
input -> OS shell         = command injection
input -> HTML / JS        = cross-site scripting
input -> template         = template injection (SSTI)
input -> deserializer     = insecure deserialization
input -> file path        = path traversal

# Ask: data, or instructions? Validate at the boundary.` },
    links: ["input-validation","output-encoding","types-memory"],
  },

  /* ===================== 2 · SCRIPTING FOR SECURITY ===================== */
  {
    id: "python", cluster: "scripting", title: "Python",
    short: "The lingua franca of security tooling: readable, batteries-included, huge ecosystem.",
    body: [
      { h: "Why it dominates security work", p: "Python is dynamically typed, memory-managed, and famously readable, so you can turn an idea into a working script in minutes. Its standard library and third-party ecosystem cover almost everything a security professional needs: HTTP (requests), packet crafting (scapy), binary exploitation helpers (pwntools), parsing, crypto, and automation. Most proof-of-concept exploits and custom tools are written in it." },
      { h: "What it's good for", p: "Automation and glue, scanners and PoCs, data processing and report generation, and quick API clients. It is the default choice when development speed matters more than raw execution speed, which is most of the time in an assessment." },
      { h: "Security footguns to know", list: [
        "eval() / exec() on untrusted input runs arbitrary code — avoid them.",
        "pickle (and similar) can execute code on deserialization — never unpickle untrusted data.",
        "subprocess with shell=True invites command injection; pass an argument list instead.",
        "String-formatting a query instead of parameterising it is SQL injection.",
      ]},
      { h: "The trade-off", p: "The same dynamic flexibility that makes Python fast to write means type and logic errors surface at run time, and it is slower than a compiled language — which is why a tool that needs to be fast or shipped as a single binary is often rewritten in Go or Rust later." },
    ],
    code: { lang: "python", label: "A safe subprocess call", text:
`import subprocess

# UNSAFE: shell parses the string -> injection
# subprocess.run(f"ping {host}", shell=True)

# SAFE: arguments passed as a list, no shell
subprocess.run(["ping", "-c", "1", host])

# requests makes HTTP trivial
import requests
r = requests.get("https://api.example.test/status")` },
    links: ["choosing-tools","package-managers","bash"],
  },
  {
    id: "bash", cluster: "scripting", title: "Bash & the Shell",
    short: "The glue of Unix: pipelines, automation, and the quick one-liner.",
    body: [
      { h: "What the shell is", p: "Bash is the command interpreter on most Linux and macOS systems. It runs programs, connects them with pipes, and scripts repetitive work. For a security professional it is everywhere: chaining tools, parsing output, driving an engagement, and living on a compromised host where little else is installed." },
      { h: "Pipelines and composition", p: "The shell's power is composition — small programs joined by pipes, each doing one job. grep filters, awk and cut extract fields, sort and uniq aggregate, xargs fans work out. A few operators (|, >, >>, &&, ;) turn a handful of tools into a workflow." },
      { h: "Quoting is a security feature", p: "Unquoted variables undergo word splitting and glob expansion, which is both a common bug and an injection vector — always quote \"$var\". Building a command from untrusted input is command injection; prefer argument arrays and avoid eval. Start scripts with set -euo pipefail so they fail loudly instead of silently continuing after an error." },
      { h: "Know its limits", p: "Bash is superb for gluing tools and short automation, but awkward for anything with real data structures, error handling, or logic — reach for Python once a script grows past a screen or two. On Windows, the equivalent daily driver is PowerShell." },
    ],
    code: { lang: "bash", label: "Safe habits in a script", text:
`#!/usr/bin/env bash
set -euo pipefail            # fail fast, no silent errors

host="$1"                    # always quote variables
ping -c1 "$host" | grep ttl  # compose with pipes

# UNSAFE: eval on input is command injection
# eval "ping $1"` },
    links: ["python","git","choosing-tools"],
  },
  {
    id: "powershell", cluster: "scripting", title: "PowerShell",
    short: "Windows automation and administration — objects, not text.",
    body: [
      { h: "What makes it different", p: "PowerShell is the automation and configuration language of the Windows world. Its defining feature is that commands (cmdlets) pass structured objects down the pipeline, not plain text — so you filter and sort on real properties instead of parsing strings. It has deep access to Windows: the registry, services, WMI/CIM, Active Directory, and the .NET framework underneath." },
      { h: "Where you meet it", p: "It is the backbone of Windows administration, and for the same reason it is heavily used in both defensive automation and offensive operations — enumeration, lateral movement, and living-off-the-land all lean on it because it is present and trusted on virtually every modern Windows host." },
      { h: "Security realities", list: [
        "The execution policy is a safety guardrail against accidental script runs — it is not a security boundary and is trivially bypassed.",
        "Modern Windows logs PowerShell heavily (script-block and module logging, transcription) and AMSI inspects content at run time — defenders watch this closely.",
        "Encoded commands and download-and-run one-liners are common abuse patterns, which is exactly why that logging exists.",
      ]},
      { h: "The object pipeline in practice", p: "Because everything is an object, a pipeline reads almost like a sentence: get the processes, keep the ones using lots of CPU, show the top five. That expressiveness is what makes PowerShell both a great admin tool and a capable offensive one." },
    ],
    code: { lang: "powershell", label: "The object pipeline", text:
`# objects flow down the pipe (not text)
Get-Process |
  Where-Object CPU -gt 100 |
  Sort-Object CPU -Descending |
  Select-Object -First 5 Name, CPU

# Execution policy is NOT a security boundary.
# Script-block logging + AMSI watch what runs.` },
    links: ["bash","python","git"],
  },

  /* ===================== 3 · SYSTEMS LANGUAGES ===================== */
  {
    id: "c-cpp", cluster: "systems", title: "C & C++",
    short: "Close to the metal — fast, foundational, and the classic home of memory bugs.",
    body: [
      { h: "Why they still matter", p: "C is small, fast, and maps almost directly onto the hardware; it is the language of operating-system kernels, embedded devices, and the runtimes that other languages are built on. C++ adds objects, generics, and large-scale abstractions while keeping that low-level control. A huge amount of the world's critical software is written in them." },
      { h: "Manual memory is the double-edged sword", p: "The programmer allocates and frees memory by hand and there is no built-in bounds checking. That is why C/C++ is fast — and why it is the historical source of memory-corruption vulnerabilities: buffer overflows (writing past an array), use-after-free (using memory that was already released), and double-free. These remain among the most impactful bug classes because they can lead to code execution." },
      { h: "A classic bug in one line", p: "Copying attacker-controlled data into a fixed-size buffer without checking its length overflows the buffer and can overwrite a function's return address — the textbook stack overflow. The fix is to use length-aware functions and to validate sizes, but the language will not stop you if you forget." },
      { h: "Mitigations and the bigger picture", p: "Modern compilers and operating systems add defences — stack canaries, non-executable memory (NX/DEP), and address-space layout randomisation (ASLR) — which make exploitation harder, not impossible. The deeper answer the industry is now reaching for is memory-safe languages, which is why Rust exists." },
    ],
    code: { lang: "c", label: "The overflow the language won't stop", text:
`char buf[16];
/* UNSAFE: no bounds check -> stack overflow */
strcpy(buf, user_input);

/* SAFER: bound the copy to the buffer size */
strncpy(buf, user_input, sizeof(buf) - 1);
buf[sizeof(buf) - 1] = '\\0';

/* Defences: stack canaries, NX/DEP, ASLR */` },
    links: ["types-memory","rust","go","code-attack-surface"],
  },
  {
    id: "rust", cluster: "systems", title: "Rust",
    short: "Systems performance with memory safety guaranteed at compile time.",
    body: [
      { h: "The core idea: ownership", p: "Rust gives you C-like performance and control without a garbage collector, and without the memory bugs. It does this through an ownership-and-borrowing model enforced by the compiler: every value has a single owner, references are checked so they cannot outlive what they point to, and the rules are verified before the program ever runs. The result is that whole classes of bugs — use-after-free, double-free, data races — simply do not compile." },
      { h: "Safety without a garbage collector", p: "Managed languages achieve memory safety with a runtime garbage collector, which costs performance and predictability. Rust achieves it at compile time, so there is no GC pause and the binary is as lean as C's. That combination — safe and fast — is why it is moving into operating systems, browsers, and security-sensitive infrastructure." },
      { h: "What it buys a security engineer", p: "Most historically catastrophic vulnerabilities in C/C++ are memory-safety bugs. Writing the component in Rust removes that attack surface by construction, rather than relying on the developer to never make a mistake. The borrow checker is strict and has a learning curve — that friction is the price of the guarantee." },
      { h: "Honest caveats", p: "Rust eliminates memory-safety bugs, not all bugs — logic flaws, injection, and misuse of the explicit unsafe escape hatch are still possible. And it does not retroactively fix the mountain of existing C/C++; it is a forward-looking choice for new, security-critical code." },
    ],
    code: { lang: "rust", label: "The compiler enforces the rules", text:
`fn main() {
    let s = String::from("secret");
    let moved = s;         // ownership moves
    // println!("{}", s);  // ERROR: s invalid
    println!("{}", moved);
}

// use-after-free, double-free, data races
// -> rejected at COMPILE time, not at run time.` },
    links: ["c-cpp","types-memory","go"],
  },
  {
    id: "go", cluster: "systems", title: "Go",
    short: "Simple, compiled, concurrent — the language of cloud and network tooling.",
    body: [
      { h: "Designed for simplicity", p: "Go is a statically-typed, compiled, memory-managed language built to be easy to read and quick to learn. It deliberately keeps the feature set small, which makes large codebases and large teams manageable. It compiles fast and produces a single self-contained static binary — you can build a tool and drop it onto a target machine with no runtime to install." },
      { h: "Concurrency as a first-class feature", p: "Go's goroutines and channels make concurrent code — thousands of simultaneous network connections, for instance — straightforward. That is why so much modern networking, cloud, and container infrastructure (and a lot of security tooling) is written in Go." },
      { h: "Where it fits for security", p: "The static-binary output and strong standard library make Go ideal for distributable scanners, network services, and cross-platform tools: build once, run anywhere, no dependencies to ship. It sits between Python (faster to write, slower to run) and Rust/C (maximum control, more effort) — a pragmatic middle ground." },
      { h: "Safety profile", p: "Being memory-managed, Go avoids the manual-memory bug classes of C/C++. It is not focused on Rust-style compile-time guarantees beyond that, and like every language it is still fully exposed to logic flaws, injection, and misuse of unsafe operations — the language choice removes memory corruption, not developer error." },
    ],
    code: { lang: "go", label: "A static binary, concurrency built in", text:
`package main

import "fmt"

func main() {
    ch := make(chan string)
    go func() { ch <- "done" }()   // goroutine
    fmt.Println(<-ch)
}

// go build -> one static binary, no runtime to ship.` },
    links: ["c-cpp","rust","choosing-tools"],
  },

  /* ===================== 4 · WEB & CLIENT LANGUAGES ===================== */
  {
    id: "javascript", cluster: "web", title: "JavaScript & TypeScript",
    short: "The language of the browser — and, via Node, the server too.",
    body: [
      { h: "Runs in two worlds", p: "JavaScript is the only language that runs natively in every web browser; it manipulates the page through the DOM, handles events, and makes asynchronous requests. With Node.js the same language runs on the server, so a single language can span the whole stack. TypeScript is JavaScript plus a static type system that is checked at build time and then erased — catching mistakes early without changing what runs." },
      { h: "Asynchronous by nature", p: "Browsers can't block, so JavaScript is built around callbacks, promises, and async/await. Understanding this event-driven, single-threaded model is essential to reading real code — and to understanding client-side behaviour you'll probe as a tester." },
      { h: "The security surface", list: [
        "Cross-site scripting (XSS) is attacker JavaScript executing in a victim's browser — the headline client-side risk.",
        "Writing untrusted data into the DOM with innerHTML, or into eval(), turns data into executable code.",
        "Prototype pollution abuses JavaScript's object model to taint application behaviour.",
        "The npm ecosystem is enormous, making dependency/supply-chain risk a first-order concern.",
      ]},
      { h: "Client-side is never a trust boundary", p: "Anything enforced only in the browser — validation, hidden fields, disabled buttons, price calculations — can be changed by the user with dev tools. JavaScript controls the experience, but security decisions must be re-checked on the server, every time." },
    ],
    code: { lang: "javascript", label: "Data vs code in the DOM", text:
`// UNSAFE: untrusted input becomes live markup/JS
el.innerHTML = userInput;        // -> XSS

// SAFE: insert as text, the browser won't execute it
el.textContent = userInput;

// eval() on input runs arbitrary code — never.
// Client-side checks are UX, not security:
//   always re-check on the server.` },
    links: ["web-frameworks","output-encoding","markup-context"],
  },
  {
    id: "php", cluster: "web", title: "PHP",
    short: "The ubiquitous server-side web language — easy to start, historically easy to misuse.",
    body: [
      { h: "What it is", p: "PHP is a server-side scripting language designed for the web; it is embedded directly in pages, talks to databases easily, and powers an enormous share of the internet (it is the P in the classic LAMP stack, and the engine behind much of the web's content-management software). Its low barrier to entry is both its strength and the root of much of its reputation." },
      { h: "Why it shows up so often in assessments", p: "Because it is everywhere and because older code and tutorials encouraged unsafe patterns, PHP applications are a frequent subject of web testing — the injection, file-inclusion, and upload issues in the Pentesting region are often found in PHP apps." },
      { h: "Classic footguns", list: [
        "Functions like system(), exec(), and passthru() run OS commands — unsanitised input is command injection.",
        "include()/require() with user-controlled paths enables local and remote file inclusion.",
        "Building SQL by string concatenation is SQL injection; use prepared statements (PDO).",
        "Loose comparison (==) does surprising type juggling; prefer strict comparison (===).",
      ]},
      { h: "Modern PHP is better", p: "Current PHP and its frameworks provide prepared statements, auto-escaping templates, and sane defaults, and the dangerous old patterns are avoidable. As always, the language gives you safe tools — the vulnerabilities come from not using them." },
    ],
    code: { lang: "php", label: "Concatenation vs prepared statement", text:
`// UNSAFE: user input concatenated into the query
// $db->query("SELECT * FROM users WHERE id=$id");

// SAFE: prepared statement, value is bound as data
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$id]);

// system()/exec()/include() on input = injection/LFI.
// Use === not ==  (loose comparison type-juggles).` },
    links: ["web-frameworks","serialization","sql"],
  },
  {
    id: "markup-context", cluster: "web", title: "HTML, CSS & the Page",
    short: "Not programming languages, but the structure and style code produces — and what a tester reads.",
    body: [
      { h: "Structure and style, not logic", p: "HTML describes a page's structure with nested elements (tags); CSS describes its appearance. Neither is a programming language — there is no logic or decision-making — but together they are the canvas that server code and JavaScript generate and manipulate. Knowing them is prerequisite to understanding any web application." },
      { h: "Why a security person reads the markup", p: "The page source and the live DOM are a free source of intelligence: developer comments left in, hidden form fields, references to internal endpoints and JavaScript files, and framework fingerprints in meta tags or asset paths. Reviewing source is one of the first things to do on any web target, and it costs nothing." },
      { h: "The injection connection", p: "When server code or JavaScript places untrusted data into HTML without encoding it, that data can become new markup or script — this is the mechanism of cross-site scripting. So the structure of the page is exactly where the XSS vulnerability plays out, which is why output encoding is context-sensitive to HTML, attributes, JavaScript, and URLs." },
      { h: "Client-side rendering is editable", p: "Because the browser renders and re-renders the DOM locally, anything shown to the user can be inspected and altered in dev tools — removing a paywall overlay, re-enabling a disabled control, reading a value hidden only with CSS. It changes only that one viewer's copy, but it proves that presentation is not protection." },
    ],
    code: { lang: "text", label: "What the markup reveals", text:
`<!-- temp creds admin/Welcome1 -->     leaks creds
<input type="hidden" name="role">      tamperable
<script src="/app.v2.3.1.js">          version
<div class="paywall" style="...block">  editable

# View source + the live DOM before touching anything.` },
    links: ["javascript","output-encoding","web-frameworks"],
  },

  /* ===================== 5 · DATA, QUERIES & FORMATS ===================== */
  {
    id: "sql", cluster: "data", title: "SQL",
    short: "The query language of relational databases — and the home of injection.",
    body: [
      { h: "What it is", p: "SQL (Structured Query Language) is how programs talk to relational databases. A handful of verbs cover most work: SELECT reads rows, INSERT adds them, UPDATE changes them, DELETE removes them, and JOIN combines related tables. It is declarative — you describe the result you want and the database works out how to get it." },
      { h: "A few operators worth knowing", p: "WHERE filters rows; LIKE does pattern matching with % (any sequence) and _ (one character); UNION combines the results of two SELECTs (and both must return the same number of columns); comments (--, #, /* */) tell the database to ignore the rest of a line. These last two are exactly the building blocks of union-based SQL injection." },
      { h: "SQL injection in one sentence", p: "If an application builds a query by gluing user input into a string, a crafted input (a stray quote, a UNION, a comment) becomes part of the query's logic instead of mere data — letting an attacker read or alter the database. If a database error appears in the response, input is reaching the query unsanitised." },
      { h: "The fix is structural", p: "Use parameterised queries (prepared statements): the query text and the user's values travel separately, so input can never be parsed as SQL. This, not blacklisting characters, is the real defence — and it is what ORMs do for you by default (see Frameworks)." },
    ],
    code: { lang: "sql", label: "The shape of an injection and the fix", text:
`-- app builds:  SELECT * FROM users WHERE name = '<input>'
-- input:       ' OR '1'='1' --
-- becomes:     ... WHERE name = '' OR '1'='1' --'

-- UNION needs matching column counts:
-- ' UNION SELECT username, password FROM admins --

-- FIX (parameterised): value can't become SQL
-- SELECT * FROM users WHERE name = ?` },
    links: ["input-validation","orm-templating","php"],
  },
  {
    id: "regex", cluster: "data", title: "Regular Expressions",
    short: "Pattern matching for text — powerful, essential, and easy to misuse.",
    body: [
      { h: "What it is", p: "A regular expression is a compact pattern language for matching text: literal characters, classes like \\d (digit) and \\w (word character), quantifiers like * (zero or more) and + (one or more), anchors (^ start, $ end), and groups. It is everywhere in security work — filtering tool output, extracting indicators from logs, validating formats, and writing detection rules." },
      { h: "Great for some jobs, wrong for others", p: "Regex excels at matching and extracting patterns from flat text. It is a poor tool for parsing structured or nested formats — HTML, JSON, source code — because those have grammar that regex cannot reliably express; use a real parser for those instead. Using regex as the only validator for something like an email or a URL also tends to be fragile." },
      { h: "Catastrophic backtracking (ReDoS)", p: "Certain patterns, especially nested quantifiers like (a+)+, can cause the engine to explore an exponential number of possibilities on a crafted input, hanging the process. An attacker who controls the input a vulnerable regex runs against can trigger a denial of service — Regular-expression Denial of Service. Keep patterns simple, avoid nested quantifiers, and anchor where possible." },
      { h: "Validation, carefully", p: "When you do validate with regex, prefer strict allow-list patterns anchored with ^ and $ so the whole string must match, not just part of it. And remember validation is one layer — parameterised queries and output encoding still do the real work against injection." },
    ],
    code: { lang: "text", label: "Anchors, classes, and a ReDoS trap", text:
`^\\d{3}-\\d{4}$     anchored: whole string is NNN-NNNN
\\w+@\\w+\\.\\w+      rough email (real ones are messier)

# ReDoS: nested quantifiers + crafted input = hang
#   (a+)+$   against "aaaaaaaaaaaaaaaaX"
# Keep patterns simple; anchor; avoid nesting.
# Parse structured data (HTML/JSON) with a PARSER.` },
    links: ["input-validation","serialization"],
  },
  {
    id: "serialization", cluster: "data", title: "Serialization Formats",
    short: "JSON, YAML, XML — moving structured data, each with its own trap.",
    body: [
      { h: "What serialization is", p: "Serialization turns in-memory data structures into a text (or binary) form that can be stored or sent over a network, and deserialization turns it back. JSON is the web's default — simple name/value pairs and arrays. YAML is a human-friendly superset often used for configuration. XML is older, verbose, and tag-based, still common in enterprise systems." },
      { h: "Insecure deserialization", p: "If an application deserializes attacker-controlled data into live objects, and the format or library can instantiate arbitrary types or run code during that process, the attacker may achieve remote code execution. Language-native binary formats (such as Python's pickle or unsafe Java deserialization) are especially dangerous — never deserialize untrusted input with them." },
      { h: "Format-specific pitfalls", list: [
        "YAML: full-featured loaders can construct arbitrary objects — always use a safe/limited loader on untrusted input.",
        "XML: external entity processing enables XXE, reading local files or making server-side requests — disable external entities.",
        "JSON: safer by design (data only), but still validate structure and types; don't trust it blindly.",
      ]},
      { h: "The common defence", p: "Prefer simple data-only formats for untrusted input, use the safe parsing mode of your library, disable dangerous features (external entities, arbitrary object construction), and validate the shape and types of what you received before acting on it. This is the input-validation principle applied to data formats." },
    ],
    code: { lang: "text", label: "Safe vs unsafe parsing", text:
`JSON   data only — safest; still validate shape/types
YAML   safe_load() on untrusted input (not full load)
XML    disable external entities  -> prevents XXE

# Native binary formats run code on load:
#   Python pickle, unsafe Java deserialization
#   -> NEVER deserialize untrusted data with them.` },
    links: ["input-validation","php","regex"],
  },

  /* ===================== 6 · SECURE CODING ===================== */
  {
    id: "input-validation", cluster: "securecoding", title: "Input Validation",
    short: "Treat every input as untrusted; check it at the boundary, before you use it.",
    body: [
      { h: "The principle", p: "Never trust input — from users, networks, files, other services, or even your own database if a user populated it. Validate it at the trust boundary, as it enters your logic, and reject anything that doesn't fit. This single habit shuts down a large share of vulnerabilities before they start." },
      { h: "Allow-list over deny-list", p: "Decide what is valid and accept only that (an allow-list), rather than trying to enumerate everything bad (a deny-list). Attackers are endlessly creative about bad input, so blacklists leak; describing the small set of good input is both safer and simpler. Validate type, length, format, and range." },
      { h: "Validation is not the whole answer", p: "Input validation reduces risk but does not, by itself, stop injection — a perfectly valid-looking name can still contain a quote that breaks a concatenated SQL query. Validation pairs with output encoding and parameterisation (next): validate on the way in, encode/parameterise on the way out to each specific interpreter." },
      { h: "Where to apply it", p: "At every entry point: request parameters, headers, cookies, uploaded files, API payloads, and message-queue data. And always on the server — client-side validation improves the user experience but can be bypassed, so it never counts as a control." },
    ],
    code: { lang: "python", label: "Allow-list at the boundary", text:
`# deny-list (leaky): try to block "bad" chars
# allow-list (robust): accept only known-good shape

import re
if not re.fullmatch(r"[a-z0-9_]{3,20}", username):
    reject("invalid username")        # fail closed

# Validate type, length, format, range — server-side.
# Then still parameterise queries / encode output.` },
    links: ["code-attack-surface","output-encoding","sql"],
  },
  {
    id: "output-encoding", cluster: "securecoding", title: "Output Encoding & Parameterisation",
    short: "Keep data as data wherever it leaves your program into an interpreter.",
    body: [
      { h: "The idea", p: "Most injection is fixed not by scrubbing input but by correctly handling output: whenever data crosses into an interpreter — a database, an HTML page, a shell, a template — encode or parameterise it so that interpreter treats it as inert data, never as instructions. Each destination needs its own method." },
      { h: "Parameterised queries for SQL", p: "Send the query and the values separately (prepared statements). The database compiles the query structure first, then binds the values as data, so input can never change the query's meaning. This is the definitive fix for SQL injection, and ORMs do it automatically." },
      { h: "Context-aware encoding for the web", p: "For XSS, encode data for the exact context it lands in — HTML body, an HTML attribute, inside JavaScript, or a URL each require different escaping. Modern template engines auto-escape for HTML by default, which is why you should prefer them and be very wary of the 'raw'/'safe' overrides that switch escaping off." },
      { h: "Everywhere else", p: "For OS commands, avoid the shell and pass arguments as a list so nothing is re-parsed. For file paths, resolve and confirm the result stays within an allowed directory. The pattern is always the same: data stays data as it leaves your trust boundary." },
    ],
    code: { lang: "text", label: "One rule, per destination", text:
`SQL     parameterised query  (bind values, don't concat)
HTML    context-aware encode  (template auto-escape on)
shell   argument list, no shell string
path    resolve + confirm inside allowed directory

# Validate on the way IN, encode/parameterise on the way OUT.` },
    links: ["input-validation","sql","orm-templating","javascript"],
  },
  {
    id: "secrets-crypto", cluster: "securecoding", title: "Secrets & Using Crypto",
    short: "Don't hard-code secrets, and don't invent your own cryptography.",
    body: [
      { h: "Keep secrets out of code", p: "API keys, passwords, tokens, and private keys must never be hard-coded in source or committed to a repository — they leak through shared code, version-control history, and logs. Load them from environment variables or a dedicated secrets manager (a vault service), keep them out of command lines and error messages, and rotate them if exposed." },
      { h: "Use vetted libraries, never roll your own", p: "Cryptography is extraordinarily easy to get subtly and fatally wrong. Use well-established, audited libraries and standard algorithms; do not design your own cipher or protocol. 'Rolling your own crypto' is a classic, severe mistake because code that looks like it works can be trivially broken by someone who knows what to look for." },
      { h: "Hash passwords correctly", p: "Store passwords using a slow, salted password-hashing function — bcrypt, scrypt, or Argon2 — never as plaintext and never with a fast general-purpose hash like MD5 or SHA-1, which are built for speed and so are easy to brute-force. The slowness is the point: it makes guessing expensive." },
      { h: "Prefer modern, standard choices", p: "For data in transit use current TLS with valid certificates; for data at rest use authenticated encryption such as AES-GCM or ChaCha20-Poly1305; manage keys with a key-management service and rotate them. These are the same cryptographic-failure lessons from the security-failures material, viewed from the developer's side." },
    ],
    code: { lang: "python", label: "Secrets from the environment; proper hashing", text:
`import os
api_key = os.environ["API_KEY"]   # not hard-coded in source

# passwords: slow, salted hash — never MD5/SHA-1, never plaintext
from argon2 import PasswordHasher
ph = PasswordHasher()
stored = ph.hash(password)        # bcrypt / scrypt / Argon2

# Use vetted crypto libraries. Never roll your own.` },
    links: ["error-logging","package-managers","output-encoding"],
  },
  {
    id: "error-logging", cluster: "securecoding", title: "Errors, Logging & Least Privilege",
    short: "Fail closed, don't leak internals, record what matters, and grant the minimum.",
    body: [
      { h: "Fail closed", p: "When something goes wrong — bad input, a failed check, an unexpected state — default to denying the action, not allowing it. Security logic should treat the error path as the safe path. An exception while checking a permission must never fall through to granting access." },
      { h: "Don't leak internals in errors", p: "Verbose error messages and stack traces shown to users reveal file paths, software versions, queries, and logic that help an attacker — the information-disclosure problem from the earlier material. Show users a generic message; log the detail server-side where only you can see it." },
      { h: "Log security-relevant events", p: "Record authentication successes and failures, authorisation decisions, privilege changes, and significant actions — with enough context (who, what, when, from where) to investigate later. This underpins accountability and detection; without it, defenders are blind. Protect the logs from tampering and keep them long enough to be useful." },
      { h: "Least privilege in code", p: "Give every component, process, database account, and API token only the access it needs and no more. A web app's database user that can only read the tables it uses limits the blast radius of a SQL-injection bug; a service that runs as a low-privileged account limits what a compromise achieves. Least privilege turns a total compromise into a contained one." },
    ],
    code: { lang: "text", label: "Four habits that limit damage", text:
`fail closed      error path = deny, never allow-by-accident
generic errors   users see "something went wrong";
                 full detail -> server-side logs only
log + protect    authn, authz, privilege change, key actions
least privilege  each component gets the minimum access

# A read-only DB user shrinks a SQLi bug's impact.` },
    links: ["secrets-crypto","input-validation","testing-ci"],
  },

  /* ===================== 7 · FRAMEWORKS & DEPENDENCIES ===================== */
  {
    id: "web-frameworks", cluster: "frameworks", title: "Web Frameworks",
    short: "Pre-built structure that gives you secure defaults — if you don't fight them.",
    body: [
      { h: "What a framework provides", p: "A web framework is a collection of ready-made structure so you don't rebuild the basics: routing (mapping URLs to code), templating (generating HTML), an ORM or database layer, session and authentication handling, and form processing. Common examples are Django and Flask (Python), Express (Node/JavaScript), Spring (Java), Laravel (PHP), and Ruby on Rails." },
      { h: "Secure defaults are the main benefit", p: "Mature frameworks ship with the right defaults baked in: templates that auto-escape output (mitigating XSS), database layers that parameterise queries (mitigating SQL injection), built-in CSRF tokens on forms, and secure session cookies. Using the framework the way it intends means you get these protections for free." },
      { h: "You can still turn the protections off", p: "The vulnerabilities reappear when you bypass the defaults: marking template output as 'raw'/'safe', dropping to hand-built SQL strings, disabling CSRF protection for convenience, or mishandling file uploads. A framework reduces the number of ways to go wrong; it does not remove your responsibility." },
      { h: "Frameworks for the tester", p: "Identifying the framework and version (from headers, cookies, asset paths, error pages, or default files) is valuable reconnaissance: it points to known issues and tells you which default protections are likely present. It is the developer-side mirror of the content-discovery and fingerprinting work in the other regions." },
    ],
    code: { lang: "text", label: "What you get, and how you lose it", text:
`Framework gives you, by default:
  auto-escaped templates   -> blocks most XSS
  ORM / query layer        -> parameterised, blocks SQLi
  CSRF tokens on forms     -> blocks CSRF
  secure session cookies

You lose it by overriding:
  {{ value|safe }} / raw   · hand-built SQL
  csrf_exempt              · insecure upload handling` },
    links: ["package-managers","orm-templating","javascript"],
  },
  {
    id: "package-managers", cluster: "frameworks", title: "Package Managers & Supply Chain",
    short: "Pulling in the world's code — and inheriting its risk.",
    body: [
      { h: "Standing on others' code", p: "Modern software is assembled as much as written: package managers (pip for Python, npm for JavaScript, cargo for Rust, Go modules, Maven for Java) pull in third-party libraries so you don't reinvent them. A typical application has far more third-party code than first-party code." },
      { h: "The supply-chain risk", p: "Every dependency is code you run but did not write or review, and so is every dependency of that dependency. If a package is malicious, compromised, or abandoned with an unpatched flaw, that weakness is now yours — attackers increasingly target the supply chain precisely because one compromised package reaches thousands of victims." },
      { h: "Common failure modes", list: [
        "Typosquatting — a malicious package named almost like a popular one.",
        "Compromised maintainer or build pipeline injecting malicious code into a trusted package.",
        "Known-vulnerable versions left unpatched after disclosure.",
        "Auto-installing updates without verification, so a bad release lands automatically.",
      ]},
      { h: "Defences", p: "Pin exact versions and commit a lockfile so builds are reproducible; audit dependencies with the ecosystem's tooling and keep them patched; verify integrity (checksums/signatures) where available; and prefer well-maintained libraries over abandoned ones. This is the software-supply-chain and integrity material from the security-failures region, applied at the package level." },
    ],
    code: { lang: "bash", label: "Pin, lock, and audit", text:
`# pin exact versions + commit the lockfile
pip install requests==2.32.3      # requirements.txt / lock
npm ci                            # install from lockfile

# audit known-vulnerable dependencies
pip-audit            # Python
npm audit            # JavaScript

# prefer maintained libs; verify integrity where possible.` },
    links: ["web-frameworks","secrets-crypto","testing-ci"],
  },
  {
    id: "orm-templating", cluster: "frameworks", title: "ORMs & Template Engines",
    short: "The two framework pieces that quietly prevent injection — until you override them.",
    body: [
      { h: "ORMs parameterise by default", p: "An Object-Relational Mapper lets you work with database rows as objects in your language instead of writing SQL by hand. Crucially, ORMs build queries using parameterisation under the hood, so values are bound as data — meaning routine ORM use is immune to SQL injection by construction. You get the protection without thinking about it." },
      { h: "Template engines auto-escape", p: "A template engine generates HTML by filling placeholders with data. Modern engines HTML-escape those values automatically, so a value containing < or > is rendered as harmless text rather than live markup — which is why framework templates neutralise most XSS by default." },
      { h: "The overrides reopen the holes", p: "Both protections can be switched off, and that is where the bugs return: using an ORM's raw-SQL escape hatch with concatenated input brings back SQL injection; marking template output as 'safe'/'raw' or building HTML by string concatenation brings back XSS. If you then feed a template attacker-controlled template text (not just data), you can get Server-Side Template Injection — input becoming template code." },
      { h: "The lesson", p: "Use the safe, default path and the framework does the hard part for you. Treat every 'raw', 'safe', 'unescaped', or hand-built-string option as a request to re-introduce an injection class, and only use it with data you fully control." },
    ],
    code: { lang: "text", label: "Safe default vs dangerous override", text:
`ORM (safe):     User.objects.filter(name=value)   # bound
ORM (danger):   raw("... WHERE name='" + value)    # SQLi

Template (safe):  {{ comment }}        # auto-escaped
Template (danger):{{ comment|safe }}   # XSS reopened

# Feeding user input as TEMPLATE text -> SSTI.` },
    links: ["sql","output-encoding","web-frameworks"],
  },

  /* ===================== 8 · TOOLING & DEV PRACTICE ===================== */
  {
    id: "choosing-tools", cluster: "tooling", title: "Choosing a Language",
    short: "Match the language to the job — speed of writing, speed of running, or how it ships.",
    body: [
      { h: "There is no single best language", p: "The right choice depends on the constraint that matters most for the task: how fast you can write it, how fast it runs, how it is delivered, and what already exists to build on. A security professional is served by being comfortable in a few languages across these trade-offs rather than mastering one." },
      { h: "A practical rule of thumb", list: [
        "Need it working today, lots of libraries, a one-off or PoC → Python.",
        "Gluing command-line tools together on Unix → Bash; on Windows → PowerShell.",
        "A fast, cross-platform tool to hand to others as one binary → Go.",
        "Maximum control, memory safety, long-lived systems code → Rust; raw low-level or existing codebases → C/C++.",
        "Anything in the browser → JavaScript/TypeScript.",
      ]},
      { h: "Reuse before you build", p: "Often the best 'language' decision is not to write code at all: an existing, maintained tool or library usually beats a fresh implementation. Scapy for packets, requests for HTTP, pwntools for exploitation scaffolding — leaning on proven building blocks is faster and less error-prone than starting from scratch." },
      { h: "Write for the next reader", p: "Most code is read far more than it is written, often by you months later or by a teammate. Clarity, small functions, and good names matter more than cleverness — especially for security tooling, where a subtle bug can produce a false result you then trust." },
    ],
    code: { lang: "text", label: "Pick by the binding constraint", text:
`fast to WRITE, rich libs     -> Python
glue CLI tools (Unix/Win)    -> Bash / PowerShell
one portable BINARY to ship  -> Go
safe + fast systems code     -> Rust  (low-level -> C/C++)
runs in the browser          -> JavaScript / TypeScript

# Reuse a maintained tool before writing your own.` },
    links: ["python","go","git"],
  },
  {
    id: "git", cluster: "tooling", title: "Version Control with Git",
    short: "Track every change, collaborate safely — and know where secrets leak.",
    body: [
      { h: "What Git does", p: "Git is a version-control system that records the full history of a project as a series of commits. You work on branches, commit changes with a message, and push them to a shared repository (often hosted on a service like GitHub) for others to pull. It makes collaboration manageable and lets you see exactly what changed, when, and by whom — and roll back when something breaks." },
      { h: "The core loop", p: "Clone or init a repository, create a branch for your change, stage and commit your edits with a clear message, push the branch, and open a request to merge it after review. Code review before merging is both a quality and a security control — a second set of eyes catches flaws and sneaky changes." },
      { h: "Where security lives in Git", list: [
        "Secrets committed by accident live forever in history — removing them from the latest version is not enough; they must be rotated.",
        "An exposed .git/ directory on a web server can leak the entire source and history — a real-world finding.",
        "Signed commits and protected branches help prove authorship and prevent tampering.",
      ]},
      { h: "Hygiene", p: "Use a .gitignore to keep secrets, build artefacts, and local config out of the repository in the first place; scan history for leaked credentials; and never paste a token into a command that Git or your shell will record. The habits here connect directly to the secrets-handling practice in Secure Coding." },
    ],
    code: { lang: "bash", label: "The everyday loop + a safety net", text:
`git clone <repo> && cd repo
git checkout -b feature/x        # work on a branch
git add -p && git commit -m "add x"
git push -u origin feature/x     # open a review before merge

echo ".env" >> .gitignore        # keep secrets OUT of history
# a committed secret must be ROTATED, not just deleted.` },
    links: ["bash","testing-ci","secrets-crypto"],
  },
  {
    id: "testing-ci", cluster: "tooling", title: "Testing, Linting & CI",
    short: "Automate the checks that catch bugs — including security bugs — before they ship.",
    body: [
      { h: "Tests prove it still works", p: "Automated tests encode the expected behaviour of code so a change that breaks it is caught immediately. Unit tests check small pieces, integration tests check how they fit together. For security tooling this matters doubly: a silently broken tool produces wrong results that an analyst then trusts." },
      { h: "Linters and static analysis", p: "A linter flags style and likely-bug patterns as you write; static application security testing (SAST) goes further and scans source for security anti-patterns — concatenated SQL, use of dangerous functions, hard-coded secrets. These run without executing the code and catch issues early, though they produce false positives and miss context, so their output is a lead to review, not a verdict." },
      { h: "Continuous integration", p: "CI runs these checks automatically on every change — tests, linters, SAST, and dependency/vulnerability scanning — before code is merged or deployed. Adding security checks to the pipeline is 'shift left': finding problems at commit time, when they are cheapest to fix, rather than in production. Dynamic testing (DAST) against a running instance complements the static checks." },
      { h: "The limits", p: "Automation covers breadth quickly but, exactly as with the vulnerability scanners in the other regions, it produces false positives and misses logic flaws and chained issues that need human judgement. Tests, linters, and scanners are a floor beneath manual review and real testing — not a replacement for them." },
    ],
    code: { lang: "yaml", label: "A CI pipeline that shifts security left", text:
`# on every push / pull request:
steps:
  - run: pytest            # unit + integration tests
  - run: ruff check .      # lint / likely-bug patterns
  - run: bandit -r .       # SAST: security anti-patterns
  - run: pip-audit         # vulnerable dependencies

# Catches bugs at commit time. Still not a substitute
# for human review and real testing.` },
    links: ["git","package-managers","error-logging"],
  },
];

const PR_RELATIONS = [
  /* foundations spine */
  ["how-code-runs","types-memory"], ["types-memory","c-cpp"],
  ["code-attack-surface","input-validation"], ["code-attack-surface","c-cpp"],
  /* scripting */
  ["python","choosing-tools"], ["python","package-managers"], ["bash","git"],
  ["powershell","bash"],
  /* systems */
  ["c-cpp","rust"], ["c-cpp","go"], ["rust","types-memory"],
  /* web */
  ["javascript","web-frameworks"], ["javascript","output-encoding"],
  ["php","web-frameworks"], ["php","serialization"], ["markup-context","javascript"],
  /* data */
  ["sql","orm-templating"], ["sql","input-validation"], ["regex","input-validation"],
  ["serialization","input-validation"],
  /* secure coding */
  ["input-validation","output-encoding"], ["output-encoding","orm-templating"],
  ["secrets-crypto","package-managers"], ["error-logging","secrets-crypto"],
  /* frameworks + tooling */
  ["web-frameworks","package-managers"], ["package-managers","testing-ci"],
  ["git","testing-ci"], ["choosing-tools","go"], ["error-logging","testing-ci"],
];

window.KJ_PROGRAMMING = { hub: PR_HUB, clusters: PR_CLUSTERS, concepts: PR_CONCEPTS, relations: PR_RELATIONS };
