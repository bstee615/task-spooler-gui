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
let timeouts = [];
let intervals = [];

function basename(path) {
    return path.split('/').reverse()[0];
}

function loadSockets() {
    $.getJSON("/tsp/list_sockets", function (data) {
        let $select = $("#socketName");
        $.each(data, function (key, value) {
            $select.append(`<option value="${value}">${value}</option>`);
        });
        $select.prepend("<option value='' selected='selected'>&lt;default&gt;</option>");
    })
}

$("#socketName").change(function () {
    table.ajax.url(getAjaxUrl()).load();
    initLastUpdateIndicator();
})

function updateLastUpdateIndicator() {
    $("#lastUpdate").text(new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString());
}

function reloadData() {
    table.ajax.reload();
}

function initLastUpdateIndicator() {
    // initialize events
    updateLastUpdateIndicator();

    // clear old timeouts
    for (let timeoutIdx of timeouts) {
        clearTimeout(timeoutIdx);
    }
    for (let intervalsIdx of intervals) {
        clearInterval(intervalsIdx);
    }
    timeouts = [];
    intervals = [];

    // set timeout on next multiple of 10 seconds (to keep it nice and round)
    let firstDate = new Date();
    let targetSeconds = Math.ceil(firstDate.getSeconds() / 10) * 10;
    timeouts.push(setTimeout(reloadData, (targetSeconds - firstDate.getSeconds()) * 1000));
    timeouts.push(setTimeout(function () {
        intervals.push(setInterval(reloadData, RELOAD_INTERVAL_SECONDS * 1000));
    }, (targetSeconds - firstDate.getSeconds()) * 1000));
}

function getAjaxUrl() {
    let socketName = $("#socketName").val();
    let url = "/tsp/list"
    if (socketName) {
        url += "/" + socketName
    }
    return url;
}

const numLinesTail = 10;

function updateOutputDisplay(e) {
    if ($("#showOutputCheck").prop("checked")) {
        $this = $(this)
        let href = $this.attr("href");
        $.ajax({
            type: "GET",
            url: href,
            data: { 
                numLinesTail: $("#tailCheck").prop("checked") ? numLinesTail : null,
            },
            success: function (data) {
                text = data["text"];
                let lines = text.split(/\r\n|\r|\n/)
                const numLines = lines.length;
                let numLinesText = `${data["totalNumLines"].toLocaleString()} lines`;
                if ($("#tailCheck").prop("checked")) {
                    numLinesText += ` (${lines.length.toLocaleString()} shown)`;
                }
                $("#outputDisplayFilename").text($this.text());
                $("#outputDisplayNumLines").text(numLinesText);
                $("#outputDisplayText").text(lines.join("\n"));
            },
            error: function(err) {
                console.error(err);
            }
        });

        // prevent link
        e.preventDefault();
        return false;
    }
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
                        return '<a class="ts-out-link" href="/tsp/output/' + basename(data) + '">' + data + '</a>';
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
                render: function (data, type, row) {
                    if (data) {
                        return '<pre><code>' + basename(data) + '</code></pre>';
                    }
                    else {
                        return data
                    }
                },
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
    $('#mainTable').on('xhr.dt', function () {
        updateLastUpdateIndicator();
    });
    $('#mainTable').on('draw.dt', function () {
        $(".ts-out-link").click(updateOutputDisplay);
    });
    initLastUpdateIndicator();
}

function loadOutputDisplay() {
    if (!$('#showOutputCheck').prop('checked')) {
        $("#outputDisplay").hide();
    }
    $("#showOutputCheck").click(function () {
        if ($(this).prop('checked')) {
            $("#outputDisplay").show();
        } else {
            $("#outputDisplay").hide();
        }
    });
}

$(document).ready(function () {
    loadSockets();
    loadTable();
    loadOutputDisplay();
});
