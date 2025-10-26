from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import pandas as pd
import random
import sqlite3
import os, re
from io import BytesIO
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
BASE_DIR = r"C:\Users\Pepero\Desktop\Excel\v1\data"
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
DB_FILE = "users.db"
conn = sqlite3.connect("users.db", check_same_thread=False)
cursor = conn.cursor()
cursor.execute(
    """CREATE TABLE IF NOT EXISTS users (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           username TEXT UNIQUE,
           password TEXT,
           pin TEXT
       )"""
)
conn.commit()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def get_user_dir(username):
    path = os.path.join(BASE_DIR, username)
    os.makedirs(path, exist_ok=True)
    return path

@app.route("/upload-file", methods=["POST"])
def upload_file():
    username = request.form.get("username")
    pin = request.form.get("pin")
    file = request.files.get("file")

    if not username or not pin or not file:
        return jsonify({"error": "Username, PIN, and file are required"}), 400

    # Verify PIN
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT pin FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    if not row or not check_password_hash(row["pin"], pin):
        return jsonify({"error": "Invalid PIN"}), 401

    # Save file
    user_dir = get_user_dir(username)
    file_path = os.path.join(user_dir, file.filename)
    file.save(file_path)

    return jsonify({"message": "File uploaded successfully"})

@app.route("/files", methods=["GET"])
def list_files():
    username = request.args.get("username")
    if not username:
        return jsonify({"files": []})

    user_dir = get_user_dir(username)
    files = os.listdir(user_dir)
    return jsonify({"files": files})

@app.route("/download-file", methods=["GET"])
def download_file():
    username = request.args.get("username")
    fileName = request.args.get("fileName")
    
    if not username or not fileName:
        return {"error": "Username and fileName required"}, 400

    user_folder = os.path.join(BASE_DIR, username)
    file_path = os.path.join(user_folder, fileName)
    
    if not os.path.exists(file_path):
        return {"error": "File not found"}, 404

    return send_file(file_path, as_attachment=True)

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    pin = data.get("pin")  # new field

    if not username or not password or not pin:
        return jsonify({"error": "Username, password, and PIN required"}), 400

    if not (pin.isdigit() and len(pin) == 6):
        return jsonify({"error": "PIN must be 6 digits"}), 400

    hashed_password = generate_password_hash(password)
    hashed_pin = generate_password_hash(pin)  # hash the PIN too

    try:
        cursor.execute(
            "INSERT INTO users (username, password, pin) VALUES (?, ?, ?)",
            (username, hashed_password, hashed_pin)
        )
        conn.commit()
        return jsonify({"message": "User registered successfully"})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already exists"}), 400
        
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password, pin FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()

    if row and check_password_hash(row["password"], password):
        return jsonify({"message": "Login successful"})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/verify-pin", methods=["POST"])
def verify_pin():
    data = request.get_json()
    username = data.get("username")
    pin = data.get("pin")

    if not username or not pin:
        return jsonify({"error": "Username and PIN required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT pin FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()

    if row and check_password_hash(row["pin"], pin):
        return jsonify({"message": "PIN verified"})
    return jsonify({"error": "Invalid PIN"}), 401

@app.route("/math", methods=["POST"])
def math_operation():
    try:
        data = request.get_json()
        type_ = data.get("type")
        values = data.get("values", [])

        def extract_number(v):
            """Recursively extract numeric value from nested dicts."""
            if isinstance(v, dict):
                # If it looks like {"A1": {"value": 10, "style": {...}}}
                if "value" in v:
                    return extract_number(v["value"])
                # Else it's probably a cell name dict, like {"A1": {...}}
                elif len(v) == 1:
                    return extract_number(list(v.values())[0])
                else:
                    return 0
            try:
                return float(v)
            except (TypeError, ValueError):
                return 0

        clean_values = [extract_number(v) for v in values]

        if not clean_values:
            return jsonify({"error": "No valid numeric values"}), 400

        if type_ == "sum":
            result = sum(clean_values)
        elif type_ == "average":
            result = sum(clean_values) / len(clean_values)
        elif type_ == "min":
            result = min(clean_values)
        elif type_ == "max":
            result = max(clean_values)
        elif type_ == "count":
            result = len([v for v in clean_values if isinstance(v, (int, float))])
        elif type_ == "round":
            result = round(clean_values[0])
        elif type_ == "abs":
            result = abs(clean_values[0])
        elif type_ == "product":
            from functools import reduce
            import operator
            result = reduce(operator.mul, clean_values, 1)
        else:
            return jsonify({"error": f"Unsupported math operation: {type_}"}), 400

        return jsonify({"result": result})

    except Exception as e:
        print(f"❌ Backend error in /math: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------------- Formula evaluation ----------------------
def evaluate_formula_backend(formula: str, cells: dict):
    """
    Evaluate a simple Excel IF formula of the form:
        =IF(A1>10, "High", "Low")
    """
    formula = formula.strip()
    if formula.startswith("="):
        formula = formula[1:]

    if not formula.upper().startswith("IF"):
        raise ValueError("Only IF formulas are supported")

    match = re.match(r'IF\s*\((.*)\)', formula, re.IGNORECASE)
    if not match:
        raise ValueError("Invalid IF formula syntax")

    args = match.group(1)
    # Split arguments by comma, respecting quotes
    parts = re.findall(r'(?:\"[^\"]*\"|[^,]+)', args)
    if len(parts) != 3:
        raise ValueError("IF formula must have 3 arguments")

    logical_test, value_if_true, value_if_false = [p.strip() for p in parts]

    # Replace cell references with actual values
    def replace_cell_refs(match_obj):
        cell_ref = match_obj.group(0)
        return str(cells.get(cell_ref, 0))  # default 0 if missing

    logical_test_eval = re.sub(r'[A-Z]+\d+', replace_cell_refs, logical_test)

    # Evaluate logical test
    try:
        if eval(logical_test_eval):
            result = value_if_true
        else:
            result = value_if_false
    except Exception as e:
        raise ValueError(f"Error evaluating logical test: {e}")

    # Remove quotes if present
    if result.startswith('"') and result.endswith('"'):
        result = result[1:-1]

    return result

# Flask route for formulas
@app.route("/formula", methods=["POST"])
def formula():
    try:
        data = request.json
        expr = data.get("formula", "").strip()
        cells = data.get("cells", {})  # full cell objects from frontend

        if not expr.upper().startswith("IF("):
            return jsonify({"error": "Only IF formulas supported"}), 400

        # Extract inner arguments of IF
        inner = expr[3:-1]  # remove IF( and trailing )
        parts = []
        current = ""
        depth = 0
        for ch in inner:
            if ch == "," and depth == 0:
                parts.append(current.strip())
                current = ""
            else:
                if ch == "(":
                    depth += 1
                elif ch == ")":
                    depth -= 1
                current += ch
        parts.append(current.strip())

        if len(parts) != 3:
            return jsonify({"error": "Invalid IF syntax"}), 400

        logical_test, true_val, false_val = parts

        # Function to replace cell refs with actual values
        def replace_cell_refs(s):
            matches = re.findall(r"[A-Z]+[0-9]+", s)
            for m in matches:
                val = cells.get(m, {})
                if isinstance(val, dict):
                    val = val.get("value", 0)

                # Convert numeric strings to float
                if isinstance(val, str):
                    try:
                        val_num = float(val)
                        val = val_num
                    except:
                        # keep as string
                        val = f'"{val}"'

                s = re.sub(rf"\b{m}\b", str(val), s)
            return s

        logical_test_eval = replace_cell_refs(logical_test)

        # Safely evaluate logical test
        try:
            result_bool = eval(logical_test_eval)
        except Exception as e:
            print(f"❌ Backend error: Error evaluating logical test: {e}")
            return jsonify({"error": f"Error evaluating logical test: {e}"}), 500

        # Determine final value
        final_value = true_val if result_bool else false_val
        final_value = replace_cell_refs(final_value).strip()

        # Remove surrounding quotes if present
        if final_value.startswith('"') and final_value.endswith('"'):
            final_value = final_value[1:-1]

        return jsonify({"result": final_value})

    except Exception as e:
        print(f"❌ Backend error: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------------- Random dataset generator ----------------------
@app.route("/generate-random", methods=["POST"])
def generate_random():
    try:
        file = request.files.get("file")
        rows = request.form.get("rows", type=int)

        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        if not rows or rows <= 0:
            return jsonify({"error": "Invalid row count"}), 400
        if rows > 100:
            rows = 100

        # Read sample file
        df_sample = pd.read_excel(file, engine='openpyxl')
        if df_sample.empty:
            return jsonify({"error": "Sample file is empty"}), 400

        # Precompute min/max for numeric columns
        col_ranges = {}
        for col in df_sample.columns:
            numeric_col = pd.to_numeric(df_sample[col], errors='coerce')
            if numeric_col.notna().any():
                col_ranges[col] = (int(numeric_col.min()), int(numeric_col.max()))
            else:
                col_ranges[col] = None  # non-numeric column

        # Generate random rows
        new_data = []
        for _ in range(rows):
            row = {}
            for col, rng in col_ranges.items():
                if rng:
                    row[col] = random.randint(rng[0], rng[1])
                else:
                    row[col] = ""
            new_data.append(row)

        df_new = pd.DataFrame(new_data)

        # Save to Excel in memory
        output = BytesIO()
        df_new.to_excel(output, index=False, engine='openpyxl')
        output.seek(0)

        return send_file(
            output,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="RandomDataset.xlsx"
        )

    except Exception as e:
        print("❌ Backend error:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------- Main ----------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
