from flask import Flask, render_template, request, jsonify
import folium
import pandas as pd
import os
from folium.plugins import MousePosition
import os
from werkzeug.utils import secure_filename
#from extract.treat_video import get_invader_from_video_path

app = Flask(__name__)

CSV_FILE = "data/cleaned_invaders.csv"

# Configurations pour l'upload
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
PENDING_INVADERS = set()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_marker_color(row):
    """Determine marker color based on Flashed and Flashable status"""
    if not row["Flashable"]:
        return "grey"
    if str(row["id"]) in PENDING_INVADERS:  # Vérifier si l'invader est en attente
        return "blue"
    return "green" if row["Flashed"] else "violet"

def create_map(to_validate=False, only_flashable=False, only_unflashed=False, only_flashed=False):
    df = pd.read_csv(CSV_FILE)
    
    if PENDING_INVADERS:
        for invader_id in PENDING_INVADERS:
            mask = df['id'] == invader_id
            if any(mask):
                df.loc[mask, 'Flashed'] = True
    
    # Ensure Flashable column exists with default True
    if "Flashable" not in df.columns:
        df["Flashable"] = True
        df.to_csv(CSV_FILE, index=False)
    
    # Create a map centered on Paris
    paris_map = folium.Map(location=[48.8566, 2.3522], zoom_start=12, tiles="OpenStreetMap")
    
    # Add mouse position display
    MousePosition().add_to(paris_map)
    
    # Add custom JavaScript to handle button clicks
    paris_map.get_root().header.add_child(folium.Element("""
        <script>
        function updateInvaderStatus(invaderId, markerElement, action) {
            fetch("/update_invader_status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id: invaderId,
                    action: action
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    // Get the marker container
                    const markerContainer = markerElement.closest('.leaflet-marker-pane');
                    if (!markerContainer) return;
                    
                    // Find the specific marker icon
                    const marker = markerContainer.querySelector(`[data-invader-id="${invaderId}"]`);
                    if (marker) {
                        // Update marker color based on action
                        const newColor = data.newColor;
                        marker.src = marker.src.replace(/(red|green|violet|grey)/, newColor);
                    }
                    
                    // Update popup content
                    const popupContent = markerElement.closest('.leaflet-popup-content');
                    if (popupContent) {
                        const statusElement = popupContent.querySelector('.status-text');
                        const flashableElement = popupContent.querySelector('.flashable-text');
                        if (statusElement) {
                            statusElement.textContent = data.newStatus;
                        }
                        if (flashableElement) {
                            flashableElement.textContent = data.newFlashable;
                        }
                        
                        // Update buttons container
                        const buttonContainer = popupContent.querySelector('.button-container');
                        if (buttonContainer) {
                            buttonContainer.innerHTML = data.newButtonsHtml;
                        }
                    }
                    
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Error updating invader status");
            });
        }
        </script>
    """))
    
    # Add points from the CSV
    for _, row in df.iterrows():
        color = get_marker_color(row)
        invader_id = str(row['id'])
        
        # Create buttons HTML based on current status
        if not row["Flashable"]:
            button_html = (
                '<div class="button-container">'
                f'<button onclick="updateInvaderStatus(\'{invader_id}\', this, \'enable\')" '
                'style="background-color: #4CAF50; color: white; padding: 8px 16px; '
                'border: none; border-radius: 4px; cursor: pointer; margin-bottom: 5px;" '
                'onmouseover="this.style.backgroundColor=\'#45a049\'" '
                'onmouseout="this.style.backgroundColor=\'#4CAF50\'">'
                'Enable Flashing</button></div>'
            )
        else:
            flash_button = (
                f'<button onclick="updateInvaderStatus(\'{invader_id}\', this, \'{"unflash" if row["Flashed"] else "flash"}\')" '
                f'style="background-color: {"#f44336" if row["Flashed"] else "#4CAF50"}; color: white; padding: 8px 16px; '
                'border: none; border-radius: 4px; cursor: pointer; margin-bottom: 5px;" '
                f'onmouseover="this.style.backgroundColor=\'{"#da190b" if row["Flashed"] else "#45a049"}\'" '
                f'onmouseout="this.style.backgroundColor=\'{"#f44336" if row["Flashed"] else "#4CAF50"}\'">'
                f'{"Unflash" if row["Flashed"] else "Mark as Flashed"}</button><br>'
            )
            impossible_button = (
                f'<button onclick="updateInvaderStatus(\'{invader_id}\', this, \'disable\')" '
                'style="background-color: #808080; color: white; padding: 8px 16px; '
                'border: none; border-radius: 4px; cursor: pointer;" '
                'onmouseover="this.style.backgroundColor=\'#666666\'" '
                'onmouseout="this.style.backgroundColor=\'#808080\'">'
                'Impossible to Flash</button>'
            )
            button_html = f'<div class="button-container">{flash_button}{impossible_button}</div>'
        
        # Create popup HTML
        popup_html = f"""
        <div style="font-family: Arial, sans-serif; padding: 10px;">
            <h3 style="margin: 0 0 10px 0;">Invader Details</h3>
            <p><strong>ID:</strong> {invader_id}</p>
            <p><strong>Adresse:</strong> {row['address']}</p>
            <p><strong>Statut:</strong> <span class="status-text">{'Flashé' if row['Flashed'] else "Je t'attends !"}</span></p>
            <p><strong>Flashable:</strong> <span class="flashable-text">{'Yep' if row['Flashable'] else 'Nope'}</span></p>
            {button_html}
        </div>
        """
        
        # Create marker with data attribute
        icon_html = f"""
        <div>
            <img src="https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-{color}.png"
                 data-invader-id="{invader_id}">
        </div>
        """
        icon = folium.DivIcon(html=icon_html)

        marker = folium.Marker(
            location=[row["Latitude"], row["Longitude"]],
            popup=folium.Popup(popup_html, max_width=300),
            icon=icon
        )
        marker._name = f'marker_{invader_id}'
        
        if to_validate and invader_id in PENDING_INVADERS:
            marker.add_to(paris_map)
        elif only_flashable and row["Flashable"]:
            if only_unflashed and not row["Flashed"]:
                marker.add_to(paris_map)
            elif not only_unflashed: # Display all flashable
                marker.add_to(paris_map)
        elif only_unflashed and not row["Flashed"] and not only_flashable:
            marker.add_to(paris_map)
        elif not only_flashed and not only_flashable and not only_unflashed and not to_validate:
            marker.add_to(paris_map)
        elif only_flashed and row["Flashed"]:
            marker.add_to(paris_map)
    
    paris_map.save("static/flashed_invaders_map.html")

def generate_buttons_html(invader_id, is_flashed, is_flashable):
    """Generate HTML for buttons based on current status"""
    if not is_flashable:
        return (
            f'<button onclick="updateInvaderStatus(\'{invader_id}\', this, \'enable\')" '
            'style="background-color: #4CAF50; color: white; padding: 8px 16px; '
            'border: none; border-radius: 4px; cursor: pointer; margin-bottom: 5px;" '
            'onmouseover="this.style.backgroundColor=\'#45a049\'" '
            'onmouseout="this.style.backgroundColor=\'#4CAF50\'">'
            'Enable Flashing</button>'
        )
    
    flash_button = (
        f'<button onclick="updateInvaderStatus(\'{invader_id}\', this, \'{"unflash" if is_flashed else "flash"}\')" '
        f'style="background-color: {"#f44336" if is_flashed else "#4CAF50"}; color: white; padding: 8px 16px; '
        'border: none; border-radius: 4px; cursor: pointer; margin-bottom: 5px;" '
        f'onmouseover="this.style.backgroundColor=\'{"#da190b" if is_flashed else "#45a049"}\'" '
        f'onmouseout="this.style.backgroundColor=\'{"#f44336" if is_flashed else "#4CAF50"}\'">'
        f'{"Unflash" if is_flashed else "Mark as Flashed"}</button><br>'
    )
    impossible_button = (
        f'<button onclick="updateInvaderStatus(\'{invader_id}\', this, \'disable\')" '
        'style="background-color: #808080; color: white; padding: 8px 16px; '
        'border: none; border-radius: 4px; cursor: pointer;" '
        'onmouseover="this.style.backgroundColor=\'#666666\'" '
        'onmouseout="this.style.backgroundColor=\'#808080\'">'
        'Impossible to Flash</button>'
    )
    return flash_button + impossible_button

@app.route("/")
def home():
    return render_template("valentine.html")  # La nouvelle page d'accueil

@app.route("/map")
def map_page():
    create_map()
    return render_template("map.html")  # L'ancienne page index.html renommée en map.html

@app.route("/unflashed_invaders")
def map_unflashed():
    create_map(only_unflashed=True)
    return render_template("map.html")

@app.route("/flashable_invaders")
def map_flashable():
    create_map(only_flashable=True)
    return render_template("map.html")

@app.route("/flashable_and_unflashed_invaders")
def map_flashable_unflashed():
    create_map(only_flashable=True, only_unflashed=True)
    return render_template("map.html")

@app.route("/flashed_invaders")
def map_flashed():
    create_map(only_flashed=True)
    return render_template("map.html")

@app.route("/update_invader_status", methods=["POST"])
def update_invader_status():
    try:
        data = request.get_json()
        invader_id = data.get("id")
        action = data.get("action")
        
        if not invader_id or action not in ["flash", "unflash", "disable", "enable"]:
            return jsonify({"status": "error", "message": "Invalid request"}), 400
        
        df = pd.read_csv(CSV_FILE)
        mask = df["id"] == invader_id
        
        if not any(mask):
            return jsonify({"status": "error", "message": "Invader not found"}), 404
        
        if str(invader_id) in PENDING_INVADERS:
            # Si on unflash un invader en attente, le retirer de la liste des pending
            if action == "unflash":
                PENDING_INVADERS.remove(str(invader_id))
                df.loc[mask, "Flashed"] = False

        row = df.loc[mask].iloc[0]
        
        if action in ["flash", "unflash"]:
            if not row["Flashable"]:
                return jsonify({"status": "error", "message": "Invader is not flashable"}), 400
            new_flashed = action == "flash"
            df.loc[mask, "Flashed"] = new_flashed
        else:  # disable/enable
            new_flashable = action == "enable"
            df.loc[mask, "Flashable"] = new_flashable
            if not new_flashable:
                df.loc[mask, "Flashed"] = False
        
        df.to_csv(CSV_FILE, index=False)
        
        # Get updated row
        updated_row = df.loc[mask].iloc[0]
        
        return jsonify({
            "status": "success",
            "message": f"Invader {invader_id} updated successfully",
            "newColor": get_marker_color(updated_row),
            "newStatus": "Flashed" if updated_row["Flashed"] else "Not Flashed",
            "newFlashable": "Yes" if updated_row["Flashable"] else "No",
            "newButtonsHtml": generate_buttons_html(invader_id, updated_row["Flashed"], updated_row["Flashable"])
        })
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/search_invaders")
def search_invaders():
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify([])
    
    df = pd.read_csv(CSV_FILE)
    # Convert IDs to strings for searching
    matching_ids = df[df['id'].astype(str).str.contains(query)]['id'].tolist()
    return jsonify(matching_ids)

# Nouvelle route pour l'upload et le traitement vidéo
@app.route('/upload_video', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file'}), 400
    
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if video_file and allowed_file(video_file.filename):
        filename = secure_filename(video_file.filename)
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
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
                mask = df['id'] == invader_id
                if any(mask) and not df.loc[mask, 'Flashed'].iloc[0]:
                    new_flashed.append(invader_id)
            print(f"BEFORE GLOBAL New flashed invaders: {len(new_flashed)}")
            
            # Stocker les nouveaux invaders en attente
            global PENDING_INVADERS
            PENDING_INVADERS = set(new_flashed)
            
            print(f"New flashed invaders: {len(new_flashed)}")
            
            if not new_flashed:
                raise ValueError("No new invaders found in the video.")

            # Créer une nouvelle carte avec les changements
            create_map(to_validate=True)

            return jsonify({
                'status': 'success',
                'new_flashed': new_flashed,
                'total_found': len(invader_ids)
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            # Nettoyer le fichier uploadé
            os.remove(video_path)
        
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == "__main__":
    app.run(debug=True)