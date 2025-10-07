from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import pandas as pd
import random
from io import BytesIO

app = Flask(__name__)
CORS(app)

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
            # Try to convert to numeric, ignore non-numeric
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
                    row[col] = ""  # leave non-numeric empty
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
