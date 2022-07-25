columns = ["ID", "State", "Output", "E-Level", "Times(r/u/s)", "Command [run=0/1]"]

function loadTable() {
    let socketName = $("#socketName").val();
    let url = "/tsp/list"
    if (socketName != "") {
        url += "/" + socketName
    }
    console.log(url, socketName);
    $.getJSON(url, function (data) {
        $('#mainTable').DataTable({
            data: data,
            columns: columns.map((col) => {return { title: col, data: col }})
        });
    });
}

$(document).ready(loadTable);
