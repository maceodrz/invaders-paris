from flask import Flask, render_template, request, jsonify
import folium
import pandas as pd
import os
from folium.plugins import MousePosition

app = Flask(__name__)

CSV_FILE = "data/cleaned_invaders.csv"

def get_marker_color(row):
    """Determine marker color based on Flashed and Flashable status"""
    if not row["Flashable"]:
        return "gray"
    return "green" if row["Flashed"] else "purple"

def create_map():
    df = pd.read_csv(CSV_FILE)
    
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
                        marker.src = marker.src.replace(/(red|green|purple|gray)/, newColor);
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
            <p><strong>Address:</strong> {row['address']}</p>
            <p><strong>Status:</strong> <span class="status-text">{'Flashed' if row['Flashed'] else 'Not Flashed'}</span></p>
            <p><strong>Flashable:</strong> <span class="flashable-text">{'Yes' if row['Flashable'] else 'No'}</span></p>
            {button_html}
        </div>
        """
        
        # Create marker with data attribute
        icon = folium.Icon(color=color, icon="info-sign", prefix='fa')
        
        marker = folium.Marker(
            location=[row["Latitude"], row["Longitude"]],
            popup=folium.Popup(popup_html, max_width=300),
            icon=icon
        )
        
        marker._name = f'marker_{invader_id}'
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
    create_map()
    return render_template("index.html")

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

if __name__ == "__main__":
    app.run(debug=True)
