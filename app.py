import glob
import json
import os
import re
import subprocess
import pandas as pd
from flask import Flask
from flask import render_template
from flask import jsonify
from flask import request

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True

@app.route("/hello")
def hello_world():
    return "Hello, World!"

@app.route("/")
def hello():
    return render_template("index.html")

def split_time(time):
    if time is None:
        return None, None, None
    else:
        return time.split("/")

def tsp_list(socket_name):
    env = {}
    if socket_name is not None:
        env["TS_SOCKET"] = f"/tmp/socket.{socket_name}"
    output = subprocess.check_output("tsp -l", env=env, shell=True, encoding="utf-8")
    lines = output.splitlines()
    header_line = lines[0]
    column_names = header_line.split(maxsplit=5)
    assert "Command" in column_names[-1], column_names[-1]
    rows = lines[1:]
    def to_row(line):
        fields = line.split(maxsplit=5)
        if fields[1] == "running":
            fields = line.split(maxsplit=2)
            long_field = fields[-1]
            fields = fields[:-1]
            output, command = long_field.split(maxsplit=1)
            fields.append(output)
            fields.append(None)
            fields.append(None)
            fields.append(command)
        if fields[1] == "queued":
            fields = line.split(maxsplit=2)
            long_field = fields[-1]
            fields = fields[:-1]
            fields.append(long_field[:len("(file)")].strip())
            fields.append(None)
            fields.append(None)
            long_field_rest = long_field[len("(file)"):].strip()
            fields.append(long_field_rest)
        if fields[1] == "skipped":
            fields = line.split(maxsplit=2)
            long_field = fields[-1]
            fields = fields[:-1]
            fields.append(long_field[:len("(no output)")].strip())
            fields.append(None)
            fields.append(None)
            long_field_rest = long_field[len("(no output)"):].strip()
            fields.append(long_field_rest)
        return fields
    rows = [to_row(l) for l in rows]
    df = pd.DataFrame(data=rows, columns=column_names)
    df["ID"] = df["ID"].astype(int)
    df = df.set_index("ID", drop=False).sort_index()
    if len(df) > 0:
        df["Time (real)"], df["Time (user)"], df["Time (system)"] = zip(*df["Times(r/u/s)"].apply(split_time))
    df = df.drop(columns=["Times(r/u/s)"])
    df = df.rename(columns=lambda x: re.sub('Command.*$','Command',x))
    # print(df)
    return df

@app.route("/tsp/list")
@app.route("/tsp/list/<socket_name>")
def list(socket_name=None):
    """
    {
        "draw": 1,
        "recordsTotal": 57,
        "recordsFiltered": 57,
        "data": [
            [
                "Angelica",
                "Ramos",
                "System Architect",
                "London",
                "9th Oct 09",
                "$2,875"
            ],
            [
                "Ashton",
                "Cox",
                "Technical Author",
                "San Francisco",
                "12th Jan 09",
                "$4,800"
            ],
            ...
        ]
    }
    """
    data_df = tsp_list(socket_name)

    response_df = data_df
    draw = int(request.args.get("draw", 0))
    start = request.args.get('start', None)
    if start is not None:
        start = int(start)
        response_df = response_df.iloc[start:]
    length = request.args.get('length', None)
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
        "data": response_df.to_dict('records')
    }
    # print(json.dumps(response, indent=2))
    return jsonify(response)

@app.route("/tsp/output")
@app.route("/tsp/output/<output_name>")
def output(output_name=None):
    assert output_name.startswith("ts-out."), output_name
    assert "/" not in output_name, output_name
    with open(os.path.join("/tmp", output_name)) as f:
        return f.read()

def get_socket_names():
    sockets = glob.glob("/tmp/socket.*")
    socket_names = [os.path.basename(s)[len("socket."):] for s in sockets]
    return socket_names

@app.route("/tsp/list_sockets")
def list_sockets():
    return jsonify(get_socket_names())


def test_list():
    print()
    print(tsp_list("devign"))
    print(tsp_list("devign").to_json(orient="values"))

def test_sockets():
    print()
    print(get_socket_names())
