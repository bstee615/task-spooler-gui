import json
import subprocess
import pandas as pd
from flask import Flask
from flask import render_template
from flask import jsonify

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True

@app.route("/hello")
def hello_world():
    return "Hello, World!"

@app.route("/")
def hello():
    return render_template("index.html")

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
    df = pd.DataFrame(data=rows, columns=column_names).set_index("ID")
    return df

@app.route("/tsp/list")
@app.route("/tsp/list/<socket_name>")
def list(socket_name=None):
    data_by_column = tsp_list(socket_name)
    data_json = data_by_column.to_json(orient="values")
    print(data_json)
    return jsonify(data_json)

def test_list():
    print()
    # print(tsp_list(None))
    print(tsp_list("devign"))
    print(tsp_list("devign").to_json(orient="values"))
