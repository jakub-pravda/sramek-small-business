function populateTable(sectionId) {
  fetch("/pricing.json")
    .then((response) => response.json())
    .then((data) => {
      const tbody = document.querySelector(`.table.${sectionId} tbody`);
      const groups = data[sectionId];

      tbody.innerHTML = "";

      groups.forEach((group) => {
        if (group.subheader) {
          const row = document.createElement("tr");
          const cell = document.createElement("td");
          cell.colSpan = 2;
          cell.textContent = group.subheader;
          cell.className = "pricing-subheader";
          row.appendChild(cell);
          tbody.appendChild(row);
        }

        group.items.forEach((item) => {
          const row = document.createElement("tr");
          const nameCell = document.createElement("td");
          const priceCell = document.createElement("td");

          nameCell.textContent = item.name;
          priceCell.textContent = item.price;

          nameCell.style.fontWeight = "500";
          priceCell.style.textAlign = "right";

          row.appendChild(nameCell);
          row.appendChild(priceCell);
          tbody.appendChild(row);
        });
      });
    });
}
