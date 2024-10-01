import './style.css'

interface InventoryItem {
  id: string;
  description: string;
  date: string;
  isStock: boolean;
  barcode: string;
}

const main = async () => {
  await renderDashboardWithData();
};

const renderDashboardWithData = async () => {
  await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=getInventory&userId=1`)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      const tbody = document.getElementById('tbody') as HTMLTableElement;
      tbody.innerHTML = (data as InventoryItem[])
      .map((item) => 
        `<tr><td>${item.id}</td><td>${item.description}</td><td>${item.date}</td><td>${item.isStock}</td><td>${item.barcode}</td></tr>`
      ).join('');
    });
};

main();