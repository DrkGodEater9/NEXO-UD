#!/usr/bin/env python3
import json
import os
import sys
import argparse
import csv
from datetime import datetime, timezone

try:
    from jinja2 import Template
except Exception:
    Template = None


def extract_metrics(data):
    metrics = data.get('metrics', {})
    out = {}
    for name, meta in metrics.items():
        values = meta.get('values', {})
        out[name] = dict(values)
        out[name]['type'] = meta.get('type', '')
    return out


def write_csv(metrics, path):
    all_keys = set()
    for v in metrics.values():
        all_keys.update(v.keys())
    all_keys.discard('type')
    header = ['metric', 'type'] + sorted(all_keys)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        for name, vals in metrics.items():
            row = [name, vals.get('type', '')]
            for k in header[2:]:
                row.append(vals.get(k, ''))
            writer.writerow(row)


def render_html(metrics, outpath, template_path=None):
    generated = datetime.now(timezone.utc).isoformat()
    if template_path and Template:
        tpl = Template(open(template_path, 'r', encoding='utf-8').read())
        html = tpl.render(metrics=metrics, generated=generated)
    else:
        parts = [f"<h1>k6 Report</h1><p>Generated: {generated}</p>"]
        for name, vals in metrics.items():
            parts.append(f"<h2>{name} ({vals.get('type','')})</h2>")
            parts.append('<table border="1" cellpadding="4" cellspacing="0">')
            for k, v in sorted(vals.items()):
                if k == 'type':
                    continue
                parts.append(f"<tr><td><b>{k}</b></td><td>{v}</td></tr>")
            parts.append('</table>')
        html = '<html><body>' + '\n'.join(parts) + '</body></html>'
    with open(outpath, 'w', encoding='utf-8') as f:
        f.write(html)


def main():
    parser = argparse.ArgumentParser(description='Generate simple HTML/CSV report from k6 JSON')
    parser.add_argument('input', help='k6 JSON results file')
    parser.add_argument('-o', '--outdir', default='report', help='output directory')
    parser.add_argument('-t', '--template', default=None, help='optional HTML template (Jinja2)')
    args = parser.parse_args()

    with open(args.input, 'r', encoding='utf-8') as f:
        data = json.load(f)

    metrics = extract_metrics(data)
    os.makedirs(args.outdir, exist_ok=True)
    csvpath = os.path.join(args.outdir, 'summary.csv')
    htmlpath = os.path.join(args.outdir, 'report.html')
    write_csv(metrics, csvpath)
    render_html(metrics, htmlpath, args.template)
    print('Wrote:', csvpath, htmlpath)


if __name__ == '__main__':
    main()
