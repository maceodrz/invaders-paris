from flask import Flask, render_template, request, jsonify
import folium
import pandas as pd
import os
from folium.plugins import MousePosition
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# from extract.treat_video import get_invader_from_video_path


# from google.oauth2.service_account import Credentials
# import gspread


# # Google Sheets setup
# SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
# SERVICE_ACCOUNT_FILE = 'path/to/your/service_account.json'  # Update with your service account file path
# SPREADSHEET_ID = 'your_google_sheet_id'  # Update with your Google Sheet ID

# credentials = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
# gc = gspread.authorize(credentials)
# sheet = gc.open_by_key(SPREADSHEET_ID).sheet1

# def get_data_from_sheet():
#     """Fetch data from Google Sheet and return as a DataFrame."""
#     data = sheet.get_all_records()
#     return pd.DataFrame(data)

# def update_sheet_from_dataframe(df):
#     """Update Google Sheet with the contents of a DataFrame."""
#     sheet.clear()
#     sheet.update([df.columns.values.tolist()] + df.values.tolist())

# # Replace CSV_FILE with Google Sheets integration
# def get_dataframe():
#     return get_data_from_sheet()

# def save_dataframe(df):
#     update_sheet_from_dataframe(df)

app = Flask(__name__)

CSV_FILE = (
    "data/cleaned_invaders_v2.csv"  # TODO: rajouter "Flashed at + date pour chacun"
)

# Configurations pour l'upload
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"mp4", "mov", "avi"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
PENDING_INVADERS = set()


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/")
def home():
    return render_template("valentine.html")  # La nouvelle page d'accueil


@app.route("/map")
def map_page():
    create_map()
    return render_template(
        "map.html"
    )  # L'ancienne page index.html renommée en map.html



@app.route('/api/invaders')
def get_invaders():
    df = pd.read_csv(CSV_FILE)
    invaders_data = []
    for _, row in df.iterrows():
        invader = {
            "id": str(row["id"]),
            "address": row["address"],
            "lat": row["Latitude"],
            "lng": row["Longitude"],
            "flashed": row["Flashed"],
            "flashable": row["Flashable"],
            "type": "flashable" if row["Flashable"] else "unflashable",
            "status": "flashed" if row["Flashed"] else "not flashed",
        }
        invaders_data.append(invader)
    filter_type = request.args.get('filter', 'all')

    if filter_type == 'all':
        filtered_invaders = invaders_data
    elif filter_type == 'flashable':
        filtered_invaders = [inv for inv in invaders_data if inv['flashable']]
    elif filter_type == 'unflashed':
        filtered_invaders = [inv for inv in invaders_data if not inv['flashed']]
    elif filter_type == 'flashable-unflashed':
        filtered_invaders = [inv for inv in invaders_data if inv['flashable'] and not inv['flashed']]
    elif filter_type == 'flashed':
        filtered_invaders = [inv for inv in invaders_data if inv['flashed']]
    else:
        filtered_invaders = []

    return jsonify(filtered_invaders)

@app.route('/api/new_update_invader_status', methods=['POST'])
def new_update_invader_status():
    data = request.get_json()
    invader_id = data.get("id")
    new_status = data.get("newAction")
    # Load and modify the CSV or database
    df = pd.read_csv(CSV_FILE)
    if invader_id not in df['id'].values:
        return jsonify(status="error", message="Invader not found")

    mask = df['id'] == invader_id

    if new_status in ['flash', 'unflash']:
        if not df.loc[mask, 'Flashable'].iloc[0]:
            return jsonify(status="error", message="Invader is not flashable")
        df.loc[mask, 'Flashed'] = (new_status == 'flash')
    elif new_status in ['disable', 'enable']:
        new_flashable = (new_status == 'enable')
        df.loc[mask, 'Flashable'] = new_flashable
        if not new_flashable:
            df.loc[mask, 'Flashed'] = False
    df.to_csv(CSV_FILE, index=False)

    return jsonify(status="success") # message="Status mis à jour !"


@app.route("/get_stats")
def get_stats():
    df = pd.read_csv(CSV_FILE)
    total_flashed = df[df['Flashed'] == True].shape[0]
    total_unflashed = df[df['Flashable'] == True].shape[0] - total_flashed
    progress = total_flashed / (total_flashed + total_unflashed) * 10000 if (total_flashed + total_unflashed) > 0 else 0
    progress = int(progress)
    progress = progress / 100
    return jsonify(
        {
            "total_flashed": total_flashed,
            "total_unflashed": total_unflashed,
            "progress": progress,
        }
    )

@app.route("/search_invaders")
def search_invaders():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify([])

    df = pd.read_csv(CSV_FILE)
    # Convert IDs to strings for searching
    matching_ids = df[df["id"].astype(str).str.contains(query)]["id"].tolist()
    return jsonify(matching_ids)


# Nouvelle route pour l'upload et le traitement vidéo
@app.route("/upload_video", methods=["POST"])
def upload_video():
    if "video" not in request.files:
        return jsonify({"error": "No video file"}), 400

    video_file = request.files["video"]
    if video_file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if video_file and allowed_file(video_file.filename):
        filename = secure_filename(video_file.filename)
        video_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        video_file.save(video_path)

        try:
            # Obtenir la liste des invaders depuis la vidéo
            # invader_ids = get_invader_from_video_path(video_path)
            # print(invader_ids) # TODO remettre pour le local, là c'est pour déployer sans pytorch, esayocr et tt
            invader_ids = ["PA_862"]
            # Lire les données actuelles
            df = pd.read_csv(CSV_FILE)

            # Identifier les nouveaux invaders flashés
            new_flashed = []
            for invader_id in invader_ids:
                mask = df["id"] == invader_id
                if any(mask) and not df.loc[mask, "Flashed"].iloc[0]:
                    new_flashed.append(invader_id)
            print(f"BEFORE GLOBAL New flashed invaders: {len(new_flashed)}")

            # Stocker les nouveaux invaders en attente
            global PENDING_INVADERS
            PENDING_INVADERS = set(new_flashed)

            print(f"New flashed invaders: {len(new_flashed)}")

            if not new_flashed:
                raise ValueError("No new invaders found in the video.")

            # Créer une nouvelle carte avec les changements
            # create_map(to_validate=True)

            return jsonify(
                {
                    "status": "success",
                    "new_flashed": new_flashed,
                    "total_found": len(invader_ids),
                }
            )
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            # Nettoyer le fichier uploadé
            os.remove(video_path)

    return jsonify({"error": "Invalid file type"}), 400


if __name__ == "__main__":
    app.run(debug=True)
