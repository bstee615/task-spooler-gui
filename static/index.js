columns = [
    "ID",
    "State",
    "Output",
    "E-Level",
    "Times(r/u/s)",
    "Command [run=0/1]",
]

function loadTable() {
    let socketName = $("#socketName").val();
    let url = "/tsp/list"
    if (socketName != "") {
        url += "/" + socketName
    }
    console.log(url, socketName);
    $.getJSON(url, function (data) {
        $('#mainTable').DataTable({
            serverSide: true,
            processing: true,
            ajax: { url: url },
            columns: [
                {
                    title: "ID",
                    data: "ID",
                },
                {
                    title: "State",
                    data: "State",
                },
                {
                    title: "Output",
                    data: "Output",
                },
                {
                    title: "E-Level",
                    data: "E-Level",
                },
                {
                    title: "Command",
                    data: "Command",
                },
                {
                    title: "Time (real)",
                    data: "Time (real)",
                },
                {
                    title: "Time (user)",
                    data: "Time (user)",
                },
                {
                    title: "Time (system)",
                    data: "Time (system)",
                },
            ],
        });
    });
}

$(document).ready(loadTable);
