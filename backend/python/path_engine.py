"""
Auto Path Generator — Dijkstra + 认知权重
支持 learning / engineering / reverse / minimal 四种路径类型

learning:    难度递增的完整认知链路（惩罚跳级）
engineering: 按组件→系统方向，偏重 implements/part_of 边
reverse:     从目标反向拆解到基础概念
minimal:     跳数最少的路径
"""
import heapq
from typing import Optional

REL_WEIGHTS: dict[str, float] = {
    "part_of":      0.5,
    "upstream":     1.0,
    "downstream":   1.0,
    "implements":   1.2,
    "variant_of":   1.5,
    "used_by":      2.0,
    "optimized_by": 1.5,
    "parallel":     2.5,
    "related_to":   3.0,
}

# learning 模式：跳级惩罚系数（难度差越大越贵）
LEARNING_SKIP_PENALTY = 3.0
# engineering 模式：偏好 implements/part_of
ENG_WEIGHTS: dict[str, float] = {
    "part_of":      0.3,
    "implements":   0.5,
    "upstream":     0.8,
    "downstream":   0.8,
    "used_by":      1.5,
    "variant_of":   2.0,
    "optimized_by": 1.0,
    "parallel":     3.0,
    "related_to":   3.0,
}


def _edge_cost(src_diff: int, tgt_diff: int, rel_type: str,
               mode: str = "learning") -> float:
    weights = ENG_WEIGHTS if mode == "engineering" else REL_WEIGHTS
    base = weights.get(rel_type, 2.0)
    diff_gap = tgt_diff - src_diff  # 正数=难度上升，负数=难度下降

    if mode == "learning":
        # 跳级惩罚：难度差超过 1 时大幅加价，防止 embedding→rag 直接跳
        if diff_gap > 1:
            base += diff_gap * LEARNING_SKIP_PENALTY
        elif diff_gap < 0:
            # 难度下降也轻微惩罚（不应该走回头路）
            base += abs(diff_gap) * 0.5
    else:
        base += abs(diff_gap) * 0.8

    return base


def _build_adj(nodes: dict, edges: list, mode: str = "learning",
               reverse: bool = False) -> dict[int, list]:
    adj: dict[int, list] = {nid: [] for nid in nodes}
    for src_id, tgt_id, rel_type in edges:
        if src_id not in nodes or tgt_id not in nodes:
            continue
        cost = _edge_cost(
            nodes[src_id]["difficulty"],
            nodes[tgt_id]["difficulty"],
            rel_type, mode,
        )
        if reverse:
            adj[tgt_id].append((src_id, cost, rel_type))
        else:
            adj[src_id].append((tgt_id, cost, rel_type))
    return adj


def _dijkstra(adj: dict, start_id: int, target_id: int) -> tuple[list[int], float]:
    dist = {nid: float("inf") for nid in adj}
    dist[start_id] = 0.0
    prev: dict[int, Optional[int]] = {nid: None for nid in adj}
    pq: list[tuple[float, int]] = [(0.0, start_id)]

    while pq:
        cost, cur = heapq.heappop(pq)
        if cost > dist[cur]:
            continue
        if cur == target_id:
            break
        for nxt, edge_cost, _ in adj.get(cur, []):
            new_cost = dist[cur] + edge_cost
            if new_cost < dist[nxt]:
                dist[nxt] = new_cost
                prev[nxt] = cur
                heapq.heappush(pq, (new_cost, nxt))

    if dist[target_id] == float("inf"):
        return [], float("inf")

    path: list[int] = []
    cur: Optional[int] = target_id
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    return path, dist[target_id]


def _ancestors(nodes: dict, edges: list, target_id: int) -> set[int]:
    """反向 BFS 找所有能到达 target 的祖先节点。"""
    rev: dict[int, list[int]] = {nid: [] for nid in nodes}
    for src_id, tgt_id, _ in edges:
        if src_id in nodes and tgt_id in nodes:
            rev[tgt_id].append(src_id)

    visited: set[int] = set()
    queue = [target_id]
    while queue:
        cur = queue.pop()
        for parent in rev.get(cur, []):
            if parent not in visited:
                visited.add(parent)
                queue.append(parent)
    visited.discard(target_id)
    return visited


def _pick_start_nodes(nodes: dict, edges: list, target_id: int,
                      mode: str = "learning") -> list[int]:
    """
    从能到达 target 的祖先里选起点。
    learning 模式：优先选 importance 最高的根节点（认知基础）
    其他模式：优先选 difficulty 最低的根节点
    """
    ancestors = _ancestors(nodes, edges, target_id)
    if not ancestors:
        candidates = [nid for nid in nodes if nid != target_id]
        candidates.sort(key=lambda nid: (nodes[nid]["difficulty"], -nodes[nid]["importance"]))
        return candidates[:5]

    has_parent_in_ancestors: set[int] = set()
    for src_id, tgt_id, _ in edges:
        if src_id in ancestors and tgt_id in ancestors:
            has_parent_in_ancestors.add(tgt_id)

    roots = [nid for nid in ancestors if nid not in has_parent_in_ancestors]
    if not roots:
        roots = list(ancestors)

    if mode == "learning":
        # learning：importance 最高优先（选认知基础最重要的起点）
        # 同等 importance 时选 difficulty 最低的
        roots.sort(key=lambda nid: (-nodes[nid]["importance"], nodes[nid]["difficulty"]))
    else:
        roots.sort(key=lambda nid: (nodes[nid]["difficulty"], -nodes[nid]["importance"]))

    return roots[:5]


def generate_path(
    nodes: dict,
    edges: list,
    target_id: int,
    path_type: str = "learning",
) -> tuple[list[int], float]:
    """
    nodes: {id: {difficulty, importance, slug}}
    edges: [(src_id, tgt_id, rel_type)]
    返回 (concept_id_list, total_cost)
    """
    # 所有模式都从全部根节点出发，选步数最多的路径
    # minimal 例外：选步数最少但 > 1 的路径
    start_ids = _pick_start_nodes(nodes, edges, target_id, mode=path_type)

    if path_type == "reverse":
        adj = _build_adj(nodes, edges, mode="learning", reverse=True)
        best_path, best_cost = [], float("inf")
        for sid in start_ids:
            path, cost = _dijkstra(adj, target_id, sid)
            if path and len(path) > len(best_path):
                best_path, best_cost = path, cost
        return best_path, best_cost

    if path_type == "minimal":
        # 最少跳数，但必须经过至少一个中间节点
        adj: dict[int, list] = {nid: [] for nid in nodes}
        for src_id, tgt_id, _ in edges:
            if src_id in nodes and tgt_id in nodes:
                adj[src_id].append((tgt_id, 1.0, ""))
        best_path, best_cost = [], float("inf")
        for sid in start_ids:
            path, cost = _dijkstra(adj, sid, target_id)
            if not path:
                continue
            # minimal：选跳数最少但步数 > 1 的
            if len(path) > 1 and (not best_path or len(path) < len(best_path)):
                best_path, best_cost = path, cost
        return best_path, best_cost

    mode = "engineering" if path_type == "engineering" else "learning"
    adj = _build_adj(nodes, edges, mode=mode, reverse=False)
    best_path, best_cost = [], float("inf")
    for sid in start_ids:
        path, cost = _dijkstra(adj, sid, target_id)
        if not path:
            continue
        # learning / engineering：选步数最多的完整路径
        if len(path) > len(best_path):
            best_path, best_cost = path, cost
    return best_path, best_cost
