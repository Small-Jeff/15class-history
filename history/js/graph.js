// js/graph.js — 关系图谱
import { showCharacterModal } from './modal.js';
import { onModalOpen, bindModalClose } from './common.js';

let networkInstance = null;

function getAllRecords() {
    const d = typeof historyData !== 'undefined' ? historyData.records : [];
    const e = typeof extraHistory !== 'undefined' ? extraHistory.records : [];
    const dr = typeof dramaHistory !== 'undefined' ? dramaHistory.records : [];
    return [...d, ...e, ...dr];
}

function getCharacters() {
    return typeof characters !== 'undefined' ? characters : [];
}

// 构建人物关联数据
function buildGraphData() {
    const records = getAllRecords();
    const chars = getCharacters();
    const nodes = [];
    const edges = [];
    const nodeMap = {};

    chars.forEach(c => {
        const name = c.name.toLowerCase();
        const nicks = (c.nicknames || []).map(n => n.toLowerCase());
        const relatedRecords = records.filter(r => {
            const text = (r.title + r.content).toLowerCase();
            return text.includes(name) || nicks.some(n => text.includes(n));
        });
        const count = relatedRecords.length;
        const id = `char_${c.name}`;
        const size = Math.max(15, Math.min(40, 15 + count * 5));
        nodes.push({
            id,
            label: c.name,
            title: `${c.name}<br>出场 ${count} 次`,
            value: count,
            size,
            font: { size: 14, color: '#e6e9f0', face: 'serif' },
            borderWidth: 2,
            color: {
                background: 'rgba(201, 169, 89, 0.7)',
                border: '#c9a959',
                highlight: { background: '#e0c47a', border: '#c9a959' }
            },
            shape: 'dot'
        });
        nodeMap[id] = true;
    });

    // 通过共同出现的记录构建连线
    const charPairs = {};
    chars.forEach((c1, i) => {
        const name1 = c1.name.toLowerCase();
        const nicks1 = (c1.nicknames || []).map(n => n.toLowerCase());
        const c1Records = records.filter(r => {
            const text = (r.title + r.content).toLowerCase();
            return text.includes(name1) || nicks1.some(n => text.includes(n));
        });
        const c1Set = new Set(c1Records.map(r => r.id || r.title));

        chars.slice(i + 1).forEach(c2 => {
            const name2 = c2.name.toLowerCase();
            const nicks2 = (c2.nicknames || []).map(n => n.toLowerCase());
            const c2Records = records.filter(r => {
                const text = (r.title + r.content).toLowerCase();
                return text.includes(name2) || nicks2.some(n => text.includes(n));
            });
            const shared = c1Records.filter(r => c2Records.some(r2 => (r2.id || r2.title) === (r.id || r.title)));

            if (shared.length > 0) {
                const pairKey = [c1.name, c2.name].sort().join('||');
                if (!charPairs[pairKey]) {
                    charPairs[pairKey] = {
                        from: `char_${c1.name}`,
                        to: `char_${c2.name}`,
                        count: shared.length,
                        records: shared
                    };
                }
            }
        });
    });

    Object.values(charPairs).forEach(p => {
        const width = Math.max(1, Math.min(8, p.count));
        edges.push({
            from: p.from,
            to: p.to,
            width,
            color: {
                color: 'rgba(201, 169, 89, 0.3)',
                highlight: 'rgba(201, 169, 89, 0.7)'
            },
            title: `共同出现 ${p.count} 次`,
            smooth: { type: 'continuous' }
        });
    });

    return { nodes, edges };
}

export function showGraphModal() {
    const modalId = 'graphModal';
    let modal = document.getElementById(modalId);

    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'history-modal graph-modal hidden';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-container">
                <button class="modal-close-btn">✕</button>
                <div class="modal-content">
                    <h3 style="color:var(--accent); margin-bottom:16px;">🔗 人物关系图谱</h3>
                    <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">
                        节点大小表示出场次数，连线越粗表示共同出现越多
                    </p>
                    <div id="graphNetwork"></div>
                    <div class="graph-legend">
                        <span class="graph-legend-item">
                            <span class="graph-legend-dot" style="background:rgba(201,169,89,0.7);"></span>
                            人物节点
                        </span>
                        <span class="graph-legend-item">
                            <span class="graph-legend-dot" style="background:rgba(201,169,89,0.3);width:20px;height:3px;border-radius:2px;"></span>
                            关联线
                        </span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        bindModalClose(modal, modalId, () => {
            if (networkInstance) {
                networkInstance.destroy();
                networkInstance = null;
            }
        });
    }

    modal.classList.remove('hidden');
    onModalOpen(modalId);

    // 渲染图谱，等模态框可见后获取正确尺寸
    requestAnimationFrame(() => initGraph(modal));
}

function initGraph(modal) {
    const container = document.getElementById('graphNetwork');
    if (!container) return;

    // 检查 vis 库是否加载
    if (typeof vis === 'undefined') {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">vis-network 加载中…</p>';
        setTimeout(() => initGraph(modal), 500);
        return;
    }

    const { nodes: nodesData, edges: edgesData } = buildGraphData();

    if (nodesData.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">暂无人物数据</p>';
        return;
    }

    // 销毁旧实例
    if (networkInstance) {
        networkInstance.destroy();
        networkInstance = null;
    }

    // 清空容器
    container.innerHTML = '';

    // 锁定容器高度（防止 flex + vis 无限循环撑大）
    const rect = container.getBoundingClientRect();
    if (rect.height > 0) {
        container.style.height = rect.height + 'px';
    } else {
        container.style.height = '400px';
    }

    const nodes = new vis.DataSet(nodesData);
    const edges = new vis.DataSet(edgesData);

    let physicsEnabled = true;

    const options = {
        physics: {
            enabled: true,
            solver: 'barnesHut',
            stabilization: {
                iterations: 100,
                updateInterval: 25
            },
            barnesHut: {
                gravitationalConstant: -3000,
                springLength: 180,
                springConstant: 0.03,
                damping: 0.1
            },
            maxVelocity: 20
        },
        interaction: {
            hover: true,
            tooltipDelay: 200,
            navigationButtons: false,
            keyboard: false
        },
        edges: {
            smooth: { type: 'curvedCW', roundness: 0.2 }
        },
        nodes: {
            shape: 'dot',
            font: { face: 'serif', size: 14, color: '#e6e9f0' },
            borderWidth: 2,
            color: {
                background: 'rgba(201, 169, 89, 0.7)',
                border: '#c9a959',
                highlight: { background: '#e0c47a', border: '#c9a959' }
            }
        },
        height: container.style.height
    };

    networkInstance = new vis.Network(container, { nodes, edges }, options);

    // 稳定完成后关闭物理引擎，避免无限移动撑大页面
    networkInstance.on('stabilizationIterationsDone', () => {
        if (physicsEnabled) {
            physicsEnabled = false;
            networkInstance.setOptions({ physics: { enabled: false } });
        }
    });

    // 阻止图上点击冒泡导致 overlay 关闭
    container.addEventListener('click', (e) => e.stopPropagation());

    networkInstance.on('click', (params) => {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const chars = getCharacters();
            const charName = nodeId.replace('char_', '');
            const char = chars.find(c => c.name === charName);
            if (char) {
                // 带退出动画关闭图谱 → 打开人物详情
                modal.classList.add('closing');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('closing');
                    showCharacterModal(char);
                }, 150);
            }
        }
    });
}
