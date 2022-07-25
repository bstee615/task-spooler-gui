let columns = [
    "ID",
    "State",
    "Output",
    "E-Level",
    "Times(r/u/s)",
    "Command [run=0/1]",
]
let tableHead = document.getElementById('table-head')
let tableRow = tableHead.insertRow();
for (let column of columns) {
    let tableCell = tableRow.insertCell()
    tableCell.innerHTML = column
}

/*

        <tr>
          <th>ID</th>
          <th>State</th>
          <th>Output</th>
          <th>E-Level</th>
          <th>Times(r/u/s)</th>
          <th>Command</th>
          <th>[run=0/1]</th>
        </tr>
*/

let tableBody = document.getElementById('table-body')
console.log(tableHead, tableBody)

fetch('/tsp/list')
    .then((response) => response.json())
    .then((data) => {
        console.log('Success:', data)
        for (let row of data) {
            let tableRow = tableBody.insertRow();
            for (let column of columns) {
                console.log(row, column, row[column])
                let tableCell = tableRow.insertCell();
                tableCell.innerHTML = row[column];
            }
        }
    })

    