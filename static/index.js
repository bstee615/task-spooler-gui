columns = [
    "ID",
    "State",
    "Output",
    "E-Level",
    "Times(r/u/s)",
    "Command [run=0/1]",
]
const RELOAD_INTERVAL_SECONDS = 10;
let table = null;

function basename(path) {
    return path.split('/').reverse()[0];
}

function loadSockets() {
    $.getJSON("/tsp/list_sockets", function (data) {
        console.log(data)
        let $select = $("#socketName");
        $.each(data, function (key, value) {
            $select.append(`<option value="${value}">${value}</option>`);
        });
        $select.prepend("<option value='' selected='selected'>&lt;default&gt;</option>");
    })
}

function updateLastRefreshIndicator() {
    $("#lastRefresh").text(new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString());
}

$("#socketName").change(function () {
    table.ajax.url(getAjaxUrl()).load();
    updateLastRefreshIndicator();
})

function refreshData() {
    table.ajax.reload();
    updateLastRefreshIndicator();
}

function initLastRefreshIndicator() {
    updateLastRefreshIndicator();
    // set timeout on next multiple of 10 seconds (to keep it nice and round)
    let firstDate = new Date();
    let targetSeconds = Math.ceil(firstDate.getSeconds() / 10) * 10;
    setTimeout(refreshData, (targetSeconds - firstDate.getSeconds()) * 1000);
    setTimeout(function() {
        setInterval(refreshData, RELOAD_INTERVAL_SECONDS * 1000);
    }, (targetSeconds - firstDate.getSeconds()) * 1000);
}

function getAjaxUrl() {
    let socketName = $("#socketName").val();
    let url = "/tsp/list"
    if (socketName) {
        url += "/" + socketName
    }
    return url;
}

function loadTable() {
    let url = getAjaxUrl();
    table = $('#mainTable').DataTable({
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
                render: function (data, type, row) {
                    if (data.startsWith("/tmp/ts-out.")) {
                        return '<a href="/tsp/output/' + basename(data) + '">' + data + '</a>';
                    }
                    else {
                        return data
                    }
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
    initLastRefreshIndicator();
}

$(document).ready(function () {
    loadSockets();
    loadTable();
});
