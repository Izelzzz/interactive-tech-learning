"""Build a translated copy of a lesson page.

Usage: python3 tools/i18n_build.py <src.html> <body.html> <strings.txt> <out.html> <title>

<strings.txt> holds "@@ <id>" blocks (replace the literal with that id, see
i18n_extract.py) and "@= <literal>" blocks (replace every literal equal to it).
Only string literals are replaced, so the page's code stays identical.
"""
import re, subprocess, sys, tempfile
from i18n_extract import scan_js, split_page

CJK_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif'


def parse(path):
    by_id, by_lit, key = {}, {}, None
    for line in open(path).read().split('\n'):
        if line.startswith('@@ ') or line.startswith('@= '):
            key = ('id', int(line[3:])) if line.startswith('@@ ') else ('lit', line[3:])
            (by_id if key[0] == 'id' else by_lit)[key[1]] = []
        elif key:
            (by_id if key[0] == 'id' else by_lit)[key[1]].append(line)
    clean = lambda d: {k: '\n'.join(v).rstrip('\n') for k, v in d.items()}
    return clean(by_id), clean(by_lit)


def check_literal(old, new):
    q = old[0]
    assert new[0] == q and new[-1] == q, f'quote style changed: {new[:40]}'
    if q in '\'"':
        inner = new[1:-1]
        assert not re.search(r'(?<!\\)' + re.escape(q), inner), f'unescaped quote in: {new[:60]}'
        assert '\n' not in inner, f'raw newline in: {new[:60]}'


def main(src, body, strings, out, title):
    html = open(src).read()
    b1, s0, j0, j1 = split_page(html)
    js = html[j0:j1]
    by_id, by_lit = parse(strings)
    spans = scan_js(js)
    used_lit = set()
    edits = []
    for k, (a, e) in enumerate(spans):
        lit = js[a:e]
        new = by_id.pop(k, None)
        if new is None and lit in by_lit:
            new = by_lit[lit]; used_lit.add(lit)
        if new is not None and new != lit:
            check_literal(lit, new)
            edits.append((a, e, new))
    assert not by_id, f'unknown ids: {sorted(by_id)}'
    assert used_lit == set(by_lit), f'unused literals: {set(by_lit) - used_lit}'
    for a, e, new in sorted(edits, reverse=True):
        js = js[:a] + new + js[e:]

    head = html[:b1]
    head = head.replace('<html lang="en">', '<html lang="zh-CN">', 1)
    head = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', head, count=1)
    head = head.replace('system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', CJK_FONT)
    head = head.replace('<body data-level="beginner">', '<body data-level="beginner">')
    page = head + open(body).read() + html[s0:j0] + js + html[j1:]
    open(out, 'w').write(page)

    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as f:
        f.write(js)
    subprocess.run(['node', '--check', f.name], check=True)
    print(f'{out}: {len(edits)} strings replaced, script syntax OK')


if __name__ == '__main__':
    main(*sys.argv[1:6])
