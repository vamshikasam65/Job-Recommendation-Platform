import urllib.request
import json
import time

API_BASE = 'http://localhost:5002/api'
ML_BASE = 'http://localhost:5005'

def make_request(url, method='GET', data=None, headers=None):
    req_headers = {'Content-Type': 'application/json'}
    if headers:
        req_headers.update(headers)
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode('utf-8')
        
    req = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            res_body = res.read().decode('utf-8')
            return res.getcode(), json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode('utf-8')
        print(f"HTTPError: {e.code} - Body: {res_body}")
        try:
            return e.code, json.loads(res_body) if res_body else {}
        except Exception:
            return e.code, {"raw_body": res_body}
    except Exception as e:
        print(f"Connection error to {url}: {e}")
        return 0, {}

def run_tests():
    print("=== Testing Flask AI Microservice prediction + learning paths ===")
    status, data = make_request(f"{ML_BASE}/predict", "POST", {"skills": "React, Docker, AWS"})
    if status == 0:
        print("ML Service is unreachable. Please verify python app.py is running on port 5005.")
        return
        
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert "recommendations" in data
    first_rec = data["recommendations"][0]
    assert "learning_paths" in first_rec
    print(f"ML Service: Found {len(first_rec['learning_paths'])} learning path recommendations for missing skills.")
    print(f"Sample paths: {first_rec['learning_paths'][:3]}")
    print("SUCCESS: Flask AI service correctly processes learning path lookup.")

    print("\n=== Testing User Registration ===")
    unique_email = f"test_dev_{int(time.time())}@example.com"
    reg_payload = {"email": unique_email, "password": "securepassword123"}
    status, data = make_request(f"{API_BASE}/auth/register", "POST", reg_payload)
    if status == 0:
        print("Node API server is unreachable. Please verify npm start is running on port 5002.")
        return
        
    assert status == 201, f"Failed registration with status {status}: {data}"
    assert "token" in data
    token = data["token"]
    user_id = data["user"]["id"]
    print(f"SUCCESS: Registered user: {unique_email} (ID: {user_id})")

    print("\n=== Testing User Login ===")
    login_payload = {"email": unique_email, "password": "securepassword123"}
    status, data = make_request(f"{API_BASE}/auth/login", "POST", login_payload)
    assert status == 200
    assert "token" in data
    token = data["token"]
    print("SUCCESS: Logged in successfully. Received JWT Token.")

    print("\n=== Testing Recommendations with Job IDs ===")
    headers = {"Authorization": f"Bearer {token}"}
    status, data = make_request(f"{API_BASE}/recommend", "POST", {"skills": "Python, Flask"}, headers=headers)
    assert status == 200
    first_rec = data["recommendations"][0]
    assert "_id" in first_rec
    job_id = first_rec["_id"]
    print(f"SUCCESS: Matching query returned jobs with MongoDB ObjectID reference: {job_id}")

    print("\n=== Testing Bookmarking Job ===")
    status, data = make_request(f"{API_BASE}/bookmarks", "POST", {"jobId": job_id}, headers=headers)
    assert status == 201
    print("SUCCESS: Bookmarked job.")

    print("\n=== Testing Duplicate Bookmark Prevention ===")
    status, data = make_request(f"{API_BASE}/bookmarks", "POST", {"jobId": job_id}, headers=headers)
    assert status == 400, f"Expected 400 duplicate error, got {status}: {data}"
    print("SUCCESS: Successfully blocked duplicate bookmark saving (HTTP 400).")

    print("\n=== Testing Retrieving Bookmarks ===")
    status, data = make_request(f"{API_BASE}/bookmarks/{user_id}", "GET", headers=headers)
    assert status == 200
    assert len(data) >= 1
    assert data[0]["_id"] == job_id
    print(f"SUCCESS: Retrieved {len(data)} bookmark(s). Validated job ID equivalence.")

    print("\n=== Testing Removing Bookmark ===")
    status, data = make_request(f"{API_BASE}/bookmarks/{job_id}", "DELETE", headers=headers)
    assert status == 200
    print("SUCCESS: Removed bookmark.")

    # Confirm list is now empty
    status, data = make_request(f"{API_BASE}/bookmarks/{user_id}", "GET", headers=headers)
    assert len(data) == 0
    print("SUCCESS: Verified bookmark count is 0 after removal.")

    print("\n=== Testing Unrecognized Skill Warnings ===")
    status, data = make_request(f"{API_BASE}/recommend", "POST", {"skills": "Python, xyz123"}, headers=headers)
    assert status == 200
    assert "warning" in data
    assert "xyz123" in data["warning"]
    print("SUCCESS: Received correct warning message about unrecognized skill 'xyz123'.")

    print("\n=== Testing Completely Unrecognized Skill Rejections ===")
    status, data = make_request(f"{API_BASE}/recommend", "POST", {"skills": "xyz123, abc999"}, headers=headers)
    assert status == 400
    assert "error" in data
    assert "xyz123" in data["error"] and "abc999" in data["error"]
    print("SUCCESS: API correctly rejected completely invalid input with HTTP 400.")

    print("\nAll integration checks passed successfully!")

if __name__ == '__main__':
    run_tests()
