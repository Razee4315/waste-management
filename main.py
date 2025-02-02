import eel
import time
import math
import re

# Initialize Eel with the "web" folder
eel.init("web")

# ---------------------------
# In-Memory Data Structures
# ---------------------------
# Default maps center on Skardu, Pakistan (approx. lat: 35.3, lng: 75.6333)
dustbins = {
    "D1": {"lat": 35.3000, "lng": 75.6333, "name": "Dustbin A", "description": "Near Main Market", "status": "Full", "last_updated": time.ctime()},
    "D2": {"lat": 35.3050, "lng": 75.6400, "name": "Dustbin B", "description": "Corner of Hospital", "status": "Partially Full", "last_updated": time.ctime()},
    "D3": {"lat": 35.3100, "lng": 75.6350, "name": "Dustbin C", "description": "In the park", "status": "Empty", "last_updated": time.ctime()},
    "D4": {"lat": 35.3123, "lng": 75.6289, "name": "Dustbin X", "description": "Near School Gate", "status": "Full", "last_updated": time.ctime()},
    "D5": {"lat": 35.3087, "lng": 75.6372, "name": "Dustbin Y", "description": "Beside Supermarket", "status": "Partially Full", "last_updated": time.ctime()},
    "D6": {"lat": 35.2995, "lng": 75.6315, "name": "Dustbin Z", "description": "Near Bus Stop", "status": "Empty", "last_updated": time.ctime()}

}

dumping_points = {
    "DP1": {"lat": 35.3200, "lng": 75.6500, "name": "Dumping Site 1"},
    "DP2": {"lat": 35.3150, "lng": 75.6450, "name": "Dumping Site 2"},
    "DP3": {"lat": 35.3256, "lng": 75.6523, "name": "Dumping Site 3"},
    "DP4": {"lat": 35.3189, "lng": 75.6487, "name": "Dumping Site 4"}
}

# ---------------------------
# Helper Functions
# ---------------------------
def next_id(existing_ids, prefix):
    """Generate the next available ID based on existing IDs."""
    max_num = 0
    pattern = re.compile(r'^' + re.escape(prefix) + r'(\d+)$')
    for key in existing_ids:
        m = pattern.match(key)
        if m:
            num = int(m.group(1))
            if num > max_num:
                max_num = num
    return f"{prefix}{max_num + 1}"

@eel.expose
def get_next_dustbin_id():
    return next_id(dustbins.keys(), "D")

@eel.expose
def get_next_dumping_id():
    return next_id(dumping_points.keys(), "DP")

# ---------------------------
# Eel Exposed Functions
# ---------------------------
@eel.expose
def get_dustbins():
    return dustbins

@eel.expose
def update_dustbin_status(dustbin_id, new_status):
    if dustbin_id in dustbins:
        dustbins[dustbin_id]['status'] = new_status
        dustbins[dustbin_id]['last_updated'] = time.ctime()
        print(f"Updated dustbin {dustbin_id} to {new_status}")
        return {"success": True, "message": f"Dustbin {dustbin_id} updated."}
    else:
        return {"success": False, "message": "Dustbin not found."}

@eel.expose
def add_dustbin(lat, lng, name, description, status):
    new_id = next_id(dustbins.keys(), "D")
    try:
        lat = float(lat)
        lng = float(lng)
    except ValueError:
        return {"success": False, "message": "Invalid coordinates."}
    dustbins[new_id] = {
        "lat": lat,
        "lng": lng,
        "name": name,
        "description": description,
        "status": status,
        "last_updated": time.ctime()
    }
    print(f"Added dustbin {new_id} at ({lat}, {lng}) with status {status}")
    return {"success": True, "message": f"Dustbin {new_id} added.", "new_id": new_id}

@eel.expose
def delete_dustbin(dustbin_id):
    if dustbin_id in dustbins:
        del dustbins[dustbin_id]
        print(f"Deleted dustbin {dustbin_id}")
        return {"success": True, "message": f"Dustbin {dustbin_id} deleted."}
    else:
        return {"success": False, "message": "Dustbin not found."}

@eel.expose
def get_dumping_points():
    return dumping_points

@eel.expose
def add_dumping_point(lat, lng, name):
    new_id = next_id(dumping_points.keys(), "DP")
    try:
        lat = float(lat)
        lng = float(lng)
    except ValueError:
        return {"success": False, "message": "Invalid coordinates."}
    dumping_points[new_id] = {"lat": lat, "lng": lng, "name": name}
    print(f"Added dumping point {new_id} at ({lat}, {lng}) named {name}")
    return {"success": True, "message": f"Dumping point {new_id} added.", "new_id": new_id}

@eel.expose
def delete_dumping_point(dp_id):
    if dp_id in dumping_points:
        del dumping_points[dp_id]
        print(f"Deleted dumping point {dp_id}")
        return {"success": True, "message": f"Dumping point {dp_id} deleted."}
    else:
        return {"success": False, "message": "Dumping point not found."}

@eel.expose
def find_nearest_dumping(dustbin_lat, dustbin_lng):
    nearest = None
    min_dist = float("inf")
    for dp_id, dp in dumping_points.items():
        dist = math.sqrt((dp["lat"] - dustbin_lat)**2 + (dp["lng"] - dustbin_lng)**2)
        if dist < min_dist:
            min_dist = dist
            nearest = {"id": dp_id, "lat": dp["lat"], "lng": dp["lng"], "name": dp["name"], "distance": round(min_dist, 4)}
    return nearest

@eel.expose
def get_heatmap_data():
    counts = {"Full": 0, "Partially Full": 0, "Empty": 0}
    for d in dustbins.values():
        status = d["status"]
        if status in counts:
            counts[status] += 1
    return counts

# ---------------------------
# Start the Application
# ---------------------------
if __name__ == '__main__':
    eel.start("index.html", size=(1300, 900), mode="chrome-app", port=8000, host="localhost", cmdline_args=["--disable-gpu", "--disable-extensions", "--disable-dev-shm-usage", "--no-sandbox", "--disable-setuid-sandbox"])
