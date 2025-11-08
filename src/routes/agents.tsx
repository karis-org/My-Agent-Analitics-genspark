// Agents management routes
import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const agents = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
agents.use('/*', authMiddleware);

/**
 * Agents list page
 * GET /agents
 */
agents.get('/', async (c) => {
  const user = c.get('user');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AIエージェント管理 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 sm:space-x-4">
                        <a href="/dashboard" class="touch-manipulation">
                            <img src="/static/icons/header-logo.png" alt="My Agent Analytics" class="h-10 sm:h-12">
                        </a>
                        <h1 class="text-lg sm:text-xl font-bold text-gray-900">AIエージェント管理</h1>
                    </div>
                    <div class="flex items-center space-x-2 sm:space-x-4">
                        <span class="text-xs sm:text-sm text-gray-600 hidden sm:inline">${user.email}</span>
                        <a href="/dashboard" class="text-gray-600 hover:text-gray-900 text-sm sm:text-base touch-manipulation">
                            <i class="fas fa-arrow-left mr-1 sm:mr-2"></i><span class="hidden sm:inline">ダッシュボード</span>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <!-- Header Actions -->
            <div class="mb-4 sm:mb-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div>
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-900">AIエージェント</h2>
                        <p class="text-sm sm:text-base text-gray-600 mt-1">自動分析を実行するAIエージェントを管理します</p>
                    </div>
                    <button onclick="showCreateModal()" class="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors touch-manipulation whitespace-nowrap">
                        <i class="fas fa-plus mr-2"></i>新規作成
                    </button>
                </div>
            </div>

            <!-- Agents List -->
            <div id="agents-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div class="text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600">読み込み中...</p>
                </div>
            </div>
        </main>

        <!-- Create/Edit Modal -->
        <div id="agent-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <h3 id="modal-title" class="text-xl font-bold text-gray-900">新規エージェント作成</h3>
                </div>
                <form id="agent-form" class="p-6 space-y-4">
                    <input type="hidden" id="agent-id" value="">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">エージェント名 *</label>
                        <input type="text" id="agent-name" required
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">説明</label>
                        <textarea id="agent-description" rows="3"
                                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">タイプ</label>
                        <select id="agent-type" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="analysis">分析エージェント</option>
                            <option value="market">市場調査エージェント</option>
                            <option value="comparison">比較分析エージェント</option>
                            <option value="report">レポート生成エージェント</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                        <select id="agent-status" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="active">アクティブ</option>
                            <option value="inactive">非アクティブ</option>
                            <option value="archived">アーカイブ</option>
                        </select>
                    </div>
                    
                    <div class="flex items-center justify-end space-x-4 pt-4">
                        <button type="button" onclick="hideModal()" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            キャンセル
                        </button>
                        <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let agents = [];
            
            // Load agents
            async function loadAgents() {
                try {
                    const response = await axios.get('/api/agents');
                    agents = response.data.agents || [];
                    renderAgents();
                } catch (error) {
                    console.error('Failed to load agents:', error);
                    document.getElementById('agents-list').innerHTML = 
                        '<div class="col-span-full text-center py-12"><p class="text-red-600">エージェントの読み込みに失敗しました</p></div>';
                }
            }
            
            // Render agents
            function renderAgents() {
                const container = document.getElementById('agents-list');
                
                if (agents.length === 0) {
                    container.innerHTML = \`
                        <div class="col-span-full text-center py-12">
                            <i class="fas fa-robot text-6xl text-gray-300 mb-4"></i>
                            <p class="text-gray-600 mb-4">まだエージェントがありません</p>
                            <button onclick="showCreateModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                <i class="fas fa-plus mr-2"></i>最初のエージェントを作成
                            </button>
                        </div>
                    \`;
                    return;
                }
                
                container.innerHTML = agents.map(agent => {
                    const typeIcons = {
                        'analysis': 'fa-calculator',
                        'market': 'fa-chart-line',
                        'comparison': 'fa-balance-scale',
                        'report': 'fa-file-pdf'
                    };
                    const typeLabels = {
                        'analysis': '分析',
                        'market': '市場調査',
                        'comparison': '比較分析',
                        'report': 'レポート生成'
                    };
                    const statusColors = {
                        'active': 'bg-green-100 text-green-800',
                        'inactive': 'bg-gray-100 text-gray-800',
                        'archived': 'bg-red-100 text-red-800'
                    };
                    const statusLabels = {
                        'active': 'アクティブ',
                        'inactive': '非アクティブ',
                        'archived': 'アーカイブ'
                    };
                    
                    return \`
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div class="flex items-start justify-between mb-4">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i class="fas \${typeIcons[agent.agent_type] || 'fa-robot'} text-blue-600 text-xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-gray-900">\${agent.name}</h3>
                                        <p class="text-sm text-gray-500">\${typeLabels[agent.agent_type] || agent.agent_type}</p>
                                    </div>
                                </div>
                                <span class="px-2 py-1 text-xs font-medium rounded \${statusColors[agent.status]}">\${statusLabels[agent.status]}</span>
                            </div>
                            
                            <p class="text-sm text-gray-600 mb-4">\${agent.description || '説明なし'}</p>
                            
                            <div class="text-xs text-gray-500 mb-4">
                                <div>作成日: \${new Date(agent.created_at).toLocaleDateString('ja-JP')}</div>
                                \${agent.last_used_at ? \`<div>最終使用: \${new Date(agent.last_used_at).toLocaleDateString('ja-JP')}</div>\` : ''}
                            </div>
                            
                            <div class="flex items-center space-x-2">
                                <button onclick="viewExecutions('\${agent.id}')" class="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
                                    <i class="fas fa-history mr-1"></i>履歴
                                </button>
                                <button onclick="editAgent('\${agent.id}')" class="flex-1 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors">
                                    <i class="fas fa-edit mr-1"></i>編集
                                </button>
                                <button onclick="deleteAgent('\${agent.id}')" class="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    \`;
                }).join('');
            }
            
            // Show create modal
            function showCreateModal() {
                document.getElementById('modal-title').textContent = '新規エージェント作成';
                document.getElementById('agent-form').reset();
                document.getElementById('agent-id').value = '';
                document.getElementById('agent-modal').classList.remove('hidden');
            }
            
            // Edit agent
            async function editAgent(id) {
                const agent = agents.find(a => a.id === id);
                if (!agent) return;
                
                document.getElementById('modal-title').textContent = 'エージェント編集';
                document.getElementById('agent-id').value = agent.id;
                document.getElementById('agent-name').value = agent.name;
                document.getElementById('agent-description').value = agent.description || '';
                document.getElementById('agent-type').value = agent.agent_type;
                document.getElementById('agent-status').value = agent.status;
                document.getElementById('agent-modal').classList.remove('hidden');
            }
            
            // Hide modal
            function hideModal() {
                document.getElementById('agent-modal').classList.add('hidden');
            }
            
            // Submit form
            document.getElementById('agent-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const id = document.getElementById('agent-id').value;
                const data = {
                    name: document.getElementById('agent-name').value,
                    description: document.getElementById('agent-description').value,
                    agent_type: document.getElementById('agent-type').value,
                    status: document.getElementById('agent-status').value,
                };
                
                try {
                    if (id) {
                        await axios.put(\`/api/agents/\${id}\`, data);
                    } else {
                        await axios.post('/api/agents', data);
                    }
                    hideModal();
                    loadAgents();
                } catch (error) {
                    console.error('Failed to save agent:', error);
                    alert('エージェントの保存に失敗しました');
                }
            });
            
            // Delete agent
            async function deleteAgent(id) {
                if (!confirm('このエージェントを削除しますか？実行履歴も削除されます。')) return;
                
                try {
                    await axios.delete(\`/api/agents/\${id}\`);
                    loadAgents();
                } catch (error) {
                    console.error('Failed to delete agent:', error);
                    alert('エージェントの削除に失敗しました');
                }
            }
            
            // View executions
            function viewExecutions(id) {
                window.location.href = \`/agents/\${id}/executions\`;
            }
            
            // Load on page load
            loadAgents();
        </script>
    </body>
    </html>
  `);
});

/**
 * Agent execution history page
 * GET /agents/:id/executions
 */
agents.get('/:id/executions', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>実行履歴 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/dashboard">
                            <img src="/static/icons/header-logo.png" alt="My Agent Analytics" class="h-12">
                        </a>
                        <h1 class="text-xl font-bold text-gray-900">実行履歴</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/agents" class="text-gray-600 hover:text-gray-900">
                            <i class="fas fa-arrow-left mr-2"></i>エージェント一覧
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <!-- Agent Info -->
            <div id="agent-info" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div class="text-center py-4">
                    <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                </div>
            </div>

            <!-- Executions List -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="p-6 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">実行履歴</h2>
                </div>
                <div id="executions-list" class="divide-y divide-gray-200">
                    <div class="text-center py-12">
                        <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-600">読み込み中...</p>
                    </div>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const agentId = '${agentId}';
            let agent = null;
            let executions = [];
            
            // Load agent info
            async function loadAgent() {
                try {
                    const response = await axios.get(\`/api/agents/\${agentId}\`);
                    agent = response.data.agent;
                    renderAgent();
                } catch (error) {
                    console.error('Failed to load agent:', error);
                    document.getElementById('agent-info').innerHTML = 
                        '<div class="text-center py-4"><p class="text-red-600">エージェント情報の読み込みに失敗しました</p></div>';
                }
            }
            
            // Load executions
            async function loadExecutions() {
                try {
                    const response = await axios.get(\`/api/agents/\${agentId}/executions\`);
                    executions = response.data.executions || [];
                    renderExecutions();
                } catch (error) {
                    console.error('Failed to load executions:', error);
                    document.getElementById('executions-list').innerHTML = 
                        '<div class="text-center py-12"><p class="text-red-600">実行履歴の読み込みに失敗しました</p></div>';
                }
            }
            
            // Render agent info
            function renderAgent() {
                if (!agent) return;
                
                const typeLabels = {
                    'analysis': '分析エージェント',
                    'market': '市場調査エージェント',
                    'comparison': '比較分析エージェント',
                    'report': 'レポート生成エージェント'
                };
                
                document.getElementById('agent-info').innerHTML = \`
                    <div class="flex items-center space-x-4">
                        <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-robot text-blue-600 text-2xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-900">\${agent.name}</h3>
                            <p class="text-gray-600">\${typeLabels[agent.agent_type] || agent.agent_type}</p>
                            <p class="text-sm text-gray-500 mt-1">\${agent.description || ''}</p>
                        </div>
                    </div>
                \`;
            }
            
            // Render executions
            function renderExecutions() {
                const container = document.getElementById('executions-list');
                
                if (executions.length === 0) {
                    container.innerHTML = \`
                        <div class="text-center py-12">
                            <i class="fas fa-history text-6xl text-gray-300 mb-4"></i>
                            <p class="text-gray-600">まだ実行履歴がありません</p>
                        </div>
                    \`;
                    return;
                }
                
                const statusColors = {
                    'pending': 'bg-yellow-100 text-yellow-800',
                    'running': 'bg-blue-100 text-blue-800',
                    'completed': 'bg-green-100 text-green-800',
                    'failed': 'bg-red-100 text-red-800'
                };
                const statusLabels = {
                    'pending': '待機中',
                    'running': '実行中',
                    'completed': '完了',
                    'failed': '失敗'
                };
                const typeLabels = {
                    'analysis': '分析',
                    'market_research': '市場調査',
                    'comparison': '比較分析',
                    'report': 'レポート生成'
                };
                
                container.innerHTML = executions.map(exec => {
                    const duration = exec.execution_time_ms ? \`\${(exec.execution_time_ms / 1000).toFixed(2)}秒\` : '-';
                    
                    return \`
                        <div class="p-6 hover:bg-gray-50 transition-colors">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-2 mb-2">
                                        <span class="px-2 py-1 text-xs font-medium rounded \${statusColors[exec.status]}">
                                            \${statusLabels[exec.status]}
                                        </span>
                                        <span class="text-sm text-gray-600">\${typeLabels[exec.execution_type] || exec.execution_type}</span>
                                    </div>
                                    <p class="text-sm text-gray-600">実行ID: \${exec.id}</p>
                                    \${exec.property_id ? \`<p class="text-sm text-gray-600">物件ID: \${exec.property_id}</p>\` : ''}
                                </div>
                                <div class="text-right text-sm text-gray-500">
                                    <div>開始: \${new Date(exec.created_at).toLocaleString('ja-JP')}</div>
                                    \${exec.completed_at ? \`<div>完了: \${new Date(exec.completed_at).toLocaleString('ja-JP')}</div>\` : ''}
                                    <div>実行時間: \${duration}</div>
                                </div>
                            </div>
                            \${exec.error_message ? \`
                                <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                                    <p class="text-sm text-red-800"><i class="fas fa-exclamation-circle mr-1"></i>\${exec.error_message}</p>
                                </div>
                            \` : ''}
                        </div>
                    \`;
                }).join('');
            }
            
            // Load on page load
            loadAgent();
            loadExecutions();
        </script>
    </body>
    </html>
  `);
});

export default agents;
