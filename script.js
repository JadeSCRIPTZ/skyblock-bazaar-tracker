class BazaarTracker {
    constructor() {
        this.apiUrl = 'https://api.hypixel.net/skyblock/bazaar';
        this.items = [];
        this.filteredItems = [];
        this.currentSort = 'profitMargin';
        this.searchTerm = '';
        this.chart = null;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadBazaarData();
        this.setupAutoRefresh();
    }
    
    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadBazaarData());
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterAndSortItems();
        });
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.filterAndSortItems();
        });
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('itemModal').classList.remove('active');
        });
        document.getElementById('itemModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('itemModal')) {
                document.getElementById('itemModal').classList.remove('active');
            }
        });
    }
    
    async loadBazaarData() {
        const loading = document.getElementById('loading');
        loading.classList.add('active');
        
        try {
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            if (data.success) {
                this.processBazaarData(data.products);
                this.updateStats();
                loading.classList.remove('active');
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            console.error('Error loading bazaar data:', error);
            loading.classList.remove('active');
            this.showError('Eroare la încărcarea datelor. Încearcă din nou.');
        }
    }
    
    processBazaarData(products) {
        this.items = [];
        
        for (const [itemId, itemData] of Object.entries(products)) {
            const buyPrice = itemData.quick_status.buyPrice;
            const sellPrice = itemData.quick_status.sellPrice;
            
            // Skip items with invalid prices
            if (buyPrice <= 0 || sellPrice <= 0) continue;
            
            const profit = sellPrice - buyPrice;
            const profitMargin = ((profit / buyPrice) * 100).toFixed(2);
            
            const volume = itemData.quick_status.buyVolume + itemData.quick_status.sellVolume;
            
            this.items.push({
                id: itemId,
                name: this.formatItemName(itemId),
                buyPrice: buyPrice.toFixed(2),
                sellPrice: sellPrice.toFixed(2),
                profit: profit.toFixed(2),
                profitMargin: parseFloat(profitMargin),
                volume: volume,
                productId: itemId
            });
        }
        
        this.filterAndSortItems();
    }
    
    formatItemName(itemId) {
        return itemId
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    filterAndSortItems() {
        // Filter by search term
        this.filteredItems = this.items.filter(item => 
            item.name.toLowerCase().includes(this.searchTerm) ||
            item.id.toLowerCase().includes(this.searchTerm)
        );
        
        // Sort items
        this.filteredItems.sort((a, b) => {
            switch (this.currentSort) {
                case 'profitMargin':
                    return b.profitMargin - a.profitMargin;
                case 'profitMarginAsc':
                    return a.profitMargin - b.profitMargin;
                case 'profitAbsolute':
                    return b.profit - a.profit;
                case 'instantSell':
                    return b.sellPrice - a.sellPrice;
                case 'instantBuy':
                    return b.buyPrice - a.buyPrice;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return b.profitMargin - a.profitMargin;
            }
        });
        
        this.renderTable();
    }
    
    renderTable() {
        const tbody = document.getElementById('itemsTableBody');
        tbody.innerHTML = '';
        
        this.filteredItems.forEach(item => {
            const row = document.createElement('tr');
            
            const profitClass = item.profitMargin > 0 ? 'profit-positive' : 
                               item.profitMargin < 0 ? 'profit-negative' : 'profit-neutral';
            
            row.innerHTML = `
                <td>
                    <strong>${item.name}</strong><br>
                    <small class="item-id">${item.id}</small>
                </td>
                <td>${Number(item.buyPrice).toLocaleString('ro-RO')} coins</td>
                <td>${Number(item.sellPrice).toLocaleString('ro-RO')} coins</td>
                <td class="${profitClass}">${Number(item.profit).toLocaleString('ro-RO')} coins</td>
                <td class="${profitClass}">${item.profitMargin}%</td>
                <td>${item.volume.toLocaleString('ro-RO')}</td>
                <td>
                    <button class="action-btn" onclick="bazaarTracker.showItemDetails('${item.productId}')">
                        <i class="fas fa-chart-line"></i> Detalii
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    updateStats() {
        if (this.items.length === 0) return;
        
        document.getElementById('totalItems').textContent = this.items.length.toLocaleString('ro-RO');
        
        const avgProfit = this.items.reduce((sum, item) => sum + item.profitMargin, 0) / this.items.length;
        document.getElementById('avgProfit').textContent = `${avgProfit.toFixed(2)}%`;
        
        const topProfit = Math.max(...this.items.map(item => item.profitMargin));
        document.getElementById('topProfit').textContent = `${topProfit.toFixed(2)}%`;
    }
    
    showItemDetails(productId) {
        const item = this.items.find(i => i.id === productId);
        if (!item) return;
        
        document.getElementById('modalItemName').textContent = item.name;
        document.getElementById('modalBuyPrice').textContent = `${Number(item.buyPrice).toLocaleString('ro-RO')} coins`;
        document.getElementById('modalSellPrice').textContent = `${Number(item.sellPrice).toLocaleString('ro-RO')} coins`;
        
        const profitElement = document.getElementById('modalProfit');
        profitElement.textContent = `${item.profit} coins (${item.profitMargin}%)`;
        profitElement.className = item.profitMargin > 0 ? 'profit profit-positive' : 
                                 item.profitMargin < 0 ? 'profit profit-negative' : 'profit profit-neutral';
        
        document.getElementById('modalVolume').textContent = `${item.volume.toLocaleString('ro-RO')} unități`;
        
        // Desenează un grafic demo (în aplicația reală, ai nevoie de date istorice)
        this.renderPriceChart();
        
        document.getElementById('itemModal').classList.add('active');
    }
    
    renderPriceChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        // Date demo - în aplicația reală, ai nevoie de API pentru date istorice
        const days = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
        const buyPrices = Array.from({length: 7}, () => Math.random() * 100 + 50);
        const sellPrices = buyPrices.map(price => price * (1 + Math.random() * 0.2 - 0.1));
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [
                    {
                        label: 'Preț Cumpărare',
                        data: buyPrices,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Preț Vânzare',
                        data: sellPrices,
                        borderColor: '#8a2be2',
                        backgroundColor: 'rgba(138, 43, 226, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#e0e0e0'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} coins`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#2a2a3e'
                        },
                        ticks: {
                            color: '#b0b0b0'
                        }
                    },
                    y: {
                        grid: {
                            color: '#2a2a3e'
                        },
                        ticks: {
                            color: '#b0b0b0',
                            callback: function(value) {
                                return value.toFixed(0) + ' coins';
                            }
                        }
                    }
                }
            }
        });
    }
    
    setupAutoRefresh() {
        // Actualizează datele la fiecare 60 de secunde
        setInterval(() => {
            this.loadBazaarData();
        }, 60000);
    }
    
    showError(message) {
        // Puteți implementa un sistem de notificări mai avansat aici
        alert(message);
    }
}

// Inițializează aplicația când se încarcă pagina
document.addEventListener('DOMContentLoaded', () => {
    window.bazaarTracker = new BazaarTracker();
});
