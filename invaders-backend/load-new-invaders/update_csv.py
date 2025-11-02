import pandas as pd
import os
import sys
import json
from pathlib import Path

"""
Se base sur le git https://github.com/goguelnikov/SpaceInvaders
qui stocke les données sur les space invaders du monde et leur état dans un json.
On le transforme pour pouvoir le traiter et modifier notre csv
"""
# NEW: https://pnote.eu/projects/invaders/map/invaders.json -> tous les invaders au format json
# dans une liste avec {
#     "id": "AIX_01",
#     "status": "OK",
#     "hint": null,
#     "instagramUrl": "https://www.instagram.com/explore/tags/aix_01/",
#     "obf_lat": 43.5285840236,
#     "obf_lng": 5.4431859342
#   },
# ensuite pour chercher : https://www.invader-spotter.art/cherche.php et c'est tout

def json_to_df(json_path):
    """
    Lit un fichier JSON et le transforme en DataFrame pandas.
    :param json_path: chemin vers le fichier JSON
    :return: DataFrame pandas
    """
    with open(json_path, "r") as f:
        text = f.read()
    data = text[1:]
    data = json.loads(data)  # transforme la string en liste Python
    df = pd.DataFrame(data)
    return df


def clean_df_new(df, cities=['PA', 'VRS']): # TODO adapt the regex to the cities / have a dict with the city names and their code
    """
    Fonction pour nettoyer le DataFrame en supprimant les lignes avec des valeurs manquantes
    et en remplaçant les virgules par des points dans les colonnes Latitude et Longitude.
    :param df: DataFrame à nettoyer
    :return: DataFrame nettoyé
    """
    df = df[df["id"].str.match(r"^(PA_|VRS_)\d+$")] # TODO have a df by city, or to be filtered later in the postgres app
    df.rename(columns={"lat": "Latitude", "lng": "Longitude"}, inplace=True)
    df["Latitude"] = df["Latitude"].str.replace(",", ".").astype(float)
    df["Longitude"] = df["Longitude"].str.replace(",", ".").astype(float)
    return df


def merge_invaders_df(df_new, df_old):
    """
    Fonction pour fusionner deux DataFrames en utilisant une jointure gauche sur la colonne "id".
    :param df_new: DataFrame contenant les nouvelles données
    :param df_old: DataFrame contenant les anciennes données
    :return: DataFrame fusionné
    """
    df_merged = df_new.merge(
        df_old[["id", "Flashed", "Flashable", "address"]], on="id", how="left"
    )
    df_merged["Flashed"] = df_merged["Flashed"].fillna(False)
    df_merged["Flashable"] = df_merged["Flashable"].fillna(True)
    df_merged["Flashable"] = df_merged.apply(
        lambda row: (
            False
            if (row["status"] == "destroyed" or row["Flashable"] is False)
            and row["Flashed"] is False
            else True
        ),
        axis=1,
    )
    df_merged["address"] = df_merged["address"].fillna("Je sais pas, loser !")
    return df_merged


def update_invaders(json_file, invaders_csv_path, ouput_csv_path):
    df_new = json_to_df(json_file)
    df_old = pd.read_csv(invaders_csv_path)
    df_new_cleaned = clean_df_new(df_new)
    df_merged = merge_invaders_df(df_new_cleaned, df_old)
    df_result = df_merged[
        [
            "id",
            "Latitude",
            "Longitude",
            "points",
            "Flashed",
            "Flashable",
            "status",
            "hint",
            "points",
            "address",
        ]
    ]
    df_result.to_csv(ouput_csv_path, index=False)
    print(f"DataFrame mis à jour et enregistré dans {ouput_csv_path}")


if __name__ == "__main__":

    # Define the paths to the JSON file and the CSV file
    json_file = Path("../SpaceInvaders/world_space_invaders_V05.json")
    invaders_csv_path = Path("data/cleaned_invaders_v2.csv")
    ouput_csv_path = Path("data/cleaned_invaders_v3.csv")

    # Check if the JSON file exists
    if not json_file.exists():
        print(f"Le fichier {json_file} n'existe pas.")
        sys.exit(1)

    # Check if the CSV file exists
    if not invaders_csv_path.exists():
        print(f"Le fichier {invaders_csv_path} n'existe pas.")
        sys.exit(1)

    # Update the invaders data
    update_invaders(json_file, invaders_csv_path, ouput_csv_path)
