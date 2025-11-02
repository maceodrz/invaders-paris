from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS
import requests
from dotenv import load_dotenv
from datetime import datetime
import json
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

CSV_FILE = "data/cleaned_invaders_v2.csv"
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"mp4", "mov", "avi"}

RESTORE_INVADER_API = os.getenv("RESTORE_INVADER_API", "https://api.space-invaders.com/flashinvaders_v3_pas_trop_predictif/api/gallery?uid=")
MY_UID = os.getenv("MY_UID")

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/")
def home():
    return render_template("valentine.html")

@app.route('/api/flash_history')
def get_flash_history():
    try:
        df = pd.read_csv(CSV_FILE)
        if 'date_flash' not in df.columns or df['date_flash'].isnull().all():
            return jsonify([])

        # Filter for flashed invaders with a valid date
        flashed_df = df[df['Flashed'] & pd.to_datetime(df['date_flash'], errors='coerce').notna()].copy()
        
        # Extract date part and count flashes per day
        flashed_df['flash_date'] = pd.to_datetime(flashed_df['date_flash']).dt.date
        daily_counts = flashed_df['flash_date'].value_counts().sort_index()
        
        # Create a DataFrame for charting
        history_df = daily_counts.reset_index()
        history_df.columns = ['date', 'daily']
        
        # Calculate cumulative sum
        history_df['cumulative'] = history_df['daily'].cumsum()
        
        # Convert date to string for JSON compatibility
        history_df['date'] = history_df['date'].apply(lambda d: d.strftime('%Y-%m-%d'))
        
        return jsonify(history_df.to_dict('records'))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/invaders')
def get_invaders():
    try:
        df = pd.read_csv(CSV_FILE)
        # Ensure all optional columns exist to prevent errors
        for col in ['hint', 'comment', 'date_flash', 'image_url']:
            if col not in df.columns:
                df[col] = ''
        
        df.fillna('', inplace=True)
        
        invaders_data = df.to_dict('records')
        # Convert to the expected format
        formatted_data = [{
            "id": str(row["id"]),
            "address": row["address"],
            "lat": row["Latitude"],
            "lng": row["Longitude"],
            "flashed": bool(row["Flashed"]),
            "flashable": bool(row["Flashable"]),
            "date_flash": row.get("date_flash", ""),
            "image_url": row.get("image_url", ""),
            "hint": row.get("hint", ""),
            "comment": row.get("comment", ""),
        } for row in invaders_data]
        return jsonify(formatted_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sync_with_uid', methods=['POST'])
def sync_with_uid():
    data = request.get_json()
    uid = data.get("uid", MY_UID)

    if not RESTORE_INVADER_API: 
        return jsonify({"status": "error", "message": "API URL not configured"}), 500
        
    try:
        api_url = f"{RESTORE_INVADER_API}{uid}"
        response = requests.get(api_url)
        response.raise_for_status()
        api_data = response.json()
        
        flashed_invaders_from_api = api_data.get('invaders', {})
        api_invader_ids = set(flashed_invaders_from_api.keys())
        
        df = pd.read_csv(CSV_FILE)

        if 'date_flash' not in df.columns: 
            df['date_flash'] = ''
        if 'image_url' not in df.columns: 
            df['image_url'] = ''

        # Convert columns to object type to allow mixed types and None/NaN
        df['date_flash'] = df['date_flash'].astype(object)
        df['image_url'] = df['image_url'].astype(object)

        updated_count = 0
        reset_count = 0

        for index, row in df.iterrows():
            invader_id = row['id']
            
            # Normaliser l'ID si nécessaire (enlever les zéros superflus)
            if isinstance(invader_id, str) and '_' in invader_id:
                prefix, suffix = invader_id.split('_', 1)
                if suffix.isdigit():
                    new_suffix = str(int(suffix))
                    normalized_id = f"{prefix}_{new_suffix}"
                    
                    # Vérifier si la version normalisée existe dans l'API
                    if normalized_id in api_invader_ids:
                        if not row['Flashed']:
                            updated_count += 1
                        df.at[index, 'Flashed'] = True
                        df.at[index, 'date_flash'] = flashed_invaders_from_api[normalized_id].get('date_flash')
                        df.at[index, 'image_url'] = flashed_invaders_from_api[normalized_id].get('image_url')
                        continue
            
            # Vérifier avec l'ID original
            if invader_id in api_invader_ids:
                if not row['Flashed']:
                    updated_count += 1
                df.at[index, 'Flashed'] = True
                df.at[index, 'date_flash'] = flashed_invaders_from_api[invader_id].get('date_flash')
                df.at[index, 'image_url'] = flashed_invaders_from_api[invader_id].get('image_url')
            else:
                # Cet invader n'est PAS dans la réponse de l'API, marquer comme NON flashé
                if row['Flashed']:
                    reset_count += 1
                df.at[index, 'Flashed'] = False
                df.at[index, 'date_flash'] = np.nan
                df.at[index, 'image_url'] = np.nan
        
        df.to_csv(CSV_FILE, index=False)
        
        return jsonify({
            "status": "success", 
            "message": f"{updated_count} invaders nouvellement flashés, {reset_count} réinitialisés."
        })

    except requests.exceptions.RequestException as e:
        return jsonify({"status": "error", "message": f"Failed to call external API: {e}"}), 502
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/process_synced_data', methods=['POST'])
def process_synced_data():
    try:
        request_data = request.get_json()
        api_data = request_data.get('invadersData')

        if not api_data:
            return jsonify({"status": "error", "message": "No invadersData provided"}), 400

        flashed_invaders_from_api = api_data.get('invaders', {})
        api_invader_ids = set(flashed_invaders_from_api.keys())
        
        df = pd.read_csv(CSV_FILE)

        # Ensure optional columns exist
        if 'date_flash' not in df.columns: df['date_flash'] = ''
        if 'image_url' not in df.columns: df['image_url'] = ''

        df['date_flash'] = df['date_flash'].astype(object)
        df['image_url'] = df['image_url'].astype(object)

        updated_count = 0
        reset_count = 0

        # --- This is the exact same processing logic from your old function ---
        for index, row in df.iterrows():
            invader_id = row['id']
            # Your normalization logic can stay if needed, but it's often better to normalize on both ends
            # For simplicity, we assume IDs match or you have a good normalization function
            
            if invader_id in api_invader_ids:
                if not row['Flashed']:
                    updated_count += 1
                df.at[index, 'Flashed'] = True
                df.at[index, 'date_flash'] = flashed_invaders_from_api[invader_id].get('date_flash')
                df.at[index, 'image_url'] = flashed_invaders_from_api[invader_id].get('image_url')
            else:
                if row['Flashed']:
                    reset_count += 1
                df.at[index, 'Flashed'] = False
                df.at[index, 'date_flash'] = np.nan
                df.at[index, 'image_url'] = np.nan
        
        df.to_csv(CSV_FILE, index=False)
        
        return jsonify({"status": "success", "message": f"{updated_count} invaders nouvellement flashés, {reset_count} réinitialisés."})

    except Exception as e:
        # Log the full error for debugging
        print(f"Error processing synced data: {e}") 
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/new_update_invader_status', methods=['POST'])
def new_update_invader_status():
    try:
        data = request.get_json()
        invader_id = data.get("id")
        action = data.get("newAction")
        
        df = pd.read_csv(CSV_FILE)
        if invader_id not in df['id'].astype(str).values:
            return jsonify(status="error", message="Invader not found"), 404

        mask = df['id'] == invader_id

        if action in ['flash', 'unflash']:
            if not df.loc[mask, 'Flashable'].iloc[0]:
                return jsonify(status="error", message="Invader is not flashable"), 400
            df.loc[mask, 'Flashed'] = (action == 'flash')
        elif action in ['disable', 'enable']:
            new_flashable = (action == 'enable')
            df.loc[mask, 'Flashable'] = new_flashable
            if not new_flashable:
                df.loc[mask, 'Flashed'] = False
        
        df.to_csv(CSV_FILE, index=False)

        updated_row = df[mask].iloc[0]
        updated_invader = {
            "id": str(updated_row["id"]),
            "address": updated_row["address"],
            "lat": updated_row["Latitude"],
            "lng": updated_row["Longitude"],
            "flashed": bool(updated_row["Flashed"]),
            "flashable": bool(updated_row["Flashable"]),
        }

        return jsonify(status="success", invader=updated_invader)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/update_invader_comment', methods=['POST'])
def update_invader_comment():
    try:
        data = request.get_json()
        invader_id = data.get("id")
        comment = data.get("comment", "")

        df = pd.read_csv(CSV_FILE)

        if 'comment' not in df.columns:
            df['comment'] = ''
        
        mask = df['id'] == invader_id
        if not mask.any():
            return jsonify({"status": "error", "message": "Invader not found"}), 404

        df.loc[mask, 'comment'] = comment
        df.to_csv(CSV_FILE, index=False)

        updated_row = df[mask].iloc[0].fillna('')
        updated_invader = {
            "id": str(updated_row["id"]),
            "address": updated_row["address"],
            "lat": updated_row["Latitude"],
            "lng": updated_row["Longitude"],
            "flashed": bool(updated_row["Flashed"]),
            "flashable": bool(updated_row["Flashable"]),
            "date_flash": updated_row.get("date_flash", ""),
            "image_url": updated_row.get("image_url", ""),
            "hint": updated_row.get("hint", ""),
            "comment": updated_row.get("comment", ""),
        }
        return jsonify({"status": "success", "invader": updated_invader})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/get_stats")
def get_stats():
    df = pd.read_csv(CSV_FILE)
    total_flashed = df[df['Flashed'] == True].shape[0]
    total_unflashed = df[df['Flashable'] == True].shape[0] - total_flashed
    total_flashable = df['Flashable'].sum()
    progress = (total_flashed / total_flashable * 100) if total_flashable > 0 else 0
    
    return jsonify({
        "total_flashed": total_flashed,
        "total_unflashed": total_unflashed,
        "progress": round(progress, 2),
    })

@app.route("/search_invaders")
def search_invaders():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify([])
    df = pd.read_csv(CSV_FILE)
    matching_ids = df[df["id"].astype(str).str.contains(query)]["id"].tolist()
    return jsonify(matching_ids)

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
            # Note: The video processing part is computationally intensive and requires libraries
            # like easyocr and torch, which are not in requirements.txt for easier deployment.
            # To enable this, uncomment the import and the function call.
            # invader_ids = get_invader_from_video_path(video_path)
            invader_ids = ["PA_862"] # Using dummy data for now
            
            df = pd.read_csv(CSV_FILE)
            new_flashed = [
                inv_id for inv_id in invader_ids 
                if inv_id in df['id'].values and not df[df['id'] == inv_id]['Flashed'].iloc[0]
            ]
            global PENDING_INVADERS
            PENDING_INVADERS = set(new_flashed)
            if not new_flashed:
                return jsonify({"error": "No new invaders found in the video."}), 404

            return jsonify({"status": "success", "new_flashed": new_flashed})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            os.remove(video_path)
    return jsonify({"error": "Invalid file type"}), 400

# Charger le mapping des villes au démarrage de l'app
CITY_MAPPING_FILE = "data/city_mapping.json"
if os.path.exists(CITY_MAPPING_FILE):
    with open(CITY_MAPPING_FILE, 'r', encoding='utf-8') as f:
        CITY_MAPPING = json.load(f)
else:
    print(f"Le fichier {CITY_MAPPING_FILE} n'existe pas.")
    CITY_MAPPING = {
        "PA": {"name": "Paris", "country": "🇫🇷", "zoom": 12, "center": [48.8566, 2.3522], "includes": ["PA", "VRS"]},
        "VRS": {"name": "Versailles", "country": "🇫🇷", "zoom": 13, "center": [48.8014, 2.1301]},
    }

@app.route('/api/cities')
def get_cities():
    """Retourne la liste des villes disponibles"""
    return jsonify(CITY_MAPPING)

@app.route('/api/update_from_pnote', methods=['POST'])
def update_from_pnote():
    """
    Met à jour les invaders depuis les données fournies par le frontend
    (qui a fait le curl vers pnote.eu)
    """
    try:
        data = request.get_json()
        pnote_invaders = data.get('invaders', [])
        
        if not pnote_invaders:
            return jsonify({"status": "error", "message": "No invaders data provided"}), 400
        
        df = pd.read_csv(CSV_FILE)
        
        # Créer la colonne instagram_url si elle n'existe pas
        if 'instagram_url' not in df.columns:
            df['instagram_url'] = ''
        
        # Créer la colonne hint si elle n'existe pas
        if 'hint' not in df.columns:
            df['hint'] = ''
            
        # Créer la colonne status si elle n'existe pas
        if 'status' not in df.columns:
            df['status'] = ''
        
        # Créer la colonne comment si elle n'existe pas
        if 'comment' not in df.columns:
            df['comment'] = ''
        
        updated_count = 0
        added_count = 0
        status_changed_count = 0
        invaders_not_in_pnote = []
        
        # Créer un dictionnaire des invaders pnote pour un accès rapide
        pnote_dict = {inv['id']: inv for inv in pnote_invaders}
        
        # Traiter les invaders existants dans le CSV
        for index, row in df.iterrows():
            invader_id = row['id']
            
            if invader_id in pnote_dict:
                pnote_inv = pnote_dict[invader_id]
                
                # Mettre à jour instagram_url
                if pnote_inv.get('instagramUrl'):
                    df.at[index, 'instagram_url'] = pnote_inv['instagramUrl']
                    updated_count += 1
                
                # Mettre à jour hint
                if pnote_inv.get('hint'):
                    df.at[index, 'hint'] = pnote_inv['hint']
                
                # Mettre à jour status
                df.at[index, 'status'] = pnote_inv.get('status', '')
                
                # Gérer les changements de flashabilité
                current_status = pnote_inv.get('status', '')
                current_flashable = row['Flashable']
                current_comment = str(row.get('comment', ''))
                
                if current_status == 'OK' and not current_flashable:
                    df.at[index, 'Flashable'] = True
                    new_comment = current_comment + " | Flashable d'après les dernières données" if current_comment else "Flashable d'après les dernières données"
                    df.at[index, 'comment'] = new_comment
                    status_changed_count += 1
                    
                elif current_status != 'OK' and current_status != '' and current_flashable:
                    df.at[index, 'Flashable'] = False
                    new_comment = current_comment + f" | Non flashable car status = {current_status} d'après les dernières données" if current_comment else f"Non flashable car status = {current_status} d'après les dernières données"
                    df.at[index, 'comment'] = new_comment
                    status_changed_count += 1
        
        # Ajouter les nouveaux invaders
        existing_ids = set(df['id'].values)
        for inv_id, inv_data in pnote_dict.items():
            if inv_id not in existing_ids:
                new_row = {
                    'id': inv_id,
                    'Latitude': inv_data.get('obf_lat', 0),
                    'Longitude': inv_data.get('obf_lng', 0),
                    'address': 'À déterminer',
                    'Flashed': False,
                    'Flashable': inv_data.get('status') == 'OK',
                    'status': inv_data.get('status', ''),
                    'hint': inv_data.get('hint', ''),
                    'instagram_url': inv_data.get('instagramUrl', ''),
                    'comment': '',
                    'date_flash': '',
                    'image_url': ''
                }
                df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
                added_count += 1
        
        # Identifier les invaders dans le CSV mais pas dans pnote
        pnote_ids = set(pnote_dict.keys())
        csv_ids = set(df['id'].values)
        missing_in_pnote = csv_ids - pnote_ids
        
        if missing_in_pnote:
            invaders_not_in_pnote = list(missing_in_pnote)
            print(f"Invaders dans le CSV mais pas dans pnote.eu: {invaders_not_in_pnote}")
        
        # Sauvegarder le CSV
        df.to_csv(CSV_FILE, index=False)
        
        return jsonify({
            "status": "success",
            "message": f"Mise à jour terminée: {updated_count} invaders mis à jour, {added_count} ajoutés, {status_changed_count} changements de statut",
            "updated": updated_count,
            "added": added_count,
            "status_changed": status_changed_count,
            "missing_in_pnote": invaders_not_in_pnote
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/invaders/<city_code>')
def get_invaders_by_city(city_code):
    """Retourne les invaders d'une ville spécifique"""
    try:
        df = pd.read_csv(CSV_FILE)
        
        # Vérifier si la ville inclut d'autres villes (comme Paris inclut Versailles)
        city_info = CITY_MAPPING.get(city_code)
        if not city_info:
            return jsonify({"error": "City not found"}), 404
        
        # Obtenir les codes de villes à inclure
        city_codes = city_info.get('includes', [city_code])
        
        # Filtrer les invaders
        filtered_df = df[df['id'].str.split('_').str[0].isin(city_codes)]
        
        # Préparer les données
        for col in ['hint', 'comment', 'date_flash', 'image_url', 'instagram_url']:
            if col not in filtered_df.columns:
                filtered_df[col] = ''
        
        filtered_df = filtered_df.fillna('')
        
        formatted_data = [{
            "id": str(row["id"]),
            "address": row["address"],
            "lat": row["Latitude"],
            "lng": row["Longitude"],
            "flashed": bool(row["Flashed"]),
            "flashable": bool(row["Flashable"]),
            "date_flash": row.get("date_flash", ""),
            "image_url": row.get("image_url", ""),
            "hint": row.get("hint", ""),
            "comment": row.get("comment", ""),
            "instagram_url": row.get("instagram_url", ""),
        } for _, row in filtered_df.iterrows()]
        
        return jsonify({
            "invaders": formatted_data,
            "city_info": city_info
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
