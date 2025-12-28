const table = document.getElementById("bazaar");

// Taxa bazaar ~1.25%
const TAX = 0.9875;

fetch("https://api.hypixel.net/skyblock/bazaar")
  .then(res => res.json())
  .then(data => {
    const items = [];

    for (const name in data.products) {
      const qs = data.products[name].quick_status;

      const buy = qs.buyPrice;
      const sell = qs.sellPrice;

      if (buy <= 0 || sell <= 0) continue;

      const profit = sell * TAX - buy;

      if (profit > 0) {
        items.push({
          name,
          buy,
          sell,
          profit
        });
      }
    }

    items.sort((a, b) => b.profit - a.profit);
    render(items);
  })
  .catch(err => {
    console.error("Eroare API:", err);
  });

function render(items) {
  table.innerHTML = "";

  items.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.buy.toFixed(1)}</td>
      <td>${item.sell.toFixed(1)}</td>
      <td class="profit">+${item.profit.toFixed(1)}</td>
    `;
    table.appendChild(row);
  });
}
