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
  editEditDialog();
};

const renderDashboardWithData = async () => {
  await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=getInventory&userId=1`)
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById('tbody') as HTMLTableElement;
      tbody.innerHTML = (data as InventoryItem[])
      .map((item) => 
        `<tr data-id=${item.id} data-description=${item.description} data-isStock=${item.isStock} data-barcode=${item.barcode} data-date=${item.date}><td>${item.id}</td><td>${item.description}</td><td>${item.date!.split("T")[0]}</td><td>${item.isStock}</td><td>${item.barcode}</td><td><button class="delete-btn" data-id="${item.id}">Delete</button></td></tr>`
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

 const editEditDialog = async () => {
  const tr = document.querySelectorAll("tr");
  const dialogEdit = document.getElementById("dialogEdit") as HTMLDialogElement;
  let id: string;
  let description = document.getElementById("edit-name") as HTMLInputElement;
  let date = document.getElementById("edit-date") as HTMLInputElement;
  let inStock = document.getElementById("edit-in-stock") as HTMLInputElement;
  let barcode = document.getElementById('edit-barcode') as HTMLInputElement;

  tr.forEach(row => {
    row.addEventListener("click", () => {
      id = row.getAttribute("data-id") as string;
      description.value = row.getAttribute("data-description") as string;
      date.value = row.getAttribute("data-date")!.split("T")[0];
      inStock.checked = row.getAttribute("data-isStock") === "true";
      barcode.value = row.getAttribute("data-barcode") as string;

      dialogEdit.showModal()
    })
  })

  const editButton = document.getElementById('edit') as HTMLButtonElement;

  editButton.addEventListener("click", async () => {
    await editItemOnClick(id, description.value, date.value, true, barcode.value)
  })

 }

 const editItemOnClick = async (id: string, description: string, date: string, inStock: boolean, barcode: string) => {
  await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=editInventory&description=${description}&expirationDate=${date}&inStock=${inStock}&barCode=${barcode}&userId=1&id=${id}`)
  .then(response => response.json())
  .then(data => {
      console.log(data);
  })
  await renderDashboardWithData();
 }


main();

      


