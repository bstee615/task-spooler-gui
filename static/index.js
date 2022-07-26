columns = [
    "ID",
    "State",
    "Output",
    "E-Level",
    "Times(r/u/s)",
    "Command [run=0/1]",
]
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
    resetOutputDisplay();

    table.ajax.url(getAjaxUrl()).load();
    updateLastUpdateIndicator();
    initUpdates();
})

$("#updateInterval").change(function () {
    initUpdates();
})

function updateLastUpdateIndicator() {
    $("#lastUpdate").text(new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString());
}

function reloadData() {
    if ($("#updateTableCheck").prop("checked")) {
        table.ajax.reload();
    }
    if ($("#updateOutputCheck").prop("checked")) {
        updateOutputDisplay();
    }
}

function initUpdates() {
    // clear old timeouts
    for (let timeoutIdx of timeouts) {
        clearTimeout(timeoutIdx);
    }
    for (let intervalsIdx of intervals) {
        clearInterval(intervalsIdx);
    }
    timeouts = [];
    intervals = [];

    // set timeout on next multiple of updateInterval seconds (to keep it nice and round)
    let firstDate = new Date();
    let updateInterval = parseInt($("#updateInterval").val());
    let targetSeconds = Math.ceil(firstDate.getSeconds() / updateInterval) * updateInterval;
    timeouts.push(setTimeout(reloadData, (targetSeconds - firstDate.getSeconds()) * 1000));
    timeouts.push(setTimeout(function () {
        intervals.push(setInterval(reloadData, updateInterval * 1000));
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
let tailFile = null;

function updateOutputDisplayFile(e) {
    $this = $(this)
    let href = $this.attr("href");
    let filename = $this.text();
    tailFile = {
        href,
        filename
    };

    updateOutputDisplay();

    // prevent link
    e.preventDefault();
    return false;
}

function resetOutputDisplay() {
    setOutputDisplay("", {"totalNumLines": 0, "text": ""});
    tailFile = null;
}

function setOutputDisplay(filename, data) {
    text = data["text"];
    let lines = text.split(/\r\n|\r|\n/)
    let totalNumLines = data["totalNumLines"];
    let numLinesText = `${totalNumLines.toLocaleString()} lines`;
    if ($("#tailCheck").prop("checked") && totalNumLines > 0) {
        numLinesText += ` (${lines.length.toLocaleString()} shown)`;
    }
    $("#outputDisplayFilename").text(filename);
    $("#outputDisplayNumLines").text(numLinesText);
    $("#outputDisplayText").text(lines.join("\n"));
}

function updateOutputDisplay() {
    if ($("#showOutputCheck").prop("checked") && tailFile != null) {
        $.ajax({
            type: "GET",
            url: tailFile.href,
            data: { 
                numLinesTail: $("#tailCheck").prop("checked") ? numLinesTail : null,
            },
            success: function (data) {
                setOutputDisplay(tailFile.filename, data);
            },
            error: function(err) {
                console.error(err);
            }
        });
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
        $(".ts-out-link").click(updateOutputDisplayFile);
    });

    updateLastUpdateIndicator();
    initUpdates();
    resetOutputDisplay();
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
