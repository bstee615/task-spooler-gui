columns = ["ID", "State", "Output", "E-Level", "Time", "Command"];
let table = null;
let timeouts = [];
let intervals = [];

function basename(path) {
  return path.split("/").reverse()[0];
}

function loadSockets() {
  $.getJSON("/task-spooler/list_sockets", function (data) {
    let $select = $("#socketName");
    $.each(data, function (key, value) {
      $select.append(`<option value="${value}">${value}</option>`);
    });
    $select.prepend(
      "<option value='' selected='selected'>&lt;default&gt;</option>"
    );
  });
}

$("#socketName").change(function () {
  resetOutputDisplay();

  table.ajax.url(getAjaxUrl("list"));
  reloadTable(false);
  updateLastUpdateTable();
  initUpdates();
});

$("#updateInterval").change(function () {
  initUpdates();
});

function updateLastUpdateTable() {
  $("#lastUpdateTable").text(
    new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
  );
}

function updateLastUpdateOutput() {
  $("#lastUpdateOutput").text(
    new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
  );
}

function reloadData() {
  if ($("#updateTableCheck").prop("checked")) {
    reloadTable();
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
  let targetSeconds =
    Math.ceil(firstDate.getSeconds() / updateInterval) * updateInterval;
  timeouts.push(
    setTimeout(reloadData, (targetSeconds - firstDate.getSeconds()) * 1000)
  );
  timeouts.push(
    setTimeout(function () {
      intervals.push(setInterval(reloadData, updateInterval * 1000));
    }, (targetSeconds - firstDate.getSeconds()) * 1000)
  );
}

function getAjaxUrl(verb) {
  let socketName = $("#socketName").val();
  let url = `/task-spooler/${verb}`;
  if (socketName) {
    url += "/" + socketName;
  }
  return url;
}

const numLinesTail = 10;
let tailFile = null;

function updateOutputDisplayFile(e) {
  $this = $(this);
  let href = $this.attr("href");
  let filename = $this.text();
  tailFile = {
    href,
    filename,
  };

  let tookAction = updateOutputDisplay();
  if (tookAction) {
    // prevent link
    e.preventDefault();
    return false;
  }
}

function resetOutputDisplay() {
  setOutputDisplay("", { totalNumLines: 0, text: "" });
  tailFile = null;
  $("#lastUpdateOutput").text("");
}

function setOutputDisplay(filename, data) {
  text = data["text"];
  let lines = text.split(/\r\n|\r|\n/);
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
    updateLastUpdateOutput();
    $.ajax({
      type: "GET",
      url: tailFile.href,
      data: {
        numLinesTail: $("#tailCheck").prop("checked") ? numLinesTail : null,
      },
      success: function (data) {
        setOutputDisplay(tailFile.filename, data);
      },
      error: function (err) {
        console.error(err);
      },
    });
    return true;
  }
  return false;
}

function killJob() {
  let $this = $(this);
  let id = $this.data("id");
  let url = getAjaxUrl(`kill/${id}`);
  $.ajax({
    type: "POST",
    url: url,
    success: function (data) {
      console.trace("killJob received response", data);
      reloadTable();
    },
    error: function (err) {
      console.error(err);
    },
  });
}

let reloadNumber = 0;
function reloadTable(compareWithOld = true) {
  updateLastUpdateTable();
  let oldStates = {};
  if (compareWithOld) {
    table.rows().every(function () {
      var row = this.data();
      oldStates[row["DT_RowId"]] = row["State"];
    });
  }
  table.ajax.reload(function (data) {
    if (compareWithOld) {
      for (let row of data.data) {
        if (
          $("#notifyCheck").prop("checked") &&
          row["DT_RowId"] in oldStates &&
          oldStates[row["DT_RowId"]] !== "finished" &&
          row["State"] === "finished"
        ) {
          notifyDone(row["ID"]);
        }
      }
    }
  });
}

function removeJob() {
  let $this = $(this);
  let id = $this.data("id");
  let url = getAjaxUrl(`remove/${id}`);
  $.ajax({
    type: "POST",
    url: url,
    success: function (data) {
      console.trace("removeJob received response", data);
      reloadTable();
    },
    error: function (err) {
      console.error(err);
    },
  });
}

function loadTable() {
  let url = getAjaxUrl("list");
  const columns = [
    {
      title: "Controls",
      targets: -1,
      data: null,
      render: function (data, type, row) {
        id = row["ID"];
        let buttonText = `<div class="d-flex justify-content-start align-items-center">`;
        buttonText += `<button type="button" style="margin: .5em;" class="kill-link btn btn-warning text-nowrap" data-id="${id}" ${
          row["State"] === "running" ? "" : "disabled"
        }><i class="bi bi-stop-circle"></i> Kill</button>`;
        buttonText += `<button type="button" style="margin: .5em;" class="remove-link btn btn-danger text-nowrap" data-id="${id}" ${
          row["State"] === "running" ? "disabled" : ""
        }><i class="bi bi-trash"></i> Remove</button>`;
        buttonText += "</div>";
        return buttonText;
      },
    },
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
        if (data && data.startsWith("/tmp/ts-out.")) {
          return (
            '<a class="ts-out-link" href="/task-spooler/output/' +
            basename(data) +
            '" download>' +
            data +
            "</a>"
          );
        } else {
          return data;
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
          return "<pre><code>" + basename(data) + "</code></pre>";
        } else {
          return data;
        }
      },
    },
    {
      title: "Time (ms)",
      data: "Time_ms",
      render: function (data, type, row) {
        if (data) {
          return parseFloat(data).toLocaleString().replace("NaN", "-");
        } else {
          return data;
        }
      },
    },
  ];
  table = $("#mainTable").DataTable({
    serverSide: true,
    processing: true,
    ajax: { url: url },
    info: true,
    lengthMenu: [5, 10, 20, -1],
    columns,
  });
  table.on("xhr.dt", function () {
    updateLastUpdateTable();
  });
  table.on("draw.dt", function () {
    $(".kill-link").click(killJob);
    $(".remove-link").click(removeJob);
    $(".ts-out-link").click(updateOutputDisplayFile);
  });

  updateLastUpdateTable();
  initUpdates();
  resetOutputDisplay();
}

function loadOutputDisplay() {
  if (!$("#showOutputCheck").prop("checked")) {
    $("#outputDisplay").hide();
  }
  $("#showOutputCheck").click(function () {
    if ($(this).prop("checked")) {
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

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/notification
 */
function notifyDone(name) {
  let message = `Job ID ${name} has finished at ${new Date().toLocaleString()}`;

  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    let notification = new Notification(message);
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        let notification = new Notification(message);
      }
    });
  }

  // At last, if the user has denied notifications, and you
  // want to be respectful there is no need to bother them anymore.
}
