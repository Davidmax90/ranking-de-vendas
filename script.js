// script.js: Lógica principal da aplicação, comunicação com a API e manipulação da interface.

// URL base da API.
const API_URL = 'https://ranking-api-lyux.onrender.com';

// Funções de formatação de valores monetários e percentuais.
const formatCurrency = (value) => `R$${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const formatPercentage = (value) => `${value.toFixed(0)}%`;

// Função para determinar a cor de texto (preto ou branco) que contrasta com uma cor de fundo.
const getContrastColor = (backgroundColor) => {
    // Converte a cor hexadecimal para o formato RGB.
    const hexToRgb = (hex) => {
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length == 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return [r, g, b];
    };
    
    const [r, g, b] = hexToRgb(backgroundColor);
    // Fórmula YIQ para calcular o brilho da cor e determinar o contraste.
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000' : '#fff';
};

// Mapeia o percentual para as cores de borda e de fundo dos campos.
const getBorderAndBgColor = (percentage) => {
    let borderColor = '';
    let bgColor = '';
    
    // As cores são definidas em formato hexadecimal para que a função getContrastColor funcione.
    if (percentage === 0) { borderColor = '#00000000'; bgColor = '#00000000'; }
    else if (percentage >= 1 && percentage < 70) { borderColor = '#333333ff'; bgColor = '#333333ff'; }
    else if (percentage >= 70 && percentage < 85) { borderColor = '#ff0000ff'; bgColor = '#ff0000ff'; }
    else if (percentage >= 85 && percentage < 100) { borderColor = '#ffc107'; bgColor = '#ffc107'; }
    else if (percentage >= 100 && percentage < 110) { borderColor = '#28a745'; bgColor = '#28a745'; }
    else if (percentage >= 110 && percentage < 140) { borderColor = '#007bff'; bgColor = '#007bff'; }
    else if (percentage >= 140 && percentage < 150) { borderColor = '#00008b'; bgColor = '#00008b'; }
    else if (percentage >= 150 && percentage < 200) { borderColor = '#b700ffff'; bgColor = '#b700ffff'; }
    else if (percentage >= 200) { borderColor = '#000000ff'; bgColor = '#000000ff'; }
    
    // Cor de texto é determinada com base na cor de fundo.
    const textColor = getContrastColor(bgColor);

    return { borderColor, bgColor, textColor };
};

// Cria o HTML para um card de vendedor .
const createSellerCard = (person, rank) => {
    // Obtém as cores e classes com base no percentual do vendedor.
    const { borderColor, bgColor, textColor } = getBorderAndBgColor(person.percentage);
    
    const card = document.createElement('div');
    card.className = `seller-card`;
    card.style.borderColor = borderColor;
    
    let badge = '';
    // Adiciona os ícones de troféu, medalha e saco de dinheiro.
    if (rank === 1) {
        badge = '<div class="rank-badge"><i class="fas fa-trophy"></i></div>';
    } else if (rank === 2) {
        badge = '<div class="rank-badge"><i class="fas fa-medal"></i></div>';
    } else if (rank === 3) {
        badge = '<div class="rank-badge"><i class="fas fa-sack-dollar"></i></div>';
    }

    // Estrutura do HTML do card do vendedor.
    card.innerHTML = `
        ${badge}
        <div class="seller-img-container">
            <img src="${person.image}" alt="${person.name}">
        </div>
        <span class="seller-name">${person.name.toUpperCase()}</span>
        <span class="seller-percentage">${formatPercentage(person.percentage)}</span>
        <div class="seller-stats">
            <div class="stats-box meta-box" style="background-color: #333333ff; color: #fff;">
                <span class="stats-label">META</span>
                <span class="stats-value">${formatCurrency(person.meta)}</span>
            </div>
            <div class="stats-box resultado-box" style="background-color: ${bgColor}; color: ${textColor};">
                <span class="stats-label">RESULTADO</span>
                <span class="stats-value">${formatCurrency(person.resultado)}</span>
            </div>
            <div class="stats-box falta-box" style="background-color: #333333ff; color: #fff;">
                <span class="stats-label">FALTA</span>
                <span class="stats-value">${formatCurrency(person.falta)}</span>
            </div>
        </div>
    `;
    return card;
};

// Função principal para buscar os dados da API e renderizar a interface.
const fetchAndRenderDashboard = async () => {
    try {
        const response = await fetch(`${API_URL}/sellers`);
        const sellers = await response.json();

        // Calcula os dados de meta, resultado e falta para cada vendedor.
        const sellersWithCalculations = sellers.map(seller => {
            const percentage = seller.meta > 0 ? (seller.resultado / seller.meta) * 100 : 0;
            const falta = seller.meta - seller.resultado;
            return { ...seller, percentage, falta };
        });

        // Identifica o líder e os demais membros.
        const leader = sellersWithCalculations.find(s => s.role === 'leader');
        const members = sellersWithCalculations.filter(s => s.role === 'member');
        
        // Calcula os totais do squad.
        const squadMeta = sellersWithCalculations.reduce((sum, s) => sum + s.meta, 0);
        const squadResultado = sellersWithCalculations.reduce((sum, s) => sum + s.resultado, 0);
        const squadFalta = squadMeta - squadResultado;
        const squadPercentage = squadMeta > 0 ? (squadResultado / squadMeta) * 100 : 0;

        // Limpa e renderiza o card unificado do Squad.
        const mainCardContainer = document.getElementById('main-card-container');
        mainCardContainer.innerHTML = '';
        
        // Obtém as cores para o card do squad.
        const { borderColor: squadBorderColor, bgColor: squadBgColor } = getBorderAndBgColor(squadPercentage);

        // Cria o card unificado do Squad, Líder e Suri.
        const squadCard = document.createElement('div');
        squadCard.className = `squad-main-card`;
        squadCard.style.borderColor = squadBorderColor;
        
        squadCard.innerHTML = `
            <div class="squad-info-header">
                <span class="squad-name">SQUAD MAORI<br>LÍDER: <span class="leader-name">${leader.name.toUpperCase()}</span></span>
                    <div class="squad-logo-container">
                    <img src="images/squad-maori.png" alt="Squad MAORI" class="squad-img">
                </div>
                <div class="squad-details">
                    <div class="leader-info">
                        <img src="${leader.image}" alt="${leader.name}" class="leader-img">
                    </div>
                </div>
            </div>
            <div class="squad-stats-container">                
                <div class="stats-box meta-box" style="background-color: #333333ff; color: #fff;">
                    <span class="stats-label">META</span>
                    <span class="stats-value">${formatCurrency(squadMeta)}</span>
                </div>
                <div class="stats-box resultado-box" style="background-color: ${squadBgColor}; color: ${getContrastColor(squadBgColor)};">
                    <span class="stats-label">RESULTADO</span>
                    <span class="stats-value">${formatCurrency(squadResultado)}</span>
                </div>
                <div class="stats-box falta-box" style="background-color: #333333ff; color: #fff;">
                    <span class="stats-label">FALTA</span>
                    <span class="stats-value">${formatCurrency(squadFalta)}</span>
                </div>
                <div class="squad-percentage">
                    <span class="percentage-value">${formatPercentage(squadPercentage)}</span>
                </div>
            </div>
        `;
        mainCardContainer.appendChild(squadCard);

        // Classifica os membros por percentual para o ranking.
        members.sort((a, b) => b.percentage - a.percentage);
        const topSellers = members.slice(0, 3);
        const otherSellers = members.slice(3);

        const topSellersContainer = document.getElementById('top-sellers');
        const otherSellersContainer = document.getElementById('other-sellers');
        topSellersContainer.innerHTML = '';
        otherSellersContainer.innerHTML = '';

        // Renderiza os cards dos 3 melhores.
        topSellers.forEach((seller, index) => {
            const card = createSellerCard(seller, index + 1);
            topSellersContainer.appendChild(card);
        });

        // Renderiza os cards dos demais vendedores.
        otherSellers.forEach(seller => {
            const card = createSellerCard(seller, null);
            otherSellersContainer.appendChild(card);
        });

        // Preenche o menu suspenso do modal com os nomes dos vendedores.
        const sellerSelect = document.getElementById('seller-select');
        sellerSelect.innerHTML = '<option value="" disabled selected>Selecione um closer...</option>';
        sellers.forEach(seller => {
            if (seller.role !== 'leader') {
                const option = document.createElement('option');
                option.value = seller.name;
                option.textContent = seller.name;
                option.dataset.meta = seller.meta;
                option.dataset.resultado = seller.resultado;
                sellerSelect.appendChild(option);
            }
        });

    } catch (error) {
        console.error('Erro ao buscar dados da API:', error);
        alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    }
};

// Lógica para o modal de entrada de dados.
const modal = document.getElementById('modal');
const addDataBtn = document.getElementById('add-data-btn');
const closeBtn = document.querySelector('.close-btn');
const dataForm = document.getElementById('data-form');
const sellerSelect = document.getElementById('seller-select');
const metaInput = document.getElementById('meta-input');
const resultadoInput = document.getElementById('resultado-input');

// Eventos para abrir, fechar e enviar o modal.
addDataBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
window.addEventListener('click', (event) => { if (event.target === modal) { modal.style.display = 'none'; } });

sellerSelect.addEventListener('change', () => {
    const selectedOption = sellerSelect.options[sellerSelect.selectedIndex];
    if (selectedOption.value) {
        metaInput.value = selectedOption.dataset.meta;
        resultadoInput.value = selectedOption.dataset.resultado;
    }
});

dataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const selectedName = sellerSelect.value;
    const newMeta = parseFloat(metaInput.value);
    const newResultado = parseFloat(resultadoInput.value);

    const response = await fetch(`${API_URL}/sellers?name=${selectedName}`);
    const sellerToUpdate = (await response.json())[0];

    if (sellerToUpdate) {
        try {
            const updateResponse = await fetch(`${API_URL}/sellers/${sellerToUpdate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...sellerToUpdate,
                    meta: newMeta,
                    resultado: newResultado
                })
            });

            if (updateResponse.ok) {
                modal.style.display = 'none';
                fetchAndRenderDashboard();
            } else {
                alert('Erro ao salvar os dados.');
            }
        } catch (error) {
            console.error('Erro na requisição PUT:', error);
            alert('Erro ao salvar os dados. Tente novamente.');
        }
    } else {
        alert('Closer não encontrado.');
    }
});

// Lógica para o tema claro/escuro, mantida.
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-moon', !isDarkMode);
    icon.classList.toggle('fa-sun', isDarkMode);
});

// Inicializa a aplicação ao carregar a página.
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderDashboard();
});
