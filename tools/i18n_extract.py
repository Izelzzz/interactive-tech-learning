"""Extract translatable text from a lesson page.

Writes <out>/<name>.body.html (markup between <body> and <script>) and
<out>/<name>.strings.txt (JS string/template literals, one "@@ id" block each).
Usage: python3 tools/i18n_extract.py demos/http-basics/index.html <out-dir> <name>
"""
import json, re, sys

REGEX_PREV = set('(,=:[!&|?{};+-*%<>~^')


def scan_js(src):
    """Return [(start, end)] spans of top-level string and template literals."""
    spans, i, n = [], 0, len(src)

    def skip_template(j):
        # src[j] == '`'; return index after closing backtick
        j += 1
        while j < n:
            c = src[j]
            if c == '\\':
                j += 2; continue
            if c == '`':
                return j + 1
            if c == '$' and src[j + 1] == '{':
                j = skip_expr(j + 2)
                continue
            j += 1
        raise ValueError('unterminated template')

    def skip_string(j):
        q = src[j]; j += 1
        while src[j] != q:
            j += 2 if src[j] == '\\' else 1
        return j + 1

    def skip_regex(j):
        j += 1; in_class = False
        while True:
            c = src[j]
            if c == '\\': j += 2; continue
            if c == '[': in_class = True
            elif c == ']': in_class = False
            elif c == '/' and not in_class: break
            j += 1
        j += 1
        while j < n and src[j].isalpha(): j += 1
        return j

    def prev_sig(j):
        k = j - 1
        while k >= 0 and src[k] in ' \t\n': k -= 1
        return src[k] if k >= 0 else '('

    def skip_expr(j):
        depth = 1
        while j < n:
            c = src[j]
            if c in '\'"': j = skip_string(j); continue
            if c == '`': j = skip_template(j); continue
            if c == '/' and src[j + 1] == '/':
                j = src.index('\n', j); continue
            if c == '/' and src[j + 1] == '*':
                j = src.index('*/', j) + 2; continue
            if c == '/' and prev_sig(j) in REGEX_PREV:
                j = skip_regex(j); continue
            if c == '{': depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0: return j + 1
            j += 1
        raise ValueError('unterminated ${')

    while i < n:
        c = src[i]
        if c == '/' and src[i + 1] == '/':
            i = src.index('\n', i); continue
        if c == '/' and src[i + 1] == '*':
            i = src.index('*/', i) + 2; continue
        if c in '\'"':
            e = skip_string(i); spans.append((i, e)); i = e; continue
        if c == '`':
            e = skip_template(i); spans.append((i, e)); i = e; continue
        if c == '/' and prev_sig(i) in REGEX_PREV:
            i = skip_regex(i); continue
        i += 1
    return spans


def split_page(html):
    b0 = html.index('<body')
    b1 = html.index('>', b0) + 1
    s0 = html.index('<script>', b1)
    s1 = html.index('</script>', s0)
    return b1, s0, s0 + len('<script>'), s1


if __name__ == '__main__':
    path, out, name = sys.argv[1:4]
    html = open(path).read()
    b1, s0, j0, j1 = split_page(html)
    open(f'{out}/{name}.body.html', 'w').write(html[b1:s0])
    js = html[j0:j1]
    with open(f'{out}/{name}.strings.txt', 'w') as f:
        for k, (a, e) in enumerate(scan_js(js)):
            lit = js[a:e]
            if len(re.findall(r'[A-Za-z]', lit)) >= 3 and re.search(r'[A-Za-z]{2,}[ .,!?:]', lit + ' '):
                f.write(f'@@ {k}\n{lit}\n')
