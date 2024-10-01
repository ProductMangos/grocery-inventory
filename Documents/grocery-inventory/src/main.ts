import './style.css'

const main = async () => {
  await renderDataOnDashboard();
};

const renderDataOnDashboard = async () => {
  fetch(`${import.meta.env.VITE_GOOGLE_SHEET_URL}?action=getInventory&userId=1`)
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
};

const renderDataTable = async () => {

};

main();