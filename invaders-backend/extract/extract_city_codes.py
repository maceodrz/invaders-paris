import pandas as pd
import json

# Charger le CSV
df = pd.read_csv('invaders-backend/data/cleaned_invaders_v2.csv')

# Extraire les codes de ville (partie avant le '_')
city_codes = df['id'].str.split('_').str[0].unique()

print("Codes de ville trouvés dans le CSV:")
for code in sorted(city_codes):
    count = len(df[df['id'].str.startswith(code + '_')])
    print(f"{code}: {count} invaders")

# Créer le dictionnaire de mapping
# Basé sur les noms de villes fournis
CITY_MAPPING = {
  "PA": {
    "name": "Paris",
    "country": "🇫🇷",
    "zoom": 12,
    "center": [
      48.8566,
      2.3522
    ],
    "includes": [
      "PA",
      "VRS",
      "FON"
    ]
  },
  "VRS": {
    "name": "Versailles",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      48.8014,
      2.1301
    ]
  },
  "AIX": {
    "name": "Aix-en-Provence",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      43.5297,
      5.4474
    ]
  },
  "AMI": {
    "name": "Amiens",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      49.8942,
      2.2957
    ]
  },
  "AMS": {
    "name": "Amsterdam",
    "country": "🇳🇱",
    "zoom": 12,
    "center": [
      52.3676,
      4.9041
    ]
  },
  "ANVR": {
    "name": "Antwerp",
    "country": "🇧🇪",
    "zoom": 12,
    "center": [
      51.2194,
      4.4025
    ]
  },
  "ANZR": {
    "name": "Anzère",
    "country": "🇨🇭",
    "zoom": 13,
    "center": [
      46.2952,
      7.3996
    ]
  },
  "AVI": {
    "name": "Avignon",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      43.9493,
      4.8055
    ]
  },
  "BGK": {
    "name": "Bangkok",
    "country": "🇹🇭",
    "zoom": 11,
    "center": [
      13.7563,
      100.5018
    ]
  },
  "BRC": {
    "name": "Barcelona",
    "country": "🇪🇸",
    "zoom": 12,
    "center": [
      41.3851,
      2.1734
    ]
  },
  "BSL": {
    "name": "Basel",
    "country": "🇨🇭",
    "zoom": 12,
    "center": [
      47.5596,
      7.5886
    ]
  },
  "BRN": {
    "name": "Bern",
    "country": "🇨🇭",
    "zoom": 12,
    "center": [
      46.948,
      7.4474
    ]
  },
  "BAB": {
    "name": "Biarritz-Anglet-Bayonne",
    "country": "🇫🇷",
    "zoom": 12,
    "center": [
      43.485,
      -1.4832
    ]
  },
  "BXL": {
    "name": "Brussels",
    "country": "🇧🇪",
    "zoom": 12,
    "center": [
      50.8503,
      4.3517
    ]
  },
  "CAPF": {
    "name": "Cap Ferret",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      44.6311,
      -1.2457
    ]
  },
  "CAZ": {
    "name": "Côte d’Azur",
    "country": "🇫🇷",
    "zoom": 10,
    "center": [
      43.7102,
      7.262
    ]
  },
  "CON": {
    "name": "Contis-Les-Bains",
    "country": "🇫🇷",
    "zoom": 14,
    "center": [
      44.0912,
      -1.322
    ]
  },
  "DIJ": {
    "name": "Dijon",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      47.322,
      5.0415
    ]
  },
  "DJBA": {
    "name": "Djerba",
    "country": "🇹🇳",
    "zoom": 12,
    "center": [
      33.8076,
      10.8452
    ]
  },
  "DJN": {
    "name": "Daejeon",
    "country": "🇰🇷",
    "zoom": 12,
    "center": [
      36.3504,
      127.3845
    ]
  },
  "FAO": {
    "name": "Faro",
    "country": "🇵🇹",
    "zoom": 13,
    "center": [
      37.0194,
      -7.9304
    ]
  },
  "FRQ": {
    "name": "Forcalquier",
    "country": "🇫🇷",
    "zoom": 14,
    "center": [
      43.9597,
      5.7796
    ]
  },
  "FTBL": {
    "name": "Frankfurt",
    "country": "🇩🇪",
    "zoom": 12,
    "center": [
      50.1109,
      8.6821
    ]
  },
  "GNV": {
    "name": "Geneva",
    "country": "🇨🇭",
    "zoom": 12,
    "center": [
      46.2044,
      6.1432
    ]
  },
  "GRN": {
    "name": "Grenoble",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      45.1885,
      5.7245
    ]
  },
  "GRU": {
    "name": "Grude",
    "country": "🇧🇦",
    "zoom": 14,
    "center": [
      43.3747,
      17.3847
    ]
  },
  "HALM": {
    "name": "Halmstad",
    "country": "🇸🇪",
    "zoom": 12,
    "center": [
      56.6745,
      12.857
    ]
  },
  "HK": {
    "name": "Hong Kong",
    "country": "🇭🇰",
    "zoom": 11,
    "center": [
      22.3193,
      114.1694
    ]
  },
  "IST": {
    "name": "Istanbul",
    "country": "🇹🇷",
    "zoom": 12,
    "center": [
      41.0082,
      28.9784
    ]
  },
  "KAT": {
    "name": "Kathmandu",
    "country": "🇳🇵",
    "zoom": 12,
    "center": [
      27.7172,
      85.324
    ]
  },
  "KLN": {
    "name": "Cologne",
    "country": "🇩🇪",
    "zoom": 12,
    "center": [
      50.9375,
      6.9603
    ]
  },
  "LA": {
    "name": "Los Angeles",
    "country": "🇺🇸",
    "zoom": 11,
    "center": [
      34.0522,
      -118.2437
    ]
  },
  "LBR": {
    "name": "Lubéron",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      47.7833,
      6.65
    ]
  },
  "LCT": {
    "name": "La Ciotat",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      43.1667,
      5.6333
    ]
  },
  "LDN": {
    "name": "London",
    "country": "🇬🇧",
    "zoom": 11,
    "center": [
      51.5074,
      -0.1278
    ]
  },
  "LIL": {
    "name": "Lille",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      50.6292,
      3.0573
    ]
  },
  "LJU": {
    "name": "Ljubljana",
    "country": "🇸🇮",
    "zoom": 13,
    "center": [
      46.0569,
      14.5058
    ]
  },
  "LSN": {
    "name": "Lausanne",
    "country": "🇨🇭",
    "zoom": 13,
    "center": [
      46.5167,
      6.6333
    ]
  },
  "LY": {
    "name": "Lyon",
    "country": "🇫🇷",
    "zoom": 12,
    "center": [
      45.764,
      4.8357
    ]
  },
  "MAN": {
    "name": "Manchester",
    "country": "🇬🇧",
    "zoom": 12,
    "center": [
      53.4808,
      -2.2426
    ]
  },
  "MARS": {
    "name": "Marseille",
    "country": "🇫🇷",
    "zoom": 12,
    "center": [
      43.2965,
      5.3698
    ]
  },
  "MBSA": {
    "name": "Mombasa",
    "country": "🇰🇪",
    "zoom": 12,
    "center": [
      -4.0483,
      39.6902
    ]
  },
  "MEN": {
    "name": "Menorca",
    "country": "🇪🇸",
    "zoom": 12,
    "center": [
      39.9496,
      4.1146
    ]
  },
  "MIA": {
    "name": "Miami",
    "country": "🇺🇸",
    "zoom": 12,
    "center": [
      25.7617,
      -80.1918
    ]
  },
  "MLB": {
    "name": "Melbourne",
    "country": "🇦🇺",
    "zoom": 12,
    "center": [
      -37.8136,
      144.9631
    ]
  },
  "MLGA": {
    "name": "Malaga",
    "country": "🇪🇸",
    "zoom": 12,
    "center": [
      36.7202,
      -4.4203
    ]
  },
  "MPL": {
    "name": "Montpellier",
    "country": "🇫🇷",
    "zoom": 12,
    "center": [
      43.6111,
      3.8767
    ]
  },
  "MRAK": {
    "name": "Marrakech",
    "country": "🇲🇦",
    "zoom": 12,
    "center": [
      31.6295,
      -7.9811
    ]
  },
  "MTB": {
    "name": "Montauban",
    "country": "🇫🇷",
    "zoom": 12,
    "center": [
      44.0083,
      1.0083
    ]
  },
  "MUN": {
    "name": "Munich",
    "country": "🇩🇪",
    "zoom": 12,
    "center": [
      48.1351,
      11.582
    ]
  },
  "NA": {
    "name": "Nantes",
    "country": "🇫🇷",
    "zoom": 12,
    "center": [
      47.2183,
      -1.5533
    ]
  },
  "NCL": {
    "name": "Newcastle",
    "country": "🇬🇧",
    "zoom": 12,
    "center": [
      54.9783,
      -1.6174
    ]
  },
  "NIM": {
    "name": "Nîmes",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      43.8367,
      4.3601
    ]
  },
  "NOO": {
    "name": "Noordwijk",
    "country": "🇳🇱",
    "zoom": 13,
    "center": [
      52.2394,
      4.4435
    ]
  },
  "NY": {
    "name": "New York",
    "country": "🇺🇸",
    "zoom": 11,
    "center": [
      40.7128,
      -74.006
    ]
  },
  "ORLN": {
    "name": "Orléans",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      47.9029,
      1.9093
    ]
  },
  "PAU": {
    "name": "Pau",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      43.2951,
      -0.3708
    ]
  },
  "POTI": {
    "name": "Potosi",
    "country": "🇧🇴",
    "zoom": 13,
    "center": [
      -19.5883,
      -65.7536
    ]
  },
  "PRP": {
    "name": "Perpignan",
    "country": "��",
    "zoom": 12,
    "center": [
      42.6983,
      2.8958
    ]
  },
  "PRT": {
    "name": "Porto",
    "country": "🇵🇹",
    "zoom": 12,
    "center": [
      41.1579,
      -8.6291
    ]
  },
  "RBA": {
    "name": "Rabat",
    "country": "🇲🇦",
    "zoom": 12,
    "center": [
      34.0209,
      -6.8417
    ]
  },
  "RDU": {
    "name": "Redu",
    "country": "🇧🇪",
    "zoom": 13,
    "center": [
      37.4852,
      2.1734
    ]
  },
  "REUN": {
    "name": "Réunion",
    "country": "🇷🇪",
    "zoom": 11,
    "center": [
      -21.1151,
      55.5364
    ]
  },
  "RN": {
    "name": "Rennes",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      48.1173,
      -1.6778
    ]
  },
  "ROM": {
    "name": "Rome",
    "country": "🇮🇹",
    "zoom": 11,
    "center": [
      41.9028,
      12.4964
    ]
  },
  "RTD": {
    "name": "Rotterdam",
    "country": "🇳🇱",
    "zoom": 13,
    "center": [
      51.9225,
      4.4675
    ]
  },
  "SD": {
    "name": "San Diego",
    "country": "🇺🇸",
    "zoom": 12,
    "center": [
      32.7157,
      -117.1611
    ]
  },
  "SL": {
    "name": "Seoul",
    "country": "🇰🇷",
    "zoom": 12,
    "center": [
      37.5665,
      126.9780
    ]
  },
  "SP": {
    "name": "São Paulo",
    "country": "🇧🇷",
    "zoom": 11,
    "center": [
      -23.5505,
      -46.6333
    ]
  },
  "TK": {
    "name": "Tokyo",
    "country": "🇯🇵",
    "zoom": 11,
    "center": [
      35.6762,
      139.6503
    ]
  },
  "TLS": {
    "name": "Toulouse",
    "country": "🇫🇷",
    "zoom": 12,
    "center": [
      43.6047,
      1.4442
    ]
  },
  "VLMO": {
    "name": "Valmorel",
    "country": "🇫🇷",
    "zoom": 13,
    "center": [
      45.3500,
      6.6667
    ]
  },
  "VRN": {
    "name": "Verona",
    "country": "🇮🇹",
    "zoom": 13,
    "center": [
      45.4384,
      10.9916
    ]
  },
  "VSB": {
    "name": "Visby",
    "country": "🇸🇪",
    "zoom": 13,
    "center": [
      57.6387,
      18.2925
    ]
  },
  "WN": {
    "name": "Vienna",
    "country": "🇦🇹",
    "zoom": 12,
    "center": [
      48.2082,
      16.3738
    ]
  }
}


# Sauvegarder le mapping dans un fichier JSON
with open('invaders-backend/data/city_mapping_V0.json', 'w', encoding='utf-8') as f:
    json.dump(CITY_MAPPING, f, ensure_ascii=False, indent=2)

print("\nMapping sauvegardé dans data/city_mapping_V0.json")