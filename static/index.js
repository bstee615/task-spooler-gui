columns = ["ID", "State", "Output", "E-Level", "Times(r/u/s)", "Command [run=0/1]"]

$(document).ready(function () {
    $.getJSON("/tsp/list", function (data) {
        $('#mainTable').DataTable({
            data: data,
            columns: columns.map((col) => {return { title: col, data: col }})
        });
    });
});
