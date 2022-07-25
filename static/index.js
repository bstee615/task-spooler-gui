columns = [
    "ID",
    "State",
    "Output",
    "E-Level",
    "Times(r/u/s)",
    "Command [run=0/1]",
]

function basename(path) {
    return path.split('/').reverse()[0];
}

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
                    render: function ( data, type, row ) {
                        return '<a href="/tsp/output/' + basename(data) + '">' + data + '</a>';
                    },
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
