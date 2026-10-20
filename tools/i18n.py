"""Build and check the translated lesson pages.

Each lesson's English page (demos/<lesson>/index.html) is the source of
truth. A translation lives in i18n/<locale>/<lesson>.body.html (the markup
between <body> and <script>) and i18n/<locale>/<lesson>.strings.json
({"title": ..., "strings": [[english_literal, translated_literal], ...]}).

The build copies the English page, swaps in the translated markup and
replaces JS string literals by exact match, so the interactive code is the
same in every language.

  python3 tools/i18n.py build [lesson ...]   regenerate translated pages
  python3 tools/i18n.py check                fail if a page is out of date
  python3 tools/i18n.py missing <lesson>     list English literals with no translation
  python3 tools/i18n.py import <lesson>      (re)create sources from an existing page
"""
import json, re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCALE = 'zh-CN'
SRC_DIR = ROOT / 'i18n' / LOCALE
BASE_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
CJK_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif'
REGEX_PREV = set('(,=:[!&|?{};+-*%<>~^')


class I18nError(Exception):
    pass


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


# ---------------------------------------------------------------- JS scanning

def scan_js(src):
    """Return [(start, end)] spans of top-level string and template literals."""
    spans, n = [], len(src)

    def skip_string(j):
        q = src[j]; j += 1
        while src[j] != q:
            j += 2 if src[j] == '\\' else 1
        return j + 1

    def skip_template(j):
        j += 1
        while j < n:
            c = src[j]
            if c == '\\':
                j += 2; continue
            if c == '`':
                return j + 1
            if c == '$' and src[j + 1] == '{':
                j = skip_expr(j + 2); continue
            j += 1
        raise I18nError('unterminated template literal')

    def skip_regex(j):
        j += 1; in_class = False
        while True:
            c = src[j]
            if c == '\\':
                j += 2; continue
            if c == '[':
                in_class = True
            elif c == ']':
                in_class = False
            elif c == '/' and not in_class:
                break
            j += 1
        j += 1
        while j < n and src[j].isalpha():
            j += 1
        return j

    def prev_sig(j):
        k = j - 1
        while k >= 0 and src[k] in ' \t\n':
            k -= 1
        return src[k] if k >= 0 else '('

    def skip_comment_or_regex(j):
        if src[j + 1] == '/':
            return src.index('\n', j)
        if src[j + 1] == '*':
            return src.index('*/', j) + 2
        if prev_sig(j) in REGEX_PREV:
            return skip_regex(j)
        return None

    def skip_expr(j):
        depth = 1
        while j < n:
            c = src[j]
            if c in '\'"':
                j = skip_string(j); continue
            if c == '`':
                j = skip_template(j); continue
            if c == '/':
                k = skip_comment_or_regex(j)
                if k is not None:
                    j = k; continue
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    return j + 1
            j += 1
        raise I18nError('unterminated ${ expression')

    i = 0
    while i < n:
        c = src[i]
        if c == '/':
            k = skip_comment_or_regex(i)
            if k is not None:
                i = k; continue
        if c in '\'"':
            e = skip_string(i); spans.append((i, e)); i = e; continue
        if c == '`':
            e = skip_template(i); spans.append((i, e)); i = e; continue
        i += 1
    return spans


def template_code(lit):
    """The code inside a template literal's ${...} parts, with string contents removed.

    Translations may change text, including text in nested strings, but
    must not change the identifiers and operators the template evaluates.
    """
    if not lit.startswith('`'):
        return []
    parts, i, n = [], 1, len(lit)
    while i < n - 1:
        if lit[i] == '\\':
            i += 2; continue
        if lit[i] == '$' and lit[i + 1] == '{':
            depth, j = 1, i + 2
            while depth:
                if lit[j] in '\'"`':
                    q = lit[j]; j += 1
                    while lit[j] != q:
                        j += 2 if lit[j] == '\\' else 1
                elif lit[j] == '{':
                    depth += 1
                elif lit[j] == '}':
                    depth -= 1
                j += 1
            expr = lit[i + 2:j - 1]
            expr = re.sub(r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"|`(?:\\.|[^`\\])*`", "''", expr)
            parts.append(re.sub(r'\s+', '', expr))
            i = j; continue
        i += 1
    return parts


def check_literal(old, new):
    if not new:
        raise I18nError(f'empty translation for {old[:60]}')
    q = old[0]
    if new[0] != q or new[-1] != q:
        raise I18nError(f'quote style changed: {old[:50]} -> {new[:50]}')
    if q in '\'"':
        inner = new[1:-1]
        if re.search(r'(?<!\\)' + re.escape(q), inner):
            raise I18nError(f'unescaped {q} in: {new[:60]}')
        if '\n' in inner:
            raise I18nError(f'raw newline in: {new[:60]}')
    # A translation may drop an expression (e.g. English-only plural choices) but
    # must not introduce code that the English template does not have.
    added = set(template_code(new)) - set(template_code(old))
    if added:
        raise I18nError(f'template code changed ({", ".join(sorted(added))}):\n  {old[:120]}\n  {new[:120]}')


# ---------------------------------------------------------------- pages

def split_page(html):
    b0 = html.index('<body')
    b1 = html.index('>', b0) + 1
    s0 = html.index('<script>', b1)
    s1 = html.index('</script>', s0)
    return b1, s0, s0 + len('<script>'), s1


def lesson_paths(lesson):
    return (ROOT / 'demos' / lesson / 'index.html',
            ROOT / 'demos' / lesson / f'index.{LOCALE}.html',
            SRC_DIR / f'{lesson}.body.html',
            SRC_DIR / f'{lesson}.strings.json')


def lessons():
    return sorted(p.name.removesuffix('.strings.json') for p in SRC_DIR.glob('*.strings.json'))


def build_page(lesson):
    en_path, _, body_path, strings_path = lesson_paths(lesson)
    html = read(en_path)
    spec = json.loads(read(strings_path))
    table = {}
    for en, tr in spec['strings']:
        if en in table and table[en] != tr:
            raise I18nError(f'{lesson}: two translations for {en[:60]}')
        table[en] = tr

    b1, s0, j0, j1 = split_page(html)
    js = html[j0:j1]
    used, edits = set(), []
    for a, e in scan_js(js):
        lit = js[a:e]
        if lit in table:
            used.add(lit)
            check_literal(lit, table[lit])
            edits.append((a, e, table[lit]))
    stale = [en for en in table if en not in used]
    if stale:
        raise I18nError(f'{lesson}: translations for strings no longer in the English page:\n  '
                        + '\n  '.join(s[:100] for s in stale))
    for a, e, new in sorted(edits, reverse=True):
        js = js[:a] + new + js[e:]

    head = html[:b1]
    head = head.replace('<html lang="en">', f'<html lang="{LOCALE}">', 1)
    head = re.sub(r'<title>.*?</title>', f'<title>{spec["title"]}</title>', head, count=1)
    head = head.replace(BASE_FONT, CJK_FONT)
    page = head + read(body_path) + html[s0:j0] + js + html[j1:]

    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(js)
    res = subprocess.run(['node', '--check', f.name], capture_output=True, text=True)
    if res.returncode:
        raise I18nError(f'{lesson}: translated script does not parse:\n{res.stderr}')
    return page


def cmd_build(names):
    for lesson in names or lessons():
        out = lesson_paths(lesson)[1]
        write(out, build_page(lesson))
        print(f'built {out.relative_to(ROOT)}')


def cmd_check():
    stale = []
    for lesson in lessons():
        if build_page(lesson) != read(lesson_paths(lesson)[1]):
            stale.append(lesson)
    if stale:
        print('Out of date translated pages: ' + ', '.join(stale))
        print('Run: python3 tools/i18n.py build')
        sys.exit(1)
    print(f'{len(lessons())} translated pages are up to date')


def looks_like_prose(lit):
    text = re.sub(r'\$\{[^}]*\}|<[^>]+>', ' ', lit[1:-1])
    return len(re.findall(r'\b[A-Za-z]{3,}\b', text)) >= 2 and re.search(r'[a-z]{3,} [a-z]{2,}', text)


def cmd_missing(lesson):
    en_path, _, _, strings_path = lesson_paths(lesson)
    html = read(en_path)
    known = {en for en, _ in json.loads(read(strings_path))['strings']} if strings_path.exists() else set()
    _, _, j0, j1 = split_page(html)
    js = html[j0:j1]
    for a, e in scan_js(js):
        lit = js[a:e]
        if lit not in known and looks_like_prose(lit):
            print(lit)


def cmd_import(lesson):
    """Recover sources from a translated page that was built from the English one."""
    en_path, tr_path, body_path, strings_path = lesson_paths(lesson)
    en, tr = read(en_path), read(tr_path)
    _, _, ej0, ej1 = split_page(en)
    tb1, ts0, tj0, tj1 = split_page(tr)
    ejs, tjs = en[ej0:ej1], tr[tj0:tj1]
    es, ts = scan_js(ejs), scan_js(tjs)
    if len(es) != len(ts):
        raise I18nError(f'{lesson}: pages have different scripts ({len(es)} vs {len(ts)} literals)')
    pairs = {}
    for (a, b), (c, d) in zip(es, ts):
        if ejs[a:b] != tjs[c:d]:
            pairs.setdefault(ejs[a:b], tjs[c:d])
    title = re.search(r'<title>(.*?)</title>', tr).group(1)
    SRC_DIR.mkdir(parents=True, exist_ok=True)
    write(body_path, tr[tb1:ts0])
    write(strings_path, json.dumps({'title': title, 'strings': sorted(pairs.items())},
                                   ensure_ascii=False, indent=1) + '\n')
    print(f'{lesson}: {len(pairs)} strings')


if __name__ == '__main__':
    args = sys.argv[1:]
    try:
        if args[:1] == ['build']:
            cmd_build(args[1:])
        elif args[:1] == ['check']:
            cmd_check()
        elif args[:1] == ['missing'] and len(args) == 2:
            cmd_missing(args[1])
        elif args[:1] == ['import'] and len(args) == 2:
            cmd_import(args[1])
        else:
            print(__doc__)
            sys.exit(2)
    except I18nError as e:
        print(f'error: {e}', file=sys.stderr)
        sys.exit(1)
