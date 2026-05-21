import json
import sys
import os
from collections import defaultdict

def parse_k6_json(filepath):
    """Extract summary metrics from k6 JSON output."""
    metrics = defaultdict(list)
    status_counts = defaultdict(int)
    total_requests = 0
    
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            
            if obj.get('type') == 'Point':
                metric_name = obj.get('metric', '')
                value = obj['data'].get('value', 0)
                tags = obj['data'].get('tags', {})
                
                if metric_name == 'http_req_duration':
                    metrics['http_req_duration'].append(value)
                elif metric_name == 'http_reqs':
                    total_requests += 1
                    status = tags.get('status', 'unknown')
                    status_counts[status] += 1
                elif metric_name == 'http_req_failed':
                    metrics['http_req_failed'].append(value)
                elif metric_name == 'http_req_waiting':
                    metrics['http_req_waiting'].append(value)
                elif metric_name == 'http_req_connecting':
                    metrics['http_req_connecting'].append(value)
                elif metric_name == 'http_req_sending':
                    metrics['http_req_sending'].append(value)
                elif metric_name == 'http_req_receiving':
                    metrics['http_req_receiving'].append(value)
                elif metric_name == 'iteration_duration':
                    metrics['iteration_duration'].append(value)
    
    return metrics, status_counts, total_requests

def percentile(data, p):
    if not data:
        return 0
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * (p / 100)
    f = int(k)
    c = f + 1
    if c >= len(sorted_data):
        return sorted_data[f]
    return sorted_data[f] + (k - f) * (sorted_data[c] - sorted_data[f])

def format_ms(val):
    if val < 1:
        return f"{val*1000:.0f}µs"
    elif val < 1000:
        return f"{val:.2f}ms"
    else:
        return f"{val/1000:.2f}s"

def analyze(filepath, scenario_name):
    print(f"Analyzing {scenario_name}...", file=sys.stderr)
    metrics, status_counts, total_requests = parse_k6_json(filepath)
    
    durations = metrics.get('http_req_duration', [])
    failed = metrics.get('http_req_failed', [])
    iterations = metrics.get('iteration_duration', [])
    
    fail_count = sum(1 for v in failed if v > 0)
    fail_rate = (fail_count / len(failed) * 100) if failed else 0
    success_rate = 100 - fail_rate
    
    result = {
        'scenario': scenario_name,
        'total_requests': total_requests,
        'success_rate': success_rate,
        'fail_rate': fail_rate,
        'status_codes': dict(status_counts),
        'duration': {
            'avg': sum(durations) / len(durations) if durations else 0,
            'min': min(durations) if durations else 0,
            'max': max(durations) if durations else 0,
            'med': percentile(durations, 50),
            'p90': percentile(durations, 90),
            'p95': percentile(durations, 95),
            'p99': percentile(durations, 99),
        },
        'iterations': {
            'total': len(iterations),
            'avg': sum(iterations) / len(iterations) if iterations else 0,
        }
    }
    return result

results = {}
base_dir = os.path.dirname(os.path.abspath(__file__))

for scenario in ['baseline', 'spike', 'stress']:
    filepath = os.path.join(base_dir, 'k6', f'{scenario}.json')
    if os.path.exists(filepath):
        results[scenario] = analyze(filepath, scenario)
    else:
        print(f"Warning: {filepath} not found", file=sys.stderr)

# Output JSON
print(json.dumps(results, indent=2))
