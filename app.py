import os
from flask import Flask
from flask import render_template
from flask import jsonify
from flask import request
import task_spooler_utils as ts_utils

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True


def summarize_subprocess(proc):
    """
    Summarize the result of a subprocess for display/handling in the view.
    """
    return {
        "returncode": proc.returncode,
        "stdout": proc.stdout,
    }


@app.route("/hello")
def hello_world():
    return "Hello, World!"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/task-spooler/list")
@app.route("/task-spooler/list/<socket_name>")
def list(socket_name=None):
    data_df = ts_utils.list_jobs(socket_name)

    response_df = data_df
    draw = int(request.args.get("draw", 0))
    start = request.args.get("start", None)
    if start is not None:
        start = int(start)
        response_df = response_df.iloc[start:]
    length = request.args.get("length", None)
    if start is not None:
        length = int(length)
        response_df = response_df.iloc[:length]
    response_df["DT_RowId"] = response_df["ID"]

    # TODO: load columns
    # TODO: load order

    response = {
        "draw": draw,
        "recordsTotal": len(data_df),
        "recordsFiltered": len(data_df),
        "data": response_df.to_dict("records"),
    }
    return jsonify(response)


@app.route("/task-spooler/output")
@app.route("/task-spooler/output/<output_name>")
def output(output_name=None):
    assert output_name.startswith("ts-out."), output_name
    assert "/" not in output_name, output_name

    num_lines_tail = request.args.get("numLinesTail", None)
    if num_lines_tail:
        num_lines_tail = int(num_lines_tail)
    else:
        num_lines_tail = None

    num_lines = 0
    with open(os.path.join("/tmp", output_name)) as f:
        if num_lines_tail is not None:
            lines = []
            line = f.readline()
            while line:
                num_lines += 1
                lines.append(line)
                if len(lines) > num_lines_tail - 1:
                    lines.pop(0)
                line = f.readline()
            text = "".join(lines)
        else:
            text = f.read()
            num_lines = len(text.splitlines())
    response = {
        "totalNumLines": num_lines,
        "text": text,
    }
    return jsonify(response)


@app.route("/task-spooler/list_sockets")
def list_sockets():
    return jsonify(ts_utils.get_socket_names())


@app.route("/task-spooler/remove/<job_id>", methods=["POST"])
@app.route("/task-spooler/remove/<job_id>/<socket_name>", methods=["POST"])
def remove(job_id, socket_name=None):
    completed_proc = ts_utils.tsp_remove(job_id, socket_name)
    return jsonify(summarize_subprocess(completed_proc))


@app.route("/task-spooler/kill/<job_id>", methods=["POST"])
@app.route("/task-spooler/kill/<job_id>/<socket_name>", methods=["POST"])
def kill(job_id, socket_name=None):
    completed_proc = ts_utils.tsp_kill(job_id, socket_name)
    return jsonify(summarize_subprocess(completed_proc))
