const API_URL = 'http://localhost:5000/api/deals';
let deals = [];
const stages = ['Lead', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'];
let pipelineChartInstance = null;
let statusChartInstance = null;

// Fetch deals from REST API
async function fetchDeals() {
    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        if (result.success) {
            deals = result.data;
            refreshAllViews();
        }
    } catch (error) {
        console.error('Error connecting to Node.js backend API:', error);
    }
}

// Tab Switching
function switchTab(tabName) {
    ['dashboard', 'pipeline', 'leads'].forEach(t => {
        document.getElementById(`view-${t}`).classList.add('hidden');
        document.getElementById(`nav-${t}`).classList.remove('bg-indigo-600', 'text-white');
        document.getElementById(`nav-${t}`).classList.add('hover:bg-slate-800', 'hover:text-white');
    });
    document.getElementById(`view-${tabName}`).classList.remove('hidden');
    document.getElementById(`nav-${tabName}`).classList.add('bg-indigo-600', 'text-white');

    if (tabName === 'dashboard') renderCharts();
    if (tabName === 'pipeline') renderKanban();
    if (tabName === 'leads') renderLeadsTable();
}

function openModal(id = null) {
    document.getElementById('deal-modal').classList.add('modal-active');
    if (id) {
        const deal = deals.find(d => d._id === id);
        document.getElementById('modal-title').innerText = 'Edit Deal';
        document.getElementById('deal-id').value = deal._id;
        document.getElementById('form-title').value = deal.title;
        document.getElementById('form-company').value = deal.companyName;
        document.getElementById('form-email').value = deal.contactEmail;
        document.getElementById('form-value').value = deal.value;
        document.getElementById('form-stage').value = deal.stage;
        document.getElementById('form-owner').value = deal.owner;
    } else {
        document.getElementById('modal-title').innerText = 'Add Deal';
        document.getElementById('deal-form').reset();
        document.getElementById('deal-id').value = '';
    }
}

function closeModal() {
    document.getElementById('deal-modal').classList.remove('modal-active');
}

// Save or Update Deal via REST API
async function saveDeal(e) {
    e.preventDefault();
    const id = document.getElementById('deal-id').value;
    const dealData = {
        title: document.getElementById('form-title').value,
        companyName: document.getElementById('form-company').value,
        contactEmail: document.getElementById('form-email').value,
        value: parseFloat(document.getElementById('form-value').value),
        stage: document.getElementById('form-stage').value,
        owner: document.getElementById('form-owner').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData)
    });

    closeModal();
    fetchDeals();
}

async function deleteDeal(id) {
    if (confirm('Delete this deal?')) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        fetchDeals();
    }
}

async function updateStage(id, newStage) {
    await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
    });
    fetchDeals();
}

// Dashboard Calculations & Charts
function updateMetrics() {
    const totalPipeline = deals.reduce((acc, d) => acc + d.value, 0);
    const wonRevenue = deals.filter(d => d.stage === 'Won').reduce((acc, d) => acc + d.value, 0);
    const activeDeals = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').length;
    const wonCount = deals.filter(d => d.stage === 'Won').length;
    const closedCount = wonCount + deals.filter(d => d.stage === 'Lost').length;
    const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

    document.getElementById('metric-pipeline-value').innerText = `$${totalPipeline.toLocaleString()}`;
    document.getElementById('metric-won-revenue').innerText = `$${wonRevenue.toLocaleString()}`;
    document.getElementById('metric-active-deals').innerText = activeDeals;
    document.getElementById('metric-win-rate').innerText = `${winRate}%`;
}

function renderCharts() {
    updateMetrics();
    const stageValues = stages.map(s => deals.filter(d => d.stage === s).reduce((sum, d) => sum + d.value, 0));
    
    if (pipelineChartInstance) pipelineChartInstance.destroy();
    pipelineChartInstance = new Chart(document.getElementById('pipelineChart').getContext('2d'), {
        type: 'bar',
        data: { labels: stages, datasets: [{ label: 'Pipeline Value ($)', data: stageValues, backgroundColor: '#6366f1' }] }
    });
}

function renderKanban() {
    const container = document.getElementById('kanban-board');
    container.innerHTML = '';
    stages.forEach(stage => {
        const stageDeals = deals.filter(d => d.stage === stage);
        const col = document.createElement('div');
        col.className = 'bg-gray-100 rounded-xl p-3 flex flex-col h-full border min-w-[260px]';
        col.innerHTML = `
            <div class="flex justify-between items-center mb-3"><span class="text-xs font-bold uppercase text-gray-700">${stage}</span><span class="text-xs bg-white px-2 py-0.5 rounded-full">${stageDeals.length}</span></div>
            <div class="flex-1 overflow-y-auto space-y-3">
                ${stageDeals.map(d => `
                    <div class="bg-white p-4 rounded-lg shadow-2xs border space-y-2">
                        <div class="flex justify-between"><h4 class="font-semibold text-sm">${d.title}</h4><button onclick="openModal('${d._id}')"><i class="fa-solid fa-pen text-xs"></i></button></div>
                        <p class="text-xs text-gray-500">${d.companyName}</p>
                        <div class="flex justify-between items-center pt-2 border-t"><span class="text-xs font-bold text-indigo-600">$${d.value}</span>
                        <select onchange="updateStage('${d._id}', this.value)" class="text-[11px] border rounded px-1">${stages.map(s => `<option value="${s}" ${s === stage ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(col);
    });
}

function renderLeadsTable() {
    const tbody = document.getElementById('leads-table-body');
    tbody.innerHTML = deals.map(d => `
        <tr class="hover:bg-gray-50">
            <td class="p-4"><p class="font-semibold">${d.title}</p><p class="text-xs text-gray-500">${d.companyName}</p></td>
            <td class="p-4">${d.contactEmail}</td>
            <td class="p-4 font-semibold text-indigo-600">$${d.value.toLocaleString()}</td>
            <td class="p-4"><span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">${d.stage}</span></td>
            <td class="p-4 text-right space-x-2"><button onclick="openModal('${d._id}')" class="text-indigo-600"><i class="fa-solid fa-pen"></i></button><button onclick="deleteDeal('${d._id}')" class="text-rose-600"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function refreshAllViews() {
    updateMetrics();
    renderKanban();
    renderLeadsTable();
    if(!document.getElementById('view-dashboard').classList.contains('hidden')) renderCharts();
}

// Initial Fetch
fetchDeals();