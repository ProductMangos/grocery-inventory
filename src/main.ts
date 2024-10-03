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
  openAddDialogOnClick();
  await addItemOnClick();
  await openDeleteDialog();
  closeDeleteDialog();
};

const renderDashboardWithData = async () => {
  await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=getInventory&userId=1`)
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById('tbody') as HTMLTableElement;
      tbody.innerHTML = (data as InventoryItem[])
      .map((item) => 
        `<tr><td>${item.id}</td><td>${item.description}</td><td>${item.date}</td><td>${item.isStock}</td><td>${item.barcode}</td><td><button class="delete-btn" data-id="${item.id}">Delete</button></td></tr>`
      ).join('');
    });
};

const openAddDialogOnClick = () => {
  const addButton = document.getElementById("trigger-name") as HTMLButtonElement;
  const addDialog = document.getElementById("dialogAdd") as HTMLDialogElement;

  addButton.addEventListener("click", () => {
    addDialog.showModal();  
  });
 }


 const addItemOnClick = async () => {
  const addButton = document.getElementById("add") as HTMLButtonElement;

  addButton.addEventListener("click", async () => {
    const description = document.getElementById("name") as HTMLInputElement;
    const date = document.getElementById("date") as HTMLInputElement;
    const inStock = document.getElementById("in-stock") as HTMLInputElement;
    const barCode = document.getElementById("barcode") as HTMLInputElement;

    await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=addInventory&description=${description.value}&expirationDate=${date.value}&inStock=${inStock.checked}&barCode=${barCode.value}&userId=1`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })

      await renderDashboardWithData();
  
  });
 }


 const openDeleteDialog = async () => {
  const deleteButton = document.querySelectorAll(".delete-btn");
  const deleteDialog = document.getElementById("dialogDelete") as HTMLDialogElement;
  let id: string;

  deleteButton.forEach(button => {
    button.addEventListener("click", async () => {
      id = button.getAttribute("data-id") as string;
      deleteDialog.showModal();
    })
  })

  const deleteItem = document.getElementById("delete") as HTMLButtonElement;
  deleteItem.addEventListener("click", async () => await deleteItemOnClick(id));

 }

 const closeDeleteDialog = () => {
  const dialogDelete = document.getElementById("dialog-delete") as HTMLDialogElement;
  const closeDelete = document.getElementById("close-delete") as HTMLButtonElement;

  closeDelete.addEventListener("click", () => {
    dialogDelete.close("No item to delete");

  })

 }

 const deleteItemOnClick = async (id: string) => {
  await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=deleteInventoryRow&id=${id}&userId=1`)
    .then(response => response.json())
    .then(data => {
      console.log(data);
  })
  await renderDashboardWithData();
 }


main();

      


