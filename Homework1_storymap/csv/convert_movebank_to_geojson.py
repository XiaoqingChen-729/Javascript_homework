import pandas as pd
import json
from pathlib import Path

# ================================
# 配置路径（按你的文件名修改）
# ================================
MARA_CSV     = r"White-bearded wildebeest (Connochaetes taurinus) - Greater Mara Ecosystem (2017-2021).csv"
TANZANIA_CSV = r"Wildebeest (Eastern white bearded) Morrison Tarangire-Manyara Tanzania.csv"
TSAVO_CSV    = r"Tsavo Lion Study.csv"

OUTDIR = Path("./data")  # 输出到 data 文件夹
OUTDIR.mkdir(exist_ok=True)

# ================================
# 2️⃣ 通用函数
# ================================
def read_movebank_csv(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    if 'timestamp' not in df.columns and 'study-local-timestamp' in df.columns:
        df['timestamp'] = df['study-local-timestamp']
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')

    required = ['location-long','location-lat','timestamp']
    for col in required:
        if col not in df.columns:
            raise ValueError(f"{path.name} 缺少字段 {col}")

    if 'individual-local-identifier' not in df.columns:
        df['individual-local-identifier'] = 'unknown'
    if 'study-name' not in df.columns:
        df['study-name'] = path.stem
    return df

def to_points_geojson(df: pd.DataFrame, species: str, sample_every: int = None):
    d = df.dropna(subset=['location-long','location-lat','timestamp']).sort_values(['individual-local-identifier','timestamp'])
    if sample_every and sample_every > 1:
        d = d.iloc[::sample_every, :]
    feats = []
    for _, r in d.iterrows():
        ts = r['timestamp']
        feats.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [float(r['location-long']), float(r['location-lat'])]},
            "properties": {
                "timestamp": ts.isoformat() if pd.notna(ts) else None,
                "year": int(ts.year) if pd.notna(ts) else None,
                "month": int(ts.month) if pd.notna(ts) else None,
                "species": species,
                "individual_id": str(r['individual-local-identifier']),
                "study": str(r['study-name'])
            }
        })
    return {"type": "FeatureCollection", "features": feats}

def to_tracks_geojson(df: pd.DataFrame, species: str):
    feats = []
    for indiv, g in df.dropna(subset=['location-long','location-lat','timestamp']).groupby('individual-local-identifier'):
        g = g.sort_values('timestamp')
        if len(g) < 2: continue
        coords = [[float(lon), float(lat)] for lon, lat in zip(g['location-long'], g['location-lat'])]
        feats.append({
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": coords},
            "properties": {"species": species, "individual_id": str(indiv)}
        })
    return {"type": "FeatureCollection", "features": feats}

def save_geojson(data, filename):
    with open(OUTDIR / filename, "w", encoding="utf-8") as f:
        json.dump(data, f)
    print(f"✅ Saved: {OUTDIR/filename}")

def split_by_months(points, months):
    feats = [f for f in points["features"] if f["properties"].get("month") in months]
    return {"type":"FeatureCollection","features":feats}

# ================================
# 3️⃣ 读取并生成 GeoJSON
# ================================
mara = read_movebank_csv(Path(MARA_CSV))
tza  = read_movebank_csv(Path(TANZANIA_CSV))
tsavo = read_movebank_csv(Path(TSAVO_CSV))

# --- 角马 Mara 主数据 ---
mara_points = to_points_geojson(mara, "Wildebeest")
mara_tracks = to_tracks_geojson(mara, "Wildebeest")
save_geojson(mara_points, "wildebeest_mara_2017_2021_points.geojson")
save_geojson(mara_tracks, "wildebeest_mara_2017_2021_tracks.geojson")

# --- 季节分片 ---
dry   = split_by_months(mara_points, {6,7,8,9})
short = split_by_months(mara_points, {10,11})
wet   = split_by_months(mara_points, {12,1,2,3})
save_geojson(dry,   "wildebeest_mara_dry_season_points.geojson")
save_geojson(short, "wildebeest_mara_short_rains_points.geojson")
save_geojson(wet,   "wildebeest_mara_wet_season_points.geojson")

# --- Tanzania 抽样背景 ---
tza_sample = to_points_geojson(tza, "Wildebeest", sample_every=3)
save_geojson(tza_sample, "wildebeest_tanzania_points_sampled.geojson")

# --- Tsavo 狮子 ---
tsavo_points = to_points_geojson(tsavo, "Lion")
tsavo_tracks = to_tracks_geojson(tsavo, "Lion")
save_geojson(tsavo_points, "tsavo_lion_points.geojson")
save_geojson(tsavo_tracks, "tsavo_lion_tracks.geojson")

# --- 合并预览 ---
mara_sample = to_points_geojson(mara, "Wildebeest", sample_every=10)
tsavo_sample = to_points_geojson(tsavo, "Lion", sample_every=5)
combined = {"type": "FeatureCollection", "features": mara_sample["features"] + tza_sample["features"] + tsavo_sample["features"]}
save_geojson(combined, "combined_wildebeest_tsavo_points_sampled.geojson")

# ================================
# 4️⃣ 输出总结
# ================================
def coverage(df): return str(df['timestamp'].min()), str(df['timestamp'].max())
print("\n=== Summary ===")
print("Mara:", len(mara), "rows", "time:", coverage(mara))
print("Tanzania:", len(tza), "rows", "time:", coverage(tza))
print("Tsavo Lion:", len(tsavo), "rows", "time:", coverage(tsavo))
print("All GeoJSON saved under:", OUTDIR.resolve())
