import './style.css'
import { BrowserMultiFormatReader } from '@zxing/library';

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
        `<tr data-id=${item.id} data-description="${item.description}" data-isStock=${item.isStock} data-barcode=${item.barcode} data-date=${item.date}><td style="display: none"></td><td>${item.description}</td><td>${item.date!.split("T")[0]}</td><td>${item.isStock}</td><td>${item.barcode}</td></tr>`
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
    const rand = Date.now() * Math.random();
    const id = rand.toString().slice(0, 10);
    const description = document.getElementById("name") as HTMLInputElement;
    const date = document.getElementById("date") as HTMLInputElement;
    const inStock = document.getElementById("in-stock") as HTMLInputElement;
    const barCode = document.getElementById("barcode") as HTMLInputElement;


    await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=addInventory&id=${id}&description=${description.value}&expirationDate=${date.value}&inStock=${inStock.checked}&barCode=${barCode.value}&userId=1`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })

      await renderDashboardWithData();
  
  });
 }


 const deleteItemOnClick = async (id: string, editDialog: HTMLDialogElement) => {
  const deleteItem = document.getElementById("delete") as HTMLButtonElement;

  // Remove any existing event listener
  const newDeleteItem = deleteItem.cloneNode(true) as HTMLButtonElement;
  deleteItem.parentNode?.replaceChild(newDeleteItem, deleteItem);

  newDeleteItem.addEventListener("click", async () => {
    await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=deleteInventoryRow&id=${id}&userId=1`)
      .then(response => response.json())
      .then(async (data) => {
        console.log(data);
        editDialog.close();
        await renderDashboardWithData();
      });
  });
};


 const editEditDialog = () => {
  const tbody = document.getElementById('tbody') as HTMLTableElement;
  const dialogEdit = document.getElementById('dialogEdit') as HTMLDialogElement;

  let description = document.getElementById('edit-name') as HTMLInputElement;
  let date = document.getElementById('edit-date') as HTMLInputElement;
  let inStock = document.getElementById('edit-in-stock') as HTMLInputElement;
  let barcode = document.getElementById('edit-barcode') as HTMLInputElement;

  // Attach event listener to tbody for event delegation
  tbody.addEventListener("click", (event) => {
    const row = (event.target as HTMLElement).closest("tr");
    if (row) {
      const id = row.getAttribute("data-id") as string;
      description.value = row.getAttribute("data-description") as string;
      date.value = row.getAttribute("data-date")!.split("T")[0];
      inStock.checked = row.getAttribute("data-isStock") === "true";
      barcode.value = row.getAttribute("data-barcode") as string;

      dialogEdit.showModal();
      deleteItemOnClick(id, dialogEdit);
    }
  });

  const editButton = document.getElementById('edit') as HTMLButtonElement;
  editButton.addEventListener("click", async () => {
    const id = description.getAttribute("data-id"); // Ensure `id` is tied to description or another element
    if (id) {
      await editItemOnClick(id, description.value, date.value, inStock.checked, barcode.value);
    }
  });
}

 const editItemOnClick = async (id: string, description: string, date: string, inStock: boolean, barcode: string) => {
  await fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=editInventory&description=${description}&expirationDate=${date}&inStock=${inStock}&barCode=${barcode}&userId=1&id=${id}`)
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
          fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${scannedText}&pageSize=10&api_key=1kKZwAVhQ3d4nu4vayMevctde3xmIwxhsBMg6Jn7`)
            .then(response => response.json())
            .then(data => {
              if (data.totalHits === 0) {
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

              const getData = data.foods[0];

              fetch(`${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=addInventory&description=${getData.description}&expirationDate=null&inStock=true&barCode=${getData.gtinUpc}&userId=1`)
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

      
