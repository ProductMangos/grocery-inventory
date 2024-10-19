import './style.css'
import { BrowserMultiFormatReader } from '@zxing/library';

interface InventoryItem {
  id: string;
  description: string;
  date: string;
  quantity: string;
  isStock: boolean;
  barcode: string;
}

let globalData: InventoryItem[] = [];

const main = async () => {
  await renderDashboardWithData();
  openAddDialogOnClick();
  await addItemOnClick();
  editEditDialog();
  await openHTMLCamera();
};

const renderDashboardWithData = async () => {
  const loading = document.getElementById("loadingDialog") as HTMLDialogElement;
  loading.showModal();
  await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=getInventory&userId=1`)
    .then(response => response.json())
    .then(data => {
      loading.close();
      const tbody = document.getElementById('tbody') as HTMLTableElement;
      tbody.innerHTML = (data as InventoryItem[])
      .map((item) => 
        `<tr data-id=${item.id} data-description="${item.description}" data-quantity=${item.quantity} data-isStock=${item.isStock} data-barcode=${item.barcode} data-date=${item.date}><td style="display: none"></td><td>${item.description}</td><td>${item.date!.split("T")[0]}</td><td>${item.quantity}</td><td>${item.isStock}</td><td>${item.barcode}</td></tr>`
      ).join('');
      globalData = data;
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
    const rand = Date.now() * Math.random();
    const id = rand.toString().slice(0, 10);
    const description = document.getElementById("name") as HTMLInputElement;
    const date = document.getElementById("date") as HTMLInputElement;
    const inStock = document.getElementById("in-stock") as HTMLInputElement;
    const barCode = document.getElementById("barcode") as HTMLInputElement;

    let duplicate = false;
    globalData.forEach((item) => {
      if(parseInt(item.barcode) === parseInt(barCode.value)) {
        duplicate = true;
      } else {
        duplicate = false;
      }
    });

    if (!duplicate) { 
      await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=addInventory&id=${id}&description=${description.value}&expirationDate=${date.value}&inStock=${inStock.checked}&barCode=${barCode.value}&userId=1`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })

      await renderDashboardWithData();

    } else {
      alert("Barcode already exists");
    }
  });
 }


 const deleteItemOnClick = async (id: string, editDialog: HTMLDialogElement) => {
  const deleteItem = document.getElementById("delete") as HTMLButtonElement;
 const loading = document.getElementById("loadingDialog") as HTMLDialogElement;
 
  const newDeleteItem = deleteItem.cloneNode(true) as HTMLButtonElement;
  deleteItem.parentNode?.replaceChild(newDeleteItem, deleteItem);

  newDeleteItem.addEventListener("click", async () => {
    loading.showModal();
    try {
      await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=deleteInventoryRow&id=${id}&userId=1`)
      .then(response => response.json())
      .then(async (data) => {
        console.log(data);
        editDialog.close();
        loading.close();
        await renderDashboardWithData();
      });
    } catch(error) {
      console.log(error);
      loading.close();
    }

  });
};



const editEditDialog = () => {
  const tbody = document.getElementById('tbody') as HTMLTableElement;
  const dialogEdit = document.getElementById('dialogEdit') as HTMLDialogElement;
  let currentEditId: string | null = null;

  let description = document.getElementById('edit-name') as HTMLInputElement;
  let date = document.getElementById('edit-date') as HTMLInputElement;
  let quantity = document.getElementById('edit-quantity') as HTMLInputElement;
  let inStock = document.getElementById('edit-in-stock') as HTMLInputElement;
  let barcode = document.getElementById('edit-barcode') as HTMLInputElement;

  // Attach event listener to tbody for event delegation
  tbody.addEventListener("click", (event) => {
    const row = (event.target as HTMLElement).closest("tr");
    if (row) {
      currentEditId = row.getAttribute("data-id"); // Store the current item's ID
      description.value = row.getAttribute("data-description") as string;
      quantity.value = row.getAttribute("data-quantity") as string;
      date.value = row.getAttribute("data-date")!.split("T")[0];
      inStock.checked = row.getAttribute("data-isStock") === "true";
      barcode.value = row.getAttribute("data-barcode") as string;

      dialogEdit.showModal();
      deleteItemOnClick(currentEditId!, dialogEdit); // Use the stored ID for deletion
    }
  });

  const editButton = document.getElementById('edit') as HTMLButtonElement;
  editButton.addEventListener("click", async () => {
    if (currentEditId) {
      console.log(currentEditId, description.value, date.value, quantity.value, inStock.checked, barcode.value);
      await editItemOnClick(currentEditId, description.value, date.value, quantity.value, inStock.checked, barcode.value);
    }
  });
};

 const editItemOnClick = async (id: string, description: string, date: string, quantity: string, inStock: boolean, barcode: string) => {
  await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=editInventory&description=${description}&expirationDate=${date}&quantity=${quantity}&inStock=${inStock}&barCode=${barcode}&userId=1&id=${id}`)
  .then(response => response.json())
  .then(data => {
      console.log(data);
  })
  await renderDashboardWithData();
 }

 const openHTMLCamera = async () => {
  const triggerScanButton = document.getElementById("trigger-scan") as HTMLButtonElement;
  const videoElement = document.getElementById("videoElement") as HTMLVideoElement;
  const addVideoDialog = document.getElementById("addVideoDialog") as HTMLDialogElement;

  triggerScanButton.addEventListener("click", async () => {
    addVideoDialog.showModal();
    closeVideoDialog();
    
    try {
      const codeReader = new BrowserMultiFormatReader();

      // Get access to the camera and display the video stream
      codeReader.decodeFromInputVideoDevice(undefined, videoElement)
        .then(result => {
          const scannedText = result.getText(); 

          let duplicate = false;
          globalData.forEach((item) => {
            if(parseInt(item.barcode) === parseInt(scannedText)) {
              duplicate = true;
            } else {
              duplicate = false;
            }
          });

  
          if (!duplicate) {
            fetch(`https://world.openfoodfacts.org/api/v0/product/${scannedText}.json`)
            .then(response => response.json())
            .then(data => {
              if (data.status === 0) {
                alert("No description available for the scanned item.");
                const stream = videoElement.srcObject as MediaStream;
                if (stream) {
                  const tracks = stream.getTracks();
                  tracks.forEach((track) => {
                    track.stop();
                  });
                }

                videoElement.srcObject = null;
                addVideoDialog.close();
                return;
              }

              const description = data.product.product_name;
              const barcode = data.product.code;
              const rand = Date.now() * Math.random();
              const id = rand.toString().slice(0, 10);

              fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=addInventory&id=${id}&description=${description}&expirationDate=null&quantity=1&inStock=true&barCode=${barcode}&userId=1`)

                .then(response => response.json())
                .then(data => {
                  console.log(data);
                  renderDashboardWithData();
                });

              const stream = videoElement.srcObject as MediaStream;
              if (stream) {
                const tracks = stream.getTracks();
                tracks.forEach((track) => {
                  track.stop();
                });
              }

              videoElement.srcObject = null;
              addVideoDialog.close();
            })
          } else {
            alert("Barcode already exists");
          }
          

        })
        .catch(err => {
          // Handle errors in the scanning process
          console.error("Error scanning code:", err);
        });
    } catch (err) {
      console.error("Error initializing camera:", err);
    }
  });
};


const closeVideoDialog = () => {
  const addVideoDialog = document.getElementById("addVideoDialog") as HTMLDialogElement;
  const closeVideo = document.getElementById("close-video") as HTMLButtonElement;
  const videoElement = document.getElementById("videoElement") as HTMLVideoElement;

  closeVideo.addEventListener("click", () => {
    console.log("close");
    const stream = videoElement.srcObject as MediaStream;
    if (stream) {
      const tracks = stream.getTracks(); 
      tracks.forEach((track) => {
        track.stop();
      });
    }

    videoElement.srcObject = null;
    addVideoDialog.close();
  })
}

main();

      
