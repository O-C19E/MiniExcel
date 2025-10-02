from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 

cells = {}  # still using localStorage in frontend, backend only for computation

@app.route("/calculate", methods=["POST"])
def calculate():
    data = request.json
    values = data.get("cells", [])
    operation = data.get("operation")

    # Convert all valid numeric values
    nums = []
    for v in values:
        try:
            nums.append(float(v))
        except (ValueError, TypeError):
            continue  # skip non-numeric

    result = 0
    if operation == "sum":
        result = sum(nums)
    elif operation == "average":
        result = sum(nums) / len(nums) if nums else 0
    else:
        return jsonify({"error": "Invalid operation"}), 400

    return jsonify({"result": result})


@app.route("/export", methods=["POST"])
def export_sheet():
    cells = request.json.get("cells", {})
    return jsonify({"success": True, "message": "Export handled server-side"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
