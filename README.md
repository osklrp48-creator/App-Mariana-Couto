<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mariana Couto Podologia</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #fdf2f8; }
        .pink-gradient { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
        .sidebar-item:hover { background-color: #fce7f3; color: #be185d; }
        .sidebar-item.active { background-color: #fce7f3; color: #be185d; border-right: 4px solid #be185d; }
        .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .btn-primary { background-color: #db2777; color: white; transition: all 0.3s; }
        .btn-primary:hover { background-color: #be185d; }
        /* Esconder scrollbar mas manter funcionalidade */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .modal-bg { background-color: rgba(0,0,0,0.5); }
    </style>
</head>
<body class="h-screen overflow-hidden flex flex-col md:flex-row">

    <!-- LOGIN OVERLAY -->
    <div id="login-screen" class="fixed inset-0 z-[100] pink-gradient flex items-center justify-center p-4">
        <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <div class="text-center mb-8">
                <h1 class="text-2xl font-bold text-pink-600">Mariana Couto</h1>
                <p class="text-gray-500">Podologia Profissional</p>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Usuário</label>
                    <input type="text" id="user" value="mariana" class="w-full p-3 border rounded-lg focus:ring-pink-500 focus:border-pink-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Senha</label>
                    <input type="password" id="pass" value="1234" class="w-full p-3 border rounded-lg focus:ring-pink-500 focus:border-pink-500">
                </div>
                <button onclick="login()" class="w-full btn-primary py-3 rounded-lg font-semibold shadow-lg">Entrar</button>
            </div>
        </div>
    </div>

    <!-- SIDEBAR -->
    <aside id="sidebar" class="hidden md:flex flex-col w-64 bg-white border-r border-pink-100 h-full">
        <div class="p-6 border-b border-pink-50">
            <h2 class="font-bold text-pink-600 text-lg uppercase tracking-wider">M. Couto Podologia</h2>
        </div>
        <nav class="flex-1 overflow-y-auto py-4">
            <a href="#" onclick="showSection('dashboard')" class="sidebar-item active flex items-center px-6 py-3 mb-1 transition-colors">
                <i class="fas fa-chart-line w-6"></i> Dashboard
            </a>
            <a href="#" onclick="showSection('clientes')" class="sidebar-item flex items-center px-6 py-3 mb-1 transition-colors">
                <i class="fas fa-users w-6"></i> Clientes
            </a>
            <a href="#" onclick="showSection('agenda')" class="sidebar-item flex items-center px-6 py-3 mb-1 transition-colors">
                <i class="fas fa-calendar-alt w-6"></i> Agenda
            </a>
            <a href="#" onclick="showSection('servicos')" class="sidebar-item flex items-center px-6 py-3 mb-1 transition-colors">
                <i class="fas fa-hand-sparkles w-6"></i> Serviços
            </a>
            <a href="#" onclick="showSection('financeiro')" class="sidebar-item flex items-center px-6 py-3 mb-1 transition-colors">
                <i class="fas fa-dollar-sign w-6"></i> Financeiro
            </a>
            <a href="#" onclick="showSection('relatorios')" class="sidebar-item flex items-center px-6 py-3 mb-1 transition-colors">
                <i class="fas fa-file-alt w-6"></i> Relatórios
            </a>
        </nav>
        <div class="p-4 border-t border-pink-50">
            <button onclick="logout()" class="flex items-center text-gray-500 hover:text-red-500 px-2">
                <i class="fas fa-sign-out-alt mr-2"></i> Sair
            </button>
        </div>
    </aside>

    <!-- MOBILE NAV -->
    <div class="md:hidden bg-white border-b border-pink-100 p-4 flex justify-between items-center">
        <h2 class="font-bold text-pink-600">M. Couto Podologia</h2>
        <button onclick="toggleMobileMenu()"><i class="fas fa-bars text-pink-600 text-xl"></i></button>
    </div>

    <!-- MAIN CONTENT -->
    <main class="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
        
        <!-- DASHBOARD -->
        <section id="sec-dashboard" class="space-y-6">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold text-gray-800">Olá, Mariana!</h1>
                <div class="text-sm text-gray-500" id="current-date"></div>
            </div>

            <!-- KPIs -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="card p-5 border-l-4 border-pink-500">
                    <p class="text-xs text-gray-500 uppercase font-bold">Agendamentos Hoje</p>
                    <p class="text-2xl font-bold text-gray-800" id="kpi-agendamentos">0</p>
                </div>
                <div class="card p-5 border-l-4 border-green-500">
                    <p class="text-xs text-gray-500 uppercase font-bold">Recebido (Mês)</p>
                    <p class="text-2xl font-bold text-gray-800" id="kpi-recebido">R$ 0,00</p>
                </div>
                <div class="card p-5 border-l-4 border-yellow-500">
                    <p class="text-xs text-gray-500 uppercase font-bold">Pendente</p>
                    <p class="text-2xl font-bold text-gray-800 text-yellow-600" id="kpi-pendente">R$ 0,00</p>
                </div>
                <div class="card p-5 border-l-4 border-blue-500">
                    <p class="text-xs text-gray-500 uppercase font-bold">Ticket Médio</p>
                    <p class="text-2xl font-bold text-gray-800" id="kpi-ticket">R$ 0,00</p>
                </div>
            </div>

            <!-- QUICK ACTIONS -->
            <div class="flex flex-wrap gap-3">
                <button onclick="openModal('modal-cliente')" class="btn-primary px-4 py-2 rounded-lg text-sm shadow-md flex items-center">
                    <i class="fas fa-plus mr-2"></i> Novo Cliente
                </button>
                <button onclick="showSection('agenda')" class="bg-white border border-pink-200 text-pink-600 px-4 py-2 rounded-lg text-sm shadow-sm flex items-center hover:bg-pink-50">
                    <i class="fas fa-calendar-plus mr-2"></i> Agendar
                </button>
            </div>

            <!-- AGENDA HOJE -->
            <div class="card overflow-hidden">
                <div class="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 class="font-bold text-gray-700">Agenda de Hoje</h3>
                    <span class="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full" id="agenda-count">0 atendimentos</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="text-xs text-gray-400 uppercase bg-gray-50">
                            <tr>
                                <th class="px-6 py-3">Horário</th>
                                <th class="px-6 py-3">Cliente</th>
                                <th class="px-6 py-3">Serviço</th>
                                <th class="px-6 py-3">Valor</th>
                                <th class="px-6 py-3">Status</th>
                                <th class="px-6 py-3">Ação</th>
                            </tr>
                        </thead>
                        <tbody id="table-agenda-hoje" class="divide-y divide-gray-100">
                            <!-- JS popula aqui -->
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- CLIENTES -->
        <section id="sec-clientes" class="hidden space-y-6">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold text-gray-800">Clientes</h1>
                <button onclick="openModal('modal-cliente')" class="btn-primary px-4 py-2 rounded-lg text-sm shadow-md">
                    <i class="fas fa-plus mr-2"></i> Novo Cliente
                </button>
            </div>
            
            <div class="card p-4">
                <div class="relative">
                    <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    <input type="text" onkeyup="filterClientes(this.value)" placeholder="Buscar por nome ou telefone..." class="w-full pl-10 p-2 border rounded-lg outline-pink-500">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="lista-clientes">
                <!-- JS popula aqui -->
            </div>
        </section>

        <!-- SERVIÇOS -->
        <section id="sec-servicos" class="hidden space-y-6">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold text-gray-800">Serviços</h1>
                <button onclick="openModal('modal-servico')" class="btn-primary px-4 py-2 rounded-lg text-sm shadow-md">
                    <i class="fas fa-plus mr-2"></i> Novo Serviço
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="lista-servicos">
                <!-- JS popula aqui -->
            </div>
        </section>

        <!-- AGENDA COMPLETA -->
        <section id="sec-agenda" class="hidden space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-800">Agenda Diária</h1>
                <input type="date" id="agenda-date-filter" onchange="renderAgenda()" class="p-2 border rounded-lg outline-pink-500">
            </div>

            <div class="card overflow-hidden">
                <div class="grid grid-cols-1 divide-y divide-gray-100" id="agenda-timeline">
                    <!-- Gerado por JS: 08:00 as 19:00 -->
                </div>
            </div>
        </section>

        <!-- FINANCEIRO -->
        <section id="sec-financeiro" class="hidden space-y-6">
            <h1 class="text-2xl font-bold text-gray-800">Financeiro (Receitas)</h1>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="card p-6 text-center">
                    <p class="text-gray-500 text-sm">Faturamento Total</p>
                    <p class="text-3xl font-bold text-pink-600" id="fin-faturamento">R$ 0,00</p>
                </div>
                <div class="card p-6 text-center border-b-4 border-green-500">
                    <p class="text-gray-500 text-sm">Total Recebido</p>
                    <p class="text-3xl font-bold text-green-600" id="fin-recebido">R$ 0,00</p>
                </div>
                <div class="card p-6 text-center border-b-4 border-yellow-500">
                    <p class="text-gray-500 text-sm">Aguardando Pagamento</p>
                    <p class="text-3xl font-bold text-yellow-600" id="fin-pendente">R$ 0,00</p>
                </div>
            </div>
            
            <div class="card">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 text-xs uppercase text-gray-400">
                        <tr>
                            <th class="px-6 py-3">Data</th>
                            <th class="px-6 py-3">Cliente</th>
                            <th class="px-6 py-3">Serviço</th>
                            <th class="px-6 py-3">Valor</th>
                            <th class="px-6 py-3">Forma</th>
                            <th class="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody id="table-financeiro" class="divide-y divide-gray-100"></tbody>
                </table>
            </div>
        </section>

    </main>

    <!-- MODAL CLIENTE -->
    <div id="modal-cliente" class="hidden fixed inset-0 z-50 modal-bg flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div class="p-6 border-b flex justify-between items-center bg-pink-50">
                <h3 class="font-bold text-pink-700">Novo Cliente</h3>
                <button onclick="closeModal('modal-cliente')"><i class="fas fa-times text-gray-400"></i></button>
            </div>
            <form onsubmit="saveCliente(event)" class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2">
                        <label class="text-xs font-bold text-gray-500 uppercase">Nome Completo *</label>
                        <input type="text" id="c-nome" required class="w-full p-2 border rounded-lg focus:ring-pink-500 outline-none">
                    </div>
                    <div class="col-span-2">
                        <label class="text-xs font-bold text-gray-500 uppercase">Telefone / WhatsApp *</label>
                        <input type="text" id="c-tel" required placeholder="(00) 00000-0000" class="w-full p-2 border rounded-lg focus:ring-pink-500 outline-none">
                    </div>
                    <div class="col-span-2">
                        <label class="text-xs font-bold text-gray-500 uppercase">Endereço</label>
                        <input type="text" id="c-end" class="w-full p-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-gray-500 uppercase">Bairro</label>
                        <input type="text" id="c-bairro" class="w-full p-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-gray-500 uppercase">Cidade</label>
                        <input type="text" id="c-cidade" class="w-full p-2 border rounded-lg">
                    </div>
                </div>
                <button type="submit" class="w-full btn-primary py-3 rounded-lg font-bold uppercase tracking-wider">Salvar Cliente</button>
            </form>
        </div>
    </div>

    <!-- MODAL AGENDAMENTO -->
    <div id="modal-agenda" class="hidden fixed inset-0 z-50 modal-bg flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div class="p-6 border-b flex justify-between items-center bg-pink-50">
                <h3 class="font-bold text-pink-700">Novo Agendamento</h3>
                <button onclick="closeModal('modal-agenda')"><i class="fas fa-times text-gray-400"></i></button>
            </div>
            <form onsubmit="saveAgendamento(event)" class="p-6 space-y-4">
                <input type="hidden" id="a-horario">
                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase">Cliente</label>
                    <select id="a-cliente" required class="w-full p-2 border rounded-lg"></select>
                </div>
                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase">Serviço</label>
                    <select id="a-servico" onchange="updateAgendamentoValor(this)" required class="w-full p-2 border rounded-lg"></select>
                </div>
                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase">Valor (R$)</label>
                    <input type="number" step="0.01" id="a-valor" class="w-full p-2 border rounded-lg">
                </div>
                <div class="flex items-center gap-2">
                    <input type="checkbox" id="a-bloqueio">
                    <label class="text-sm text-gray-600">Bloquear este horário (sem cliente)</label>
                </div>
                <button type="submit" class="w-full btn-primary py-3 rounded-lg font-bold">Confirmar</button>
            </form>
        </div>
    </div>

    <!-- MODAL ATENDIMENTO (FINALIZAÇÃO) -->
    <div id="modal-atendimento" class="hidden fixed inset-0 z-50 modal-bg flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div class="p-6 border-b bg-green-50">
                <h3 class="font-bold text-green-700">Finalizar Atendimento</h3>
            </div>
            <div class="p-6 space-y-4">
                <div id="atend-info" class="text-sm text-gray-600"></div>
                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase">Forma de Pagamento</label>
                    <select id="atend-forma" class="w-full p-2 border rounded-lg">
                        <option value="Pix">Pix</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Débito">Débito</option>
                        <option value="Crédito">Crédito</option>
                        <option value="Pendente">Pendente (Pagar depois)</option>
                    </select>
                </div>
                <button onclick="concluirAtendimento()" class="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Concluir e Receber</button>
            </div>
        </div>
    </div>

    <script>
        // --- DATA STATE (Simulando Banco de Dados) ---
        let db = {
            clientes: JSON.parse(localStorage.getItem('mc_clientes')) || [],
            servicos: JSON.parse(localStorage.getItem('mc_servicos')) || [
                {id: 1, nome: 'Podologia Completa', valor: 120, status: 'Ativo'},
                {id: 2, nome: 'Reflexologia Podal', valor: 80, status: 'Ativo'},
                {id: 3, nome: 'Unha Encravada', valor: 90, status: 'Ativo'}
            ],
            agendamentos: JSON.parse(localStorage.getItem('mc_agendamentos')) || [],
            financeiro: JSON.parse(localStorage.getItem('mc_financeiro')) || []
        };

        function saveData() {
            localStorage.setItem('mc_clientes', JSON.stringify(db.clientes));
            localStorage.setItem('mc_agendamentos', JSON.stringify(db.agendamentos));
            localStorage.setItem('mc_financeiro', JSON.stringify(db.financeiro));
            localStorage.setItem('mc_servicos', JSON.stringify(db.servicos));
        }

        // --- NAVIGATION ---
        function login() {
            document.getElementById('login-screen').classList.add('hidden');
            initApp();
        }

        function logout() {
            location.reload();
        }

        function showSection(sectionId) {
            document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
            document.getElementById(`sec-${sectionId}`).classList.remove('hidden');
            
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            event?.currentTarget?.classList?.add('active');

            if(sectionId === 'dashboard') renderDashboard();
            if(sectionId === 'clientes') renderClientes();
            if(sectionId === 'agenda') renderAgenda();
            if(sectionId === 'financeiro') renderFinanceiro();
            if(sectionId === 'servicos') renderServicos();
        }

        // --- CORE FUNCTIONS ---
        function initApp() {
            const now = new Date();
            document.getElementById('current-date').innerText = now.toLocaleDateString('pt-br', {dateStyle: 'full'});
            document.getElementById('agenda-date-filter').valueAsDate = now;
            showSection('dashboard');
        }

        // -- CLIENTES --
        function saveCliente(e) {
            e.preventDefault();
            const novo = {
                id: Date.now(),
                nome: document.getElementById('c-nome').value,
                tel: document.getElementById('c-tel').value,
                endereco: document.getElementById('c-end').value,
                bairro: document.getElementById('c-bairro').value,
                cidade: document.getElementById('c-cidade').value,
                data_cad: new Date().toLocaleDateString(),
                status: 'Ativo'
            };
            db.clientes.push(novo);
            saveData();
            closeModal('modal-cliente');
            renderClientes();
            if(confirm("Cliente cadastrado! Deseja realizar um agendamento agora?")) {
                showSection('agenda');
            }
        }

        function renderClientes(filter = "") {
            const container = document.getElementById('lista-clientes');
            container.innerHTML = "";
            const filtrados = db.clientes.filter(c => c.nome.toLowerCase().includes(filter.toLowerCase()) || c.tel.includes(filter));
            
            filtrados.forEach(c => {
                const totalAtend = db.financeiro.filter(f => f.clienteId === c.id).length;
                container.innerHTML += `
                    <div class="card p-4 flex flex-col justify-between">
                        <div>
                            <h3 class="font-bold text-gray-800">${c.nome}</h3>
                            <p class="text-sm text-pink-600 font-medium"><i class="fab fa-whatsapp"></i> ${c.tel}</p>
                            <p class="text-xs text-gray-400 mt-2">${c.bairro || 'Sem bairro'} - ${c.cidade || ''}</p>
                        </div>
                        <div class="mt-4 pt-4 border-t flex justify-between items-center text-xs">
                            <span class="text-gray-500">${totalAtend} atendimentos</span>
                            <button class="text-pink-600 font-bold">VER DETALHES</button>
                        </div>
                    </div>
                `;
            });
        }

        function filterClientes(val) { renderClientes(val); }

        // -- AGENDA --
        const horarios = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

        function renderAgenda() {
            const container = document.getElementById('agenda-timeline');
            const dataSel = document.getElementById('agenda-date-filter').value;
            container.innerHTML = "";

            horarios.forEach(h => {
                const agendamento = db.agendamentos.find(a => a.data === dataSel && a.horario === h);
                
                let html = `
                    <div class="flex items-center p-4 hover:bg-gray-50 transition-colors">
                        <div class="w-20 font-bold text-gray-400">${h}</div>
                        <div class="flex-1">
                `;

                if (agendamento) {
                    if (agendamento.bloqueio) {
                        html += `<div class="bg-gray-100 text-gray-500 p-2 rounded-lg border-2 border-dashed flex justify-between items-center">
                                    <span><i class="fas fa-lock mr-2"></i> Bloqueado</span>
                                    <button onclick="cancelarAgendamento(${agendamento.id})" class="text-xs text-red-400">Desbloquear</button>
                                 </div>`;
                    } else {
                        const cliente = db.clientes.find(c => c.id == agendamento.clienteId);
                        const servico = db.servicos.find(s => s.id == agendamento.servicoId);
                        const statusColors = {
                            'Agendado': 'bg-blue-100 text-blue-700',
                            'Concluído': 'bg-green-100 text-green-700',
                            'Faltou': 'bg-red-100 text-red-700'
                        };

                        html += `
                            <div class="card border border-pink-100 p-3 flex justify-between items-center">
                                <div>
                                    <span class="text-xs font-bold uppercase ${statusColors[agendamento.status] || 'bg-gray-100'} px-2 py-0.5 rounded-full">${agendamento.status}</span>
                                    <h4 class="font-bold text-gray-800">${cliente?.nome || 'Excluído'}</h4>
                                    <p class="text-xs text-gray-500">${servico?.nome} • R$ ${agendamento.valor}</p>
                                </div>
                                <div class="space-x-2">
                                    ${agendamento.status === 'Agendado' ? `
                                        <button onclick="abrirAtendimento(${agendamento.id})" class="bg-green-500 text-white p-2 rounded-lg text-xs">INICIAR</button>
                                        <button onclick="marcarFalta(${agendamento.id})" class="bg-gray-200 text-gray-600 p-2 rounded-lg text-xs">FALTA</button>
                                    ` : ''}
                                    <button onclick="cancelarAgendamento(${agendamento.id})" class="text-red-400 p-2"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    html += `<button onclick="prepararAgendamento('${h}')" class="text-gray-300 hover:text-pink-400 text-sm italic">+ Disponível</button>`;
                }

                html += `</div></div>`;
                container.innerHTML += html;
            });
        }

        function prepararAgendamento(horario) {
            document.getElementById('a-horario').value = horario;
            const selCli = document.getElementById('a-cliente');
            const selSer = document.getElementById('a-servico');
            
            selCli.innerHTML = db.clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
            selSer.innerHTML = db.servicos.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
            
            if(db.servicos.length > 0) document.getElementById('a-valor').value = db.servicos[0].valor;
            
            openModal('modal-agenda');
        }

        function updateAgendamentoValor(el) {
            const serv = db.servicos.find(s => s.id == el.value);
            if(serv) document.getElementById('a-valor').value = serv.valor;
        }

        function saveAgendamento(e) {
            e.preventDefault();
            const bloqueio = document.getElementById('a-bloqueio').checked;
            const novo = {
                id: Date.now(),
                data: document.getElementById('agenda-date-filter').value,
                horario: document.getElementById('a-horario').value,
                clienteId: bloqueio ? null : document.getElementById('a-cliente').value,
                servicoId: bloqueio ? null : document.getElementById('a-servico').value,
                valor: bloqueio ? 0 : document.getElementById('a-valor').value,
                bloqueio: bloqueio,
                status: 'Agendado'
            };
            db.agendamentos.push(novo);
            saveData();
            closeModal('modal-agenda');
            renderAgenda();
            renderDashboard();
        }

        function cancelarAgendamento(id) {
            if(confirm("Deseja realmente remover este registro?")) {
                db.agendamentos = db.agendamentos.filter(a => a.id !== id);
                saveData();
                renderAgenda();
                renderDashboard();
            }
        }

        // -- ATENDIMENTOS E FINANCEIRO --
        let agendamentoEmFoco = null;

        function abrirAtendimento(id) {
            agendamentoEmFoco = db.agendamentos.find(a => a.id === id);
            const cliente = db.clientes.find(c => c.id == agendamentoEmFoco.clienteId);
            const servico = db.servicos.find(s => s.id == agendamentoEmFoco.servicoId);
            
            document.getElementById('atend-info').innerHTML = `
                <p><b>Cliente:</b> ${cliente.nome}</p>
                <p><b>Serviço:</b> ${servico.nome}</p>
                <p class="text-lg font-bold text-pink-600 mt-2">Valor: R$ ${agendamentoEmFoco.valor}</p>
            `;
            openModal('modal-atendimento');
        }

        function concluirAtendimento() {
            const forma = document.getElementById('atend-forma').value;
            const statusPag = forma === 'Pendente' ? 'Pendente' : 'Pago';
            
            // 1. Atualiza Agendamento
            agendamentoEmFoco.status = 'Concluído';
            
            // 2. Lança no Financeiro
            const receita = {
                id: Date.now(),
                data: agendamentoEmFoco.data,
                clienteId: agendamentoEmFoco.clienteId,
                servicoId: agendamentoEmFoco.servicoId,
                valor: parseFloat(agendamentoEmFoco.valor),
                forma: forma,
                status: statusPag
            };
            db.financeiro.push(receita);
            
            saveData();
            closeModal('modal-atendimento');
            renderAgenda();
            renderDashboard();
            alert("Atendimento finalizado com sucesso!");
        }

        function renderFinanceiro() {
            const lista = document.getElementById('table-financeiro');
            lista.innerHTML = "";
            let total = 0, recebido = 0, pendente = 0;

            db.financeiro.sort((a,b) => new Date(b.data) - new Date(a.data)).forEach(f => {
                const cli = db.clientes.find(c => c.id == f.clienteId);
                const ser = db.servicos.find(s => s.id == f.servicoId);
                
                total += f.valor;
                if(f.status === 'Pago') recebido += f.valor;
                else pendente += f.valor;

                lista.innerHTML += `
                    <tr>
                        <td class="px-6 py-4 text-sm">${f.data}</td>
                        <td class="px-6 py-4 text-sm font-bold">${cli?.nome || '---'}</td>
                        <td class="px-6 py-4 text-sm text-gray-500">${ser?.nome || '---'}</td>
                        <td class="px-6 py-4 text-sm font-bold">R$ ${f.valor.toFixed(2)}</td>
                        <td class="px-6 py-4 text-sm">${f.forma}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded-full text-xs font-bold ${f.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                                ${f.status}
                            </span>
                        </td>
                    </tr>
                `;
            });

            document.getElementById('fin-faturamento').innerText = `R$ ${total.toFixed(2)}`;
            document.getElementById('fin-recebido').innerText = `R$ ${recebido.toFixed(2)}`;
            document.getElementById('fin-pendente').innerText = `R$ ${pendente.toFixed(2)}`;
        }

        // -- DASHBOARD --
        function renderDashboard() {
            const hoje = new Date().toISOString().split('T')[0];
            const agH = db.agendamentos.filter(a => a.data === hoje && !a.bloqueio);
            const finMes = db.financeiro.filter(f => f.status === 'Pago'); // Simplificado para total
            
            document.getElementById('kpi-agendamentos').innerText = agH.length;
            
            let totalRec = 0, totalPen = 0;
            db.financeiro.forEach(f => {
                if(f.status === 'Pago') totalRec += f.valor;
                else totalPen += f.valor;
            });
            
            document.getElementById('kpi-recebido').innerText = `R$ ${totalRec.toFixed(2)}`;
            document.getElementById('kpi-pendente').innerText = `R$ ${totalPen.toFixed(2)}`;
            
            const ticket = db.financeiro.length > 0 ? (totalRec + totalPen) / db.financeiro.length : 0;
            document.getElementById('kpi-ticket').innerText = `R$ ${ticket.toFixed(2)}`;

            // Tabela hoje
            const table = document.getElementById('table-agenda-hoje');
            table.innerHTML = "";
            agH.forEach(a => {
                const cli = db.clientes.find(c => c.id == a.clienteId);
                const ser = db.servicos.find(s => s.id == a.servicoId);
                table.innerHTML += `
                    <tr>
                        <td class="px-6 py-4 text-sm font-bold text-pink-600">${a.horario}</td>
                        <td class="px-6 py-4 text-sm">${cli?.nome}</td>
                        <td class="px-6 py-4 text-sm text-gray-500">${ser?.nome}</td>
                        <td class="px-6 py-4 text-sm font-bold">R$ ${a.valor}</td>
                        <td class="px-6 py-4 text-sm"><span class="px-2 py-1 bg-pink-50 text-pink-600 rounded text-xs">${a.status}</span></td>
                        <td class="px-6 py-4 text-sm">
                            <button onclick="showSection('agenda')" class="text-gray-400 hover:text-pink-600"><i class="fas fa-external-link-alt"></i></button>
                        </td>
                    </tr>
                `;
            });
            document.getElementById('agenda-count').innerText = `${agH.length} atendimentos`;
        }

        function renderServicos() {
            const container = document.getElementById('lista-servicos');
            container.innerHTML = db.servicos.map(s => `
                <div class="card p-5">
                    <h3 class="font-bold text-gray-800">${s.nome}</h3>
                    <p class="text-2xl font-bold text-pink-600 mt-2">R$ ${s.valor}</p>
                    <p class="text-xs text-gray-400 mt-1">Duração padrão: 60 min</p>
                </div>
            `).join('');
        }

        // -- UTILS --
        function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
        function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
        function toggleMobileMenu() {
            const sb = document.getElementById('sidebar');
            sb.classList.toggle('hidden');
            sb.classList.toggle('fixed');
            sb.classList.toggle('z-50');
        }

    </script>
</body>
</html>
